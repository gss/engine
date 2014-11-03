Command = require('../concepts/Command')

class Call extends Command
  type: 'Call'

  signature: [
    value: ['Value']
  ]

module.exports = Call