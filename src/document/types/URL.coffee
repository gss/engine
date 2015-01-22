Command = require('../../engine/Command')

class URL extends Command
  type: 'URL'

  constructor: (obj) ->
    switch typeof obj
      when 'object'
        if URL[obj[0]]
          return obj

  @define
    'url': ->
    'src': ->
    'canvas': ->


module.exports = URL
