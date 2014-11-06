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

  # Check if it's a single constraint over single unconstrained variable
  # And return the constant part right away without solving
  descend: (engine, operation, continuation, scope) ->
    unless operation.parent.parent?.length > 1
      unless engine.constraints?.length > 0
        if name = @getConstantName(engine, operation, continuation, scope)
          if result = engine.bypass(name, operation, continuation, scope)
            return result
    return super

  # Create a hash that represents substituted variables
  toHash: (meta) ->
    hash = ''
    if meta.values
      for property of meta.values
        hash += property
    return hash

  get: (engine, operation, scope) ->
    return engine.operations?[operation.hash ||= operation.toString()]?[@toHash(scope)]
  
  fetch: (engine, operation) ->
    if operations = engine.operations?[operation.hash ||= operation.toString()]
      for signature, constraint of operations
        if engine.constraints?.indexOf(constraint) > -1
          return constraint

  before: (args, engine, operation, continuation, scope) ->
    # return bypassed solution
    unless args.push
      return args

    return @get(engine, operation, scope)
  
  after: (args, result, engine, operation, continuation, scope) ->
    return ((engine.operations ||= {})[operation.hash ||= operation.toString()] ||= {})[@toHash(scope)] ||= result

  # Only one variable bound to static value
  getConstantName: (engine, operation) ->
    for prop, variable of operation.variables
      if variable.domain.displayName == engine.displayName
        return if name
        name = prop
    return name

module.exports = Constraint