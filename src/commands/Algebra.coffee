class Algebra
  # Functions are only called for primitive values
  # When it encounters variables, it leaves expression to solver
  isPrimitive: (object) ->
    # Objects are allowed only if they define custom valueOf function
    if typeof object == 'object'
      return object.valueOf != Object.prototype.valueOf
    return true

  "&&": (a, b) ->
    return a && b

  "||": (a, b) ->
    return a || b

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

  'Math': Math
  'Infinity': Infinity
  'NaN': NaN

for property, fn of Algebra::
  unless property == 'isPrimitive'
    fn = do (property, fn) ->
      Algebra::[property] = (a, b) ->
        args = [property]
        args.push.apply(args, arguments)
        return args unless @isPrimitive(a) && @isPrimitive(b)
        return fn.apply(@, arguments)
    fn.binary = true

module.exports = Algebra