### Domain: Solved values

Merges values from all other domains, 
enables anonymous constraints on immutable values

###

Domain  = require('../concepts/Domain')

class Numeric extends Domain
  priority: 0

  class Numeric::Methods
    "==": (a, b) ->
      return b

    "<=": (a, b) ->
      return Math.min(a, b)

    ">=": (a, b) ->
      return Math.max(a, b)

    "<": (a, b) ->
      return Math.min(a, b - 1)

    ">": (a, b) ->
      return Math.max(a, b + 1)

    isVariable: (object) ->
      return object[0] == 'get'

    isConstraint: (object) ->
      return @constraints[object[0]]

    get: 
      command: (operation, continuation, scope, meta, object, path) ->
        return @watch(object, path, operation, @getContinuation(continuation || ""), scope)


module.exports = Numeric