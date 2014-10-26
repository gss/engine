class Constraint extends Commands
  
  signature: [
  	left:     ['Value'],
  	right:    ['Value']
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