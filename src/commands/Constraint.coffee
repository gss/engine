Command = require('../concepts/Command')

Constraint = Command.extend
  type: 'Constraint'
  
  signature: [
  	left:     ['Value', 'Number'],
  	right:    ['Value', 'Number']
  	[
  		strength: ['String']
  		weight:   ['Number']
  	]
  ]

  # Create a hash that represents substituted variables
  toHash: (meta) ->
    hash = ''
    if meta.values
      for property of meta.values
        hash += property
    return hash

  get: (engine, operation, scope) ->
    return engine.operations?[operation.hash ||= @toExpression(operation)]?[@toHash(scope)]
  
  fetch: (engine, operation) ->
    if operations = engine.operations?[operation.hash ||= @toExpression(operation)]
      for signature, constraint of operations
        if engine.constraints?.indexOf(constraint) > -1
          return constraint

  before: (args, engine, operation, continuation, scope, ascender, ascending) ->
    return @get(engine, operation, ascending)
  
  after: (args, result, engine, operation, continuation, scope, ascender, ascending) ->
    if result.hashCode
      return ((engine.operations ||= {})[operation.hash ||= @toExpression(operation)] ||= {})[@toHash(ascending)] ||= result
    return result

module.exports = Constraint