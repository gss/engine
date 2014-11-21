### Domain: Solved values

Merges values from all other domains, 
enables anonymous constraints on immutable values

###

Domain   = require('../concepts/Domain')
Command  = require('../concepts/Command')
Variable = require('../commands/Variable')
Block    = require('../commands/Block')

class Numeric extends Domain
  priority: 10

  # Numeric domains usually dont use worker
  url: null

Numeric::Variable = Variable.extend {},
  get: (path, engine, operation, continuation, scope) ->
    continuation ||= @getMeta(operation)?.key
    return engine.watch(null, path, operation, engine.Continuation(continuation || ""), scope)

Numeric::Variable.Expression = Variable.Expression.extend()
Numeric::Variable.Expression.define(Variable.Expression.algebra)
    
Numeric::Block = Block.extend()
Numeric::Block.Meta = Block.Meta.extend {
  signature: [
    body: ['Any']
  ]
}, 
  'object': 

    execute: (result) ->
      return result

    descend: (engine, operation) -> 
      meta = operation[0]
      scope = meta.scope && engine.identity[meta.scope] || engine.scope
      [operation[1].command.solve(engine, operation[1], meta.key, scope, undefined, operation[0])]
    
module.exports = Numeric