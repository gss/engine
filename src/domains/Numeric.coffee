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

Numeric::Value            = Value.extend()
Numeric::Value.Variable   = Value.Variable.extend {},
  get: (path, engine, operation, continuation, scope) ->
    return engine.watch(null, path, operation, engine.Continuation(continuation || ""), scope)
Numeric::Value.Expression = Value.Expression.extend()
Numeric::Value.Expression.define(Value.Expression.algebra)
    
  #domain = engine.getVariableDomain(operation, true, true)
  #if !domain || domain.priority < 0
  #  domain = engine
  #else if domain != engine
  #  if domain.structured
  #    clone = ['get', null, path, engine.Continuation(continuation || "")]
  #    if scope && scope != engine.scope
  #      clone.push(engine.identity.yield(scope))
  #    clone.parent = operation.parent
  #    clone.index = operation.index
  #    clone.domain = domain
  #    engine.update([clone])
  #    return
  #if scoped
  #  scoped = engine.identity.solve(scoped)
  #else
  #  scoped = scope

    
module.exports = Numeric