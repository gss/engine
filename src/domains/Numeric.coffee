### Domain: Solved values

Merges values from all other domains, 
enables anonymous constraints on immutable values

###

Domain  = require('../concepts/Domain')
Selectors = require('../methods/Selectors')

class Numeric extends Domain
  priority: 10

  # Numeric domains usually dont use worker
  url: null

class Numeric::Methods extends Domain::Methods

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
      debugger

      domain = @getVariableDomain(operation, true)
      if !domain || domain.priority < 0
        domain = @
      else if domain != @
        if domain.structured
          console.log('schedule', domain, operation, scope)
          debugger
          @Workflow(domain, operation)
      path = @getPath(object,path)
      watchers = domain.watchers[path]
      #if continuation || !watchers || watchers.indexOf(operation) == -1
      return domain.watch(object, path, operation, @getContinuation(continuation || ""), scope)

for property, value of Selectors::
  Numeric::Methods::[property] = value


Numeric::Methods::['*'].linear = false
Numeric::Methods::['/'].linear = false
module.exports = Numeric