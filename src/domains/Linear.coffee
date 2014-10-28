Domain     = require('../concepts/Domain')
Command    = require('../concepts/Command')
Value      = require('../commands/Value')
Constraint = require('../commands/Constraint')


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

  provide: (result) ->
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
    if variable.editing
      if cei = @solver._editVarMap.get(variable)
        @solver.removeColumn(cei.editMinus)
        @solver._editVarMap.delete(variable)
      super

  edit: (variable, strength, weight, continuation) ->
    unless constraint = variable.editing
      constraint = new c.EditConstraint(variable, @strength(strength, 'strong'), @weight(weight))
      constraint.paths = [variable]
      @addConstraint constraint
      variable.editing = constraint
      @constrained ||= []
    
    return constraint

  nullify: (variable) ->
    @solver._externalParametricVars.delete(variable)
    @solver._externalRows.delete(variable)

  suggest: (path, value, strength, weight, continuation) ->
    if typeof path == 'string'
      unless variable = @variables[path]
        if continuation
          variable = @declare(path)
          variables = (@variables[continuation] ||= [])
          variables.push(variable)
        else
          return @verify path, value
    else
      variable = path

    @edit(variable, strength, weight, continuation)
    @solver.suggestValue(variable, value)
    @suggested = true
    return variable

  variable: (name) ->
    return new c.Variable name: name

  stay: ->
    @suggested = true
    for arg in arguments
      @solver.addStay(arg)
    return

  strength: (strength, byDefault = 'medium') ->
    return strength && c.Strength[strength] || c.Strength[byDefault]

  weight: (weight) ->
    return weight

Linear.Constraint = Command.extend.call Constraint, {},
  '==': (left, right, strength, weight) ->
    return new c.Equation(left, right, engine.strength(strength), engine.weight(weight))

  '<=': (left, right, strength, weight, engine) ->
    return new c.Inequality(left, c.LEQ, right, engine.strength(strength), engine.weight(weight))

  '>=': (left, right, strength, weight, engine) ->
    return new c.Inequality(left, c.GEQ, right, engine.strength(strength), engine.weight(weight))

  '<': (left, right, strength, weight, engine) ->
    return new c.Inequality(left, c.LEQ, engine['+'](right, 1), engine.strength(strength), engine.weight(weight))

  '>': (left, right, strength, weight, engine) ->
    return new c.Inequality(left, c.GEQ, engine['+'](right, 1), engine.strength(strength), engine.weight(weight))

Linear.Value            = Value.extend()
Linear.Value.Solution   = Value.Solution.extend()
Linear.Value.Variable   = Value.Variable.extend {group: 'linear'},
  get: (path, tracker, engine, operation, continuation, scope) ->
    variable = engine.declare(path, operation)
    if variable.constraints
      for constrain in variable.constraints
        if constrain.domain && constrain.domain.frame && constrain.domain.frame != engine.frame
          delete engine.added[absolute]
          return variable.value 
    return [path, tracker || '']
    
Linear.Value.Expression = Value.Expression.extend {group: 'linear'},

  '+': (left, right) ->
    return c.plus(left, right)

  '-': (left, right) ->
    return c.minus(left, right)

  '*': (left, right) ->
    return c.times(left, right)

  '/': (left, right) ->
    return c.divide(left, right)

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
