Command = require('../concepts/Command')

class Block extends Command
  type: 'Block'
  
  signature: [
    body: null
  ]
  
Block.define
  'scoped':
    # Set rule body scope to a found element
    solve: (engine, operation, continuation, scope, ascender, ascending) ->
      if operation.index == 2 && !ascender && ascending?
        @_solve engine, operation, continuation, ascending, operation
        return false

class Block.Meta extends Block

  signature: [
    data: ['Object']
    body: ['Any']
  ],

  execute: (data)->
    return data

module.exports = Block