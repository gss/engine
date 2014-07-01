class Algebra
  # Functions are only called for primitive values
  # When it encounters variables, it leaves expression to solver
  isPrimitive: (object) ->
    # Objects are allowed only if they define custom valueOf function
    if typeof object == 'object'
      return object.valueOf != Object.prototype.valueOf
    return true

  "==": (a, b) ->
    return a == b

  "<=": (a, b) ->
    return a <= b

  ">=": (a, b) ->
    return a >= b

  "<": (a, b) ->
    return a < b

  ">": (a, b) ->
    return a > b

  "+": (a, b) ->
    return a + b

  "-": (a, b) ->
    return a - b

  "*": (a, b) ->
    return a * b

  "/": (a, b) ->
    return a / b

for property, fn of Algebra::
  unless property == 'isPrimitive'
    fn = do (property, fn) ->
      Algebra::[property] = (a, b) ->
        return NaN unless @_isPrimitive(a) && @_isPrimitive(b)
        return fn.apply(@, arguments)
    fn.binary = true

module.exports = Algebra