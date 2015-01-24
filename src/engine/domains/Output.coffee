Data       = require('./Data')
Constraint = require('../commands/Constraint')

class Output extends Data
  displayName: 'Output'
  immutable: true
  priority: -200
  finalized: true
  
Output::Constraint = Constraint.extend {
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

module.exports = Output
