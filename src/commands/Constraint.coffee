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

  before: (args) ->
    return args unless args.push

  # Only one variable bound to static value
  getConstantName: (engine, operation) ->
    for prop, variable of operation.variables
      if variable.domain.displayName == engine.displayName
        return if name
        name = prop
    return name

module.exports = Constraint