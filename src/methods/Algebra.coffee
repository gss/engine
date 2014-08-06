# Numerical functions that operate on primitive values
# Domains overwrite many of these with

class Algebra

  "&&": (a, b) ->
    return a && b

  "||": (a, b) ->
    return a || b

  "!=": (a, b) ->
    return a == b

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

  'solved': (value) ->
    return value


  for property, fn of Algebra::
    if typeof fn == 'function'
      fn = do (property, fn) ->
        func = Algebra::[property] = (a, b) ->
          ap = @isPrimitive(a)
          bp = @isPrimitive(b)
          if ap && bp
            return fn.apply(@, arguments)
          return [property, a, b]
      fn.binary = true
Algebra::['*'].linear = false
Algebra::['/'].linear = false

module.exports = Algebra