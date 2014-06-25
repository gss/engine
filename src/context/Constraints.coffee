# Convert expressions into cassowary objects
require 'cassowary'

class Constraints
  onConstraint: (node, args, result, operation, continuation, scope) ->
    # variable[paths] -> constrain[paths]
    if result instanceof c.Constraint || result instanceof c.Expression
      result = [result]
      for arg in args
        if arg instanceof c.Variable
          result.push(arg)
        if arg.paths
          result.push.apply(result, arg.paths)
          arg.paths = undefined
    # [variable, path] -> variable[paths]
    if result.length > 0
      if result.length > 1
        result[0].paths = result.splice(1)
      return result[0]
    return result

  get: (scope, property, path) ->
    if typeof @[property] == 'function'
      return @[property](scope, path)
    else
      variable = @var((scope || '') + (property || ''))
    return [variable, path || (property && scope) || '']

  remove: () ->
    solutions = @engine.solutions
    for path in arguments
      if constraints = solutions[path]
        for constrain in constraints by -1
          solutions.remove(constrain, path)

    return @

  var: (name) ->
    return @engine.solutions[name] ||= new c.Variable name: name

  strength: (strength) ->
    return c.Strength[strength]

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
    return c.divide(left, right)

for property, method of Constraints::
  # Overload cassowary helpers so they can use [variable, path] pairs
  # in place of simple variables
  if method.length > 3 && property != 'onConstraint'
    do (property, method) ->
      Constraints::[property] = (left, right, strength, weight) ->
        if left.push
          overloaded = left = Constraints::onConstraint(null, null, left)
        if right.push
          overloaded = right = Constraints::onConstraint(null, null, right)

        if overloaded
          debugger
        value = method.call(@, left, right, strength, weight)
        if overloaded
          debugger
          return Constraints::onConstraint(null, [left, right], value)
        return value
  Constraints::[property].callback = 'onConstraint'


module.exports = Constraints
