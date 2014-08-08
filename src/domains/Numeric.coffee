### Domain: Solved values

Merges values from all other domains, 
enables anonymous constraints on immutable values

###

Domain  = require('../concepts/Domain')

class Numeric extends Domain
  priority: 10

  # Numeric domains usually dont use worker
  url: null

class Numeric::Methods

  "&&": (a, b) ->
    return a && b

  "||": (a, b) ->
    return a || b

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


  isVariable: (object) ->
    return object[0] == 'get'

  isConstraint: (object) ->
    return @constraints[object[0]]

  get: 
    command: (operation, continuation, scope, meta, object, path) ->
      return @watch(object, path, operation, @getContinuation(continuation || ""), scope)



for property, fn of Numeric::Methods::
  if typeof fn == 'function'
    fn = do (property, fn) ->
      func = Numeric::Methods::[property] = (a, b) ->
        ap = @isPrimitive(a)
        bp = @isPrimitive(b)
        if ap && bp
          return fn.apply(@, arguments)
        return [property, a, b]
    fn.binary = true

Numeric::Methods::['*'].linear = false
Numeric::Methods::['/'].linear = false
module.exports = Numeric