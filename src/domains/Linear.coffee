Domain     = require('../Domain')
Command    = require('../Command')
Variable   = require('../Variable')
Constraint = require('../Constraint')

class Linear extends Domain
  priority: 0

  Solver:  require('cassowary')

  setup: () ->
    super
    unless @hasOwnProperty('solver')
      @solver = new c.SimplexSolver()
      @solver.autoSolve = false
      @solver._store = []
      if @console.level > 1
        c.debug = true
        c.trace = true
      c.Strength.require = c.Strength.required

      Linear.hack()

  perform: ->
    if @constrained
      @constrained = @suggested = undefined
      if @solver._needsSolving
        @solver.solve()
        return @solver._changed
    else if @suggested
      @suggested = undefined
      @solver.resolve()
      return @solver._changed

  unedit: (variable) ->
    if constraint = @editing?['%' + (variable.name || variable)]
      #@solver.removeConstraint(constraint)
      cei = @solver._editVarMap.get(constraint.variable);
      @solver.removeColumn(cei.editMinus);
      @solver._editVarMap.delete(constraint.variable);

      #@removeConstraint(constraint)

  edit: (variable, strength, weight, continuation) ->
    unless @editing?[variable.name]
      constraint = new c.EditConstraint(variable, @strength(strength, 'strong'), @weight(weight))
      constraint.variable = variable
      @Constraint::inject @, constraint
      (@editing ||= {})[variable.name] = constraint
    
    return constraint

  nullify: (variable, full) ->
    @solver._externalParametricVars.delete(variable)
    variable.value = 0
    #if full
    #@solver.rows.delete(variable)

  suggest: (path, value, strength, weight, continuation) ->
    if typeof path == 'string'
      unless variable = @variables[path]
        variable = @Variable::declare(@, path)
    else
      variable = path

    @edit(variable, strength, weight, continuation)
    @solver.suggestValue(variable, value)
    @suggested = true
    return variable

  variable: (name) ->
    return new c.Variable name: name

  strength: (strength, byDefault = 'medium') ->
    return strength && c.Strength[strength] || c.Strength[byDefault]

  weight: (weight, operation) ->
    if index = operation?.parent[0].index
      return index / 1000
    return weight

# Capture values coming from other domains
Linear.Mixin =
  yield: (result, engine, operation, continuation, scope, ascender) ->
    if typeof result == 'number'
      return operation.parent.domain.suggest('%' + operation.command.toExpression(operation), result, 'require')


Linear::Constraint = Constraint.extend {

  before: (args, engine, operation, continuation, scope, ascender, ascending) ->
    return @get(engine, operation, ascending)

  after: (args, result, engine, operation, continuation, scope, ascender, ascending) ->
    if result.hashCode
      return ((engine.linear.operations ||= {})[operation.hash ||= @toExpression(operation)] ||= {})[@toHash(ascending)] ||= result
    return result

  # Get cached operation by expression and set of input variables
  get: (engine, operation, scope) ->
    return engine.linear.operations?[operation.hash ||= @toExpression(operation)]?[@toHash(scope)]
  
  yield: Linear.Mixin.yield

  inject: (engine, constraint) ->
    engine.solver.addConstraint(constraint)

  eject: (engine, constraint) ->
    engine.solver.removeConstraint(constraint)

},
  '==': (left, right, strength, weight, engine, operation) ->
    return new c.Equation(left, right, engine.strength(strength), engine.weight(weight, operation))

  '<=': (left, right, strength, weight, engine, operation) ->
    return new c.Inequality(left, c.LEQ, right, engine.strength(strength), engine.weight(weight, operation))

  '>=': (left, right, strength, weight, engine, operation) ->
    return new c.Inequality(left, c.GEQ, right, engine.strength(strength), engine.weight(weight, operation))

  '<': (left, right, strength, weight, engine, operation) ->
    return new c.Inequality(left, c.LEQ, engine['+'](right, 1), engine.strength(strength), engine.weight(weight, operation))

  '>': (left, right, strength, weight, engine, operation) ->
    return new c.Inequality(left, c.GEQ, engine['+'](right, 1), engine.strength(strength), engine.weight(weight, operation))


Linear::Variable = Variable.extend Linear.Mixin,
  get: (path, engine, operation) ->
    variable = @declare(engine, path)
    engine.unedit(variable)
    return variable
    
Linear::Variable.Expression = Variable.Expression.extend Linear.Mixin,
  
  '+': (left, right) ->
    return c.plus(left, right)

  '-': (left, right) ->
    return c.minus(left, right)

  '*': (left, right) ->
    return c.times(left, right)

  '/': (left, right) ->
    return c.divide(left, right)

# Handle constraints wrapped into meta constructs provided by Abstract
Linear::Meta = Command.Meta.extend {}, 
  'object': 
    execute: (constraint, engine, operation) ->
      if constraint?.hashCode?
        operation[1].command.add(constraint, engine, operation[1], operation[0].key)

    descend: (engine, operation) -> 
      operation[1].parent = operation
      [
        operation[1].command.solve(engine, operation[1], '', undefined, undefined, operation[0])
        engine, 
        operation
      ]

Linear::Stay = Command.extend {
  signature: [
    value: ['Variable']
  ]
},
  stay: (value, engine, operation) ->
    engine.suggested = true;
    engine.solver.addStay(value)
    return

Linear::Remove = Command.extend {
  extras: 1

  signature: false
},

  remove: (args ..., engine) ->
    engine.remove.apply(engine, args)




# Phantom js doesnt enforce order of numerical keys in plain objects.
# The hack enforces arrays as base structure.
Linear.hack = ->
  unless c.isUnordered?
    obj = {9: 1, 10: 1}
    for property of obj
      break
    if c.isUnordered = (property == 10)
      set = c.HashTable.prototype.set
      c.HashTable.prototype.set = ->
        if !@_store.push
          store = @_store
          @_store = []
          for property of store
            @_store[property] = store[property]

        return set.apply(@, arguments)
module.exports = Linear
