class Block extends Command
  signature: [
    body: null
  ]
  
Command.define.call Block,
  "scoped":
    # Set rule body scope to a found element
    solve: (engine, operation, continuation, scope, ascender, ascending) ->
      if operation.index == 2 && !ascender && ascending?
        @_solve engine, operation, continuation, ascending, operation
        return false
  
module.exports = Block