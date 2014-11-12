Domain     = require('../concepts/Domain')
Command    = require('../concepts/Command')
Value      = require('../commands/Value')
Constraint = require('../commands/Constraint')
Block      = require('../commands/Block')
Call       = require('../commands/Call')


class Linear extends Domain
  priority: -100

  Solver:  require('cassowary')

  setup: () ->
    super

    unless @hasOwnProperty('solver')
      @solver = new c.SimplexSolver()
      @solver.autoSolve = false
      @solver._store = []
      c.debug = true
      c.Strength.require = c.Strength.required

      Linear.hack()

  yield: (result) ->
    @constrain(result)
    return

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

  addConstraint: (constraint) ->
    @solver.addConstraint(constraint)

  removeConstraint: (constraint) ->
    @solver.removeConstraint(constraint)

  unedit: (variable) ->
    if constraint = @editing?['%' + variable.name]

      cei = @solver._editVarMap.get(constraint.variable);
      @solver.removeColumn(cei.editMinus);
      @solver._editVarMap.delete(constraint.variable);

      #@removeConstraint(constraint)

  edit: (variable, strength, weight, continuation) ->
    unless @editing?[variable.name]
      constraint = new c.EditConstraint(variable, @strength(strength, 'strong'), @weight(weight))
      constraint.variable = variable
      @addConstraint constraint
      (@editing ||= {})[variable.name] = constraint
      @constrained ||= []
    
    return constraint

  nullify: (variable) ->
    @solver._externalParametricVars.delete(variable)
    @solver._externalRows.delete(variable)

  suggest: (path, value, strength, weight, continuation) ->
    if typeof path == 'string'
      unless variable = @variables[path]
        variable = @declare(path)
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

  weight: (weight) ->
    return weight

# Capture values coming from other domains
Linear.Mixin =
  yield: (result, engine, operation, continuation, scope, ascender) ->
    if typeof result == 'number'
      return operation.parent.domain.suggest('%' + operation.command.toExpression(operation), result, 'require')


Linear::Constraint = Command.extend.call Constraint, Linear.Mixin,
  '==': (left, right, strength, weight, engine) ->
    return new c.Equation(left, right, engine.strength(strength), engine.weight(weight))

  '<=': (left, right, strength, weight, engine) ->
    return new c.Inequality(left, c.LEQ, right, engine.strength(strength), engine.weight(weight))

  '>=': (left, right, strength, weight, engine) ->
    return new c.Inequality(left, c.GEQ, right, engine.strength(strength), engine.weight(weight))

  '<': (left, right, strength, weight, engine) ->
    return new c.Inequality(left, c.LEQ, engine['+'](right, 1), engine.strength(strength), engine.weight(weight))

  '>': (left, right, strength, weight, engine) ->
    return new c.Inequality(left, c.GEQ, engine['+'](right, 1), engine.strength(strength), engine.weight(weight))


Linear::Value            = Value.extend(Linear.Mixin)
Linear::Value.Variable   = Value.Variable.extend Linear.Mixin,
  get: (path, engine, operation) ->
    variable = engine.declare(path, operation)
    engine.unedit(variable)
    return variable
    
Linear::Value.Expression = Value.Expression.extend Linear.Mixin,
  
  '+': (left, right) ->
    return c.plus(left, right)

  '-': (left, right) ->
    return c.minus(left, right)

  '*': (left, right) ->
    return c.times(left, right)

  '/': (left, right) ->
    return c.divide(left, right)

Linear::Block = Block.extend()
Linear::Block.Meta = Block.Meta.extend {
  signature: [
    body: ['Any']
  ]
}, 
  'object': 
    execute: (constraint, engine, operation) ->
      if constraint
        if !constraint.hashCode
          return constraint
        if constraint
          engine.constrain(constraint, operation[1], operation[0])

    descend: (engine, operation) -> 
      operation[1].parent = operation
      [
        operation[1].command.solve(engine, operation[1], '', operation[0])
        engine, 
        operation
      ]


Linear::Call = Call.extend {},
  'stay': (value, engine, operation) ->
    engine.suggested = true;
    engine.solver.addStay(value)
    return

Linear::Call.Unsafe = Call.Unsafe.extend {
  extras: 1
},

  'remove': ->
    args = Array.prototype.slice.call(arguments)
    engine = args.pop()
    engine.remove.apply(engine, remove)




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
