# Convert expressions into cassowary objects
# require 'cassowary'

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
    if typeof @properties[property] == 'function' && scope
      return @properties[property].call(@, scope, path)
    else
      variable = @var(@getPath(scope, property))
    return [variable, path || (property && scope) || '']

  remove: () ->
    for path in arguments
      if constraints = @solutions.variables[path]
        for constrain in constraints by -1
          @solutions.remove(constrain, path)

    return @

  var: (name) ->
    return @solutions.variables[name] ||= new c.Variable name: name

  strength: (strength, deflt = 'medium') ->
    return strength && c.Strength[strength] || c.Strength[deflt]

  weight: (weight) ->
    return weight

  varexp: (name) ->
    return new c.Expression name: name

  '==': (left, right, strength, weight) ->
    return new c.Equation(left, right, @strength(strength), @weight(weight))

  '<=': (left, right, strength, weight) ->
    return new c.Inequality(left, c.LEQ, right, @strength(strength), @weight(weight))

  '>=': (left, right, strength, weight) ->
    return new c.Inequality(left, c.GEQ, right, @strength(strength), @weight(weight))

  '<': (left, right, strength, weight) ->
    return new c.Inequality(left, c.LEQ, right, @strength(strength), @weight(weight))

  '>': (left, right, strength, weight) ->
    return new c.Inequality(left, c.GEQ, right, @strength(strength), @weight(weight))

  '+': (left, right, strength, weight) ->
    return c.plus(left, right)

  '-': (left, right, strength, weight) ->
    return c.minus(left, right)

  '*': (left, right, strength, weight) ->
    return c.times(left, right)

  '/': (left, right, strength, weight) ->
    return c.divide(left, right)

for property, method of Constraints::
  # Overload cassowary helpers so they can use [variable, path] pairs
  # in place of simple variables
  if method.length > 3 && property != 'onConstraint'
    do (property, method) ->
      Constraints::[property] = (left, right, strength, weight) ->
        if left.push
          overloaded = left = @onConstraint(null, null, left)
        if right.push
          overloaded = right = @onConstraint(null, null, right)
        value = method.call(@, left, right, strength, weight)
        if overloaded
          return @onConstraint(null, [left, right], value)
        return value
  Constraints::[property].after = 'onConstraint'



module.exports = Constraints
