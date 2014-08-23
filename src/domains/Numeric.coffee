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


Numeric::Methods::['*'].linear = false
Numeric::Methods::['/'].linear = false
module.exports = Numeric