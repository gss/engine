# Convert expressions into cassowary objects
require 'cassowary'

class Constraints
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
    return c.Expression name: name

  eq: (left, right, strength, weight) ->
    return new c.Equation(left, right, @strength(strength), @weight(weight))

  lte: (left, right, strength, weight) ->
    return new c.Inequality(left, c.LEQ, right, @strength(strength), @weight(weight))

  gte: (left, right, strength, weight) ->
    return new c.Inequality(left, c.GEQ, right, @strength(strength), @weight(weight))

  lt: (left, right, strength, weight) ->
    return new c.Inequality(left, c.LEQ, right, @strength(strength), @weight(weight))

  gt: (left, right, strength, weight) ->
    return new c.Inequality(left, c.GEQ, right, @strength(strength), @weight(weight))

  plus: (left, right, strength, weight) ->
    return c.plus(left, right)

  minus: (left, right, strength, weight) ->
    return c.minus(left, right)

  multiply: (left, right, strength, weight) ->
    return c.times(left, right)

  divide: (left, right, strength, weight) ->
    return c.divide(a, right)


for property, command of Constraints::
  if command && command.type == 'constraint'
    command.callback = 'onConstraint'
module.exports = Constraints
