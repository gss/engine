Command = require('../Command')

class Assignment extends Command
  type: 'Assignment'
  
  signature: [
    [object:   ['Query', 'Selector']]
    property: ['String']
    value:    ['Variable']
  ]
  
class Assignment.Unsafe extends Assignment
  
  signature: [
    [object:   ['Query', 'Selector']]
    property: ['String']
    value:    ['Any']
  ]

  advices: [
    (engine, operation, command) ->
      parent = operation
      rule = undefined
      while parent.parent
        if !rule && parent[0] == 'rule'
          rule = parent
        parent = parent.parent

      operation.index = parent.rules = (parent.rules || 0) + 1
      if rule
        (rule.properties ||= []).push(operation.index)
      return
  ]
  
module.exports = Assignment