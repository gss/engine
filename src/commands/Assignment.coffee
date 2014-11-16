Command = require('../concepts/Command')

class Assignment extends Command
  type: 'Assignment'
  
  signature: [
    [object:   ['Query', 'Selector']]
    property: ['String']
    value:    ['Value']
  ]
  
class Assignment.Unsafe extends Assignment
  
  signature: [
    [object:   ['Query', 'Selector']]
    property: ['String']
    value:    ['Any']
  ]
  
module.exports = Assignment