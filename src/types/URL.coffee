Command = require('../Command')

class URL extends Command
  type: 'URL'
  @define
    'url': ->
    'src': ->