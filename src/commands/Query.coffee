Command = require('../concepts/Command')

# Asynchronous reference to object or collection
class Query extends Command
  type: 'Query'
  
  @construct: ->
    return (operation) ->
      @name = @toString(operation, @constructor)
      @path = (operation[1]?.selector?.path || '') + @name

  constructor: @construct()
  
  push: (operation) ->
    unless group = @group
      return 

    unless command = @engine.methods[operation[0]]
      return 

    if command.group != group
      return 

    for i in [1 ... operation.length]
      if cmd = operation[i]?.command
        if cmd.group != group
          return

    for i in [1 ... operation.length]
      if cmd = operation[i]?.command
        @merge(cmd)

    @merge(command, operation)

    return @
  
    
  # Check if query was already updated
  before: (node, args, engine, operation, continuation, scope) ->
    unless @hidden
      return engine.queries.fetch(node, args, operation, continuation, scope)

  # Subscribe elements to query 
  after: (node, args, result, engine, operation, continuation, scope) ->
    unless @hidden
      return engine.queries.update(node, args, result, operation, continuation, scope)


  merge: (command, operation) ->
    return if command == @
    string = @toString(command, operation) 
    if operation
      @tail = operation
      @path += string
      @name += string
    else
      @path += @separator + string
    if command.scoped
      @scoped = command.scoped
      
module.exports = Query