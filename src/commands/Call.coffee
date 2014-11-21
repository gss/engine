Command = require('../concepts/Command')

class Call extends Command
  type: 'Call'

  signature: [
    value: ['Variable']
  ]

class Call.Unsafe extends Call

  signature: false

module.exports = Call