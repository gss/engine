Domain     = require('../Domain')
Command    = require('../Command')
Variable   = require('../commands/Variable')
Constraint = require('../commands/Constraint')
c          = require('cassowary')

c.Strength.require = c.Strength.required

class Linear extends Domain
  displayName: 'Linear'
  
  priority: 0

  Engine:  c

  construct: () ->
    @paths    ?= {}
    @instance = new c.SimplexSolver()
    @instance.autoSolve = false
    #@instance._store = []
    if @console.level > 2
      c.debug = true
      c.trace = true

  perform: ->
    if @constrained
      @constrained = @suggested = undefined
      if @instance._needsSolving
        @instance.solve()
        return @instance._changed
    else if @suggested
      @suggested = undefined
      @instance.resolve()
      return @instance._changed

  unedit: (variable) ->
    if constraint = @editing?['%' + (variable.name || variable)]
      #@instance.removeConstraint(constraint)
      cei = @instance._editVarMap.get(constraint.variable)
      @instance.removeColumn(cei.editMinus)
      @instance._editVarMap.delete(constraint.variable)
      delete @editing[(variable.name || variable)]

      #@removeConstraint(constraint)

  edit: (variable, strength, weight, continuation) ->
    unless @editing?[variable.name]
      constraint = new c.EditConstraint(variable, @strength(strength, 'strong'), @weight(weight))
      constraint.variable = variable
      @Constraint::inject @, constraint
      (@editing ||= {})[variable.name] = constraint

    return constraint

  nullify: (variable, full) ->
    @instance._externalParametricVars.delete(variable)
    variable.value = 0
    #if full
    #@instance.rows.delete(variable)

  suggest: (path, value, strength, weight, continuation) ->
    if typeof path == 'string'
      unless variable = @variables[path]
        variable = @Variable::declare(@, path)
    else
      variable = path

    @edit(variable, strength, weight, continuation)
    @instance.suggestValue(variable, value)
    variable.value = value
    @suggested = true
    return variable

  variable: (name) ->
    return new c.Variable name: name

  strength: (strength, byDefault = 'medium') ->
    return strength && c.Strength[strength] || c.Strength[byDefault]

  weight: (weight, operation) ->
    #if index = operation?.parent[0].index
    #  return index / 1000
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
      return ((engine.operations ||= {})[operation.hash ||= @toExpression(operation)] ||= {})[@toHash(ascending)] ||= result
    return result

  # Get cached operation by expression and set of input variables
  get: (engine, operation, scope) ->
    return engine.operations?[operation.hash ||= @toExpression(operation)]?[@toHash(scope)]

  yield: Linear.Mixin.yield

  inject: (engine, constraint) ->
    engine.instance.addConstraint(constraint)

  eject: (engine, constraint) ->
    engine.instance.removeConstraint(constraint)

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

# Handle constraints wrapped into meta constructs provided by Input
Linear::Meta = Command.Meta.extend {},
  'object':
    execute: (constraint, engine, operation) ->
      if constraint?.hashCode?
        operation[1].command.add(constraint, engine, operation[1], operation[0].key)

    descend: (engine, operation) -> 

      if meta = operation[0]
        continuation = meta.key
        scope = meta.scope && engine.identity[meta.scope] || engine.scope

      operation[1].parent = operation
      [
        operation[1].command.solve(engine, operation[1], continuation, scope, undefined, operation[0])
        engine, 
        operation
      ]

Linear::Stay = Command.extend {
  signature: [
    value: ['Variable']
  ]
},
  stay: (value, engine, operation) ->
    engine.suggested = true
    engine.instance.addStay(value)
    return

Linear::Remove = Command.extend {
  extras: 1

  signature: false
},

  remove: (args ..., engine) ->
    engine.remove.apply(engine, args)




# Phantom js doesnt enforce order of numerical keys in plain objects.
# The hack enforces arrays as base structure.
do ->
  unless c.isUnordered?
    obj = {'10': 1, '9': 1}
    for property of obj
      break
    if c.isUnordered = (property > 9)
      set = c.HashTable.prototype.set
      c.HashTable.prototype.set = ->
        if !@_store.push
          store = @_store
          @_store = []
          for property of store
            @_store[property] = store[property]

        return set.apply(@, arguments)
module.exports = Linear
