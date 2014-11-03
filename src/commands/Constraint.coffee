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

class Constraint.Constant extends Constraint

  # Only one variable bound to static value
  condition: (left, right) ->
    variable = null
    if left.variables
      for name of left.variables
        return if variable
        variable = name 
    if right.variables
      for name of right.variables
        return if variable
        variable = name 
    return variable

module.exports = Constraint