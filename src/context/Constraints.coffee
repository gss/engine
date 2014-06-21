# Convert expressions into cassowary objects
require 'cassowary'

class Constraints
  onConstraint: (node, args, result, operation, continuation, scope) ->
    for arg in args
      if arg
        if arg.path
          (result.paths ||= []).push(arg.path)
        if arg.prop
          (result.props ||= []).push(arg.prop)
    return result

  get: (scope, property, path) ->
    console.log('getting', property, scope, path)
    if typeof @[property] == 'function'
      variable = @[property](scope)
    else
      variable = @var((scope || '') + property)
    variable.path = path || scope || ''
    variable.prop = (scope || '') + property
    return variable

  remove: () ->
    solutions = @engine.solutions
    for path in arguments
      if constraints = solutions[path]
        for constrain in constraints by -1
          solutions.remove(constrain, path)

    return @

  var: (name) ->
    return new c.Variable name: name

  strength: (strength) ->
    return strength

  weight: (weight) ->
    return weight

  varexp: (name) ->
    return new c.Expression name: name

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

for property, method of Constraints::
  method.callback = 'onConstraint'

module.exports = Constraints
