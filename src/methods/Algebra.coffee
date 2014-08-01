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

  get:
    command: (operation, continuation, scope, meta, object, property) ->
      if typeof object == 'string'
        id = object

      # Get document property
      else if object.absolute is 'window' || object == document
        id = '::window'

      # Get element property
      else if object.nodeType
        id = @identity.provide(object)

      unless property
        # Get global variable
        id = ''
        property = object
        object = undefined

      return ['get', id, property, @getContinuation(continuation || '')]

  set:
    command: ->
      object = @intrinsic || @assumed
      object.set.apply(object, arguments)

  suggest:
    command: ->
      @assumed.set.apply(@assumed, arguments)

  vary: (value) ->
    return value
      
Algebra::['*'].linear = false
Algebra::['/'].linear = false
Algebra::vary .hidden = true

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

module.exports = Algebra