### Domain: Solved values

Merges values from all other domains, 
enables anonymous constraints on immutable values

###

Domain  = require('../concepts/Domain')
Command = require('../concepts/Command')
Value   = require('../commands/Value')

class Numeric extends Domain
  priority: 10

  # Numeric domains usually dont use worker
  url: null

Numeric.Value            = Value.extend()
Numeric.Value.Solution   = Value.Solution.extend()
Numeric.Value.Variable   = Value.Variable.extend {group: 'linear'},
  get: (path, tracker, scoped, engine, operation, continuation, scope) ->
    domain = engine.Variable.getDomain(operation, true, true)
    if !domain || domain.priority < 0
      domain = engine
    else if domain != engine
      if domain.structured
        clone = ['get', null, path, engine.Continuation(continuation || "")]
        if scope && scope != engine.scope
          clone.push(engine.identity.provide(scope))
        clone.parent = operation.parent
        clone.index = operation.index
        clone.domain = domain
        engine.update([clone])
        return
    if scoped
      scoped = engine.identity.solve(scoped)
    else
      scoped = scope
    return domain.watch(null, path, operation, engine.Continuation(continuation || contd || ""), scoped)
    
Numeric.Value.Expression = Value.Expression.extend {group: 'linear'},

  "+": (left, right) ->
    return left + right

  "-": (left, right) ->
    return left - right

  "*": (left, right) ->
    return left * right

  "/": (left, right) ->
    return left / right
    
    
module.exports = Numeric