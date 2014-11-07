Command = require('../concepts/Command')

class Constraint extends Command
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

  before: (args, engine, operation, continuation, scope) ->
    return @get(engine, operation, scope)
  
  after: (args, result, engine, operation, continuation, scope) ->
    if result.hashCode
      return ((engine.operations ||= {})[operation.hash ||= @toExpression(operation)] ||= {})[@toHash(scope)] ||= result
    return result

  # Only one variable bound to static value
  getConstantName: (engine, operation) ->
    for prop, variable of operation.variables
      if variable.domain.displayName == engine.displayName
        return if name
        name = prop
    return name

module.exports = Constraint