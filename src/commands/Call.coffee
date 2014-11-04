Command = require('../concepts/Command')

class Call extends Command
  type: 'Call'

  signature: [
    value: ['Value']
  ]

class Call.Unsafe extends Call

  signature: null

module.exports = Call