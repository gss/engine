# Convert expressions into cassowary objects
require 'cassowary'

class Constraints
  constructor: (@input, @output) ->
    @solver = new c.SimplexSolver()

  onConstraint: (engine, scope, args, result, operation, continuation) ->
    @solver.addConstraint(result)
    
  get: (property, scope) ->
    if typeof @[property] == 'function'
      return @[property](scope)
    return @var((scope || '') + property)

  var: (name) ->
    return new c.Variable name: name

  strength: (strength) ->
    return strength

  weight: (weight) ->
    return weight

  varexp: (name) ->
    return new c.Expression name: name

  eq: (path, left, right, strength, weight) ->
    return new c.Equation(left, right, @strength(strength), @weight(weight))

  lte: (path, left, right, strength, weight) ->
    return c.Inequality(left, c.LEQ, right, @strength(strength), @weight(weight))

  gte: (left, right, strength, weight) ->
    return c.Inequality(left, c.GEQ, right, @strength(strength), @weight(weight))

  lt: (left, right, strength, weight) ->
    return c.Inequality(left, c.LEQ, right, @strength(strength), @weight(weight))

  gt: (left, right, strength, weight) ->
    return c.Inequality(left, c.GEQ, right, @strength(strength), @weight(weight))

  plus: (left, right, strength, weight) ->
    return c.plus(left, right)

  minus: (left, right, strength, weight) ->
    return c.minus(left, right)

  multiply: (left, right, strength, weight) ->
    return c.times(left, right)

  divide: (left, right, strength, weight) ->
    return c.divide(a, right)

  edit: (variable) ->
    @solver.addEditVar(variable)

  suggest: (variable, value, strength, weight) ->
    @solver.solve()
    @edit variable, @strength(strength), @weight(weight)
    @solver.suggestValue(variable, value)
    @solver.resolve()

  stay: (path, v) ->
    for i in [1..arguments.length]
      @solver.addStay(v)
    return

for property, command of Constraints::
  if command && command.type == 'constraint'
    command.callback = 'onConstraint'
module.exports = Constraints
