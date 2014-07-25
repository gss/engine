# Functions are only called for primitive values
# When it encounters variables, it leaves expression to solver

class Algebra

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
      func = Algebra::[property] = (a, b, operation, continuation, scope, meta) ->
        ap = @isPrimitive(a)
        bp = @isPrimitive(b)
        if !ap && !bp
          if func.linear == false
            a = @toPrimitive(a, operation[1], continuation)
            b = @toPrimitive(b, operation[2], continuation)
            ap = @isPrimitive(a)
            bp = @isPrimitive(b)
        if ap && bp
          return fn.apply(@, arguments)
        if !ap && !bp && func.linear == false
          @console.warn(operation, 'is not linear, both operands are unknown')
        return [property, a, b]
    fn.binary = true
    fn.meta = true
Algebra::['*'].linear = false
Algebra::['/'].linear = false

module.exports = Algebra