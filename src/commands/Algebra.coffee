class Algebra
  # Functions are only called for primitive values
  # When it encounters variables, it leaves expression to solver
  isPrimitive: (object) ->
    # Objects are allowed only if they define custom valueOf function
    if typeof object == 'object'
      return object.valueOf != Object.prototype.valueOf
    return true

  eq: (a, b) ->
    return a == b

  lte: (a, b) ->
    return a <= b

  gte: (a, b) ->
    return a >= b

  lt: (a, b) ->
    return a < b

  gt: (a, b) ->
    return a > b

  plus: (a, b) ->
    return a + b

  minus: (a, b) ->
    return a - b

  multiply: (a, b) ->
    return a * b

  divide: (a, b) ->
    return a / b

for property, fn of Algebra::
  unless property == 'isPrimitive'
    fn = do (property, fn) ->
      Algebra::[property] = (a, b) ->
        return NaN unless @_isPrimitive(a) && @_isPrimitive(b)
        return fn.apply(@, arguments)
    fn.binary = true

module.exports = Algebra