Command = require('../concepts/Command')

class Assignment extends Command
  
  signature: [
    [object:   ['Query']]
  	property: ['String']
  	value:    ['Value']
  ]
  
class Assignment.Unsafe extends Assignment
  
  signature: [
    [object:   ['Query']]
    property: ['String'],
    value:    null
  ]
  
module.exports = Assignment