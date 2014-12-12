
Numeric    = require('./Numeric')
Constraint = require('../Constraint')

class Boolean extends Numeric
  immutable: true

  
Boolean::Constraint = Constraint.extend {
  signature: [
    left:     ['Variable', 'Number', 'Constraint'],
    right:    ['Variable', 'Number', 'Constraint']
  ]
},
  "&&": (a, b) ->
    return a && b

  "||": (a, b) ->
    return a || b
    
  "!=": (a, b) ->
    return a == b

  "==": (a, b) ->
    return a == b

  "<=": (a, b) ->
    return a <= b

  ">=": (a, b) ->
    return a >= b

  "<": (a, b) ->
    return a < b

  ">": (a, b) ->
    return a > b

module.exports = Boolean
