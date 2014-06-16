# Convert expressions into cassowary objects
require 'cassowary'

class Constraints
  onConstraint: (engine, scope, args, result, operation, continuation) ->
    for arg in args
      if arg.path
        (result.paths ||= []).push(arg.path)
    return result

  get: (property, scope, path) ->
    if typeof @[property] == 'function'
      variable = @[property](scope)
    else
      variable = @var((scope || '') + property)
    variable.path = path + (scope || '') if path
    return variable

  remove: () ->
    solutions = @engine.solutions
    for path in arguments
      if constraints = solutions[path]
        for constrain in constraints
          solutions.remove(constrain)
          for other in constrain.paths
            unless other == path
              if group = solutions[path]
                if index = group.indexOf(constrain) > -1
                  group.splice(index, 1)
                unless group.length
                  delete solutions[path] 
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
