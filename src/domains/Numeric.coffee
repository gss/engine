### Domain: Solved values

Merges values from all other domains, 
enables anonymous constraints on immutable values

###

Domain   = require('../Domain')
Command  = require('../Command')
Variable = require('../Variable')

class Numeric extends Domain
  priority: 200

  # Numeric domains usually dont use worker
  url: null

Numeric::Variable = Variable.extend {},
  get: (path, engine, operation, continuation, scope) ->
    if meta = @getMeta(operation)
      continuation = meta.key
      scope ||= meta.scope && engine.identity[meta.scope] || engine.scope
    return engine.watch(null, path, operation, @delimit(continuation || ''), scope)

Numeric::Variable.Expression = Variable.Expression.extend()
Numeric::Variable.Expression.define(Variable.Expression.algebra)
    
Numeric::Meta = Command.Meta.extend {}, 
  'object': 

    execute: (result) ->
      return result

    descend: (engine, operation) -> 
      meta = operation[0]
      scope = meta.scope && engine.identity[meta.scope] || engine.scope
      [operation[1].command.solve(engine, operation[1], meta.key, scope, undefined, operation[0])]
    
module.exports = Numeric