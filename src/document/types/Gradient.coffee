Command = require('../../engine/Command')

class Gradient extends Command
  type: 'Gradient'

  constructor: (obj) ->
    switch typeof obj
      when 'object'
        if Gradient[obj[0]]
          return obj
          
  @define 
    'linear-gradient': ->
    'radial-gradient': ->
    'repeating-linear-gradient': ->
    'repeating-radial-gradient': ->

module.exports = Gradient