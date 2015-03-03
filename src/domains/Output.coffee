Data       = require('./Data')
Constraint = require('../commands/Constraint')

class Output extends Data
  Range: require('../commands/Range')
  
  displayName: 'Output'
  immutable: true
  priority: -200
  finalized: true
  
Output::Constraint = Constraint.extend {
  signature: [
    left:     ['Variable', 'Number', 'Constraint', 'Range'],
    right:    ['Variable', 'Number', 'Constraint', 'Range']
  ]
},
  "&&": (a, b) ->
    return a.valueOf() && b.valueOf() || false

  "||": (a, b) ->
    return a.valueOf() || b.valueOf() || false
    
  "!=": (a, b) ->
    return a.valueOf() != b.valueOf() || false

  "==": (a, b) ->
    return a == b

module.exports = Output
