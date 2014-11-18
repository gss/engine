
Numeric    = require('./Numeric')
Command    = require('../concepts/Command')
Value      = require('../commands/Value')
Constraint = require('../commands/Constraint')

class Boolean extends Numeric
  immutable: true

  
Boolean::Constraint = Constraint.extend {
  signature: [
    left:     ['Value', 'Number', 'Constraint'],
    right:    ['Value', 'Number', 'Constraint']
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
