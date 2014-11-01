Command = require('../concepts/Command')

class Query extends Command
  type: 'Query'
  
  constructor: (operation) ->
    @key = @path = @serialize(operation)

  serialize: (operation) ->
    if @prefix?
      string = @prefix
    else
      string = operation[0]
    if typeof operation[1] == 'object'
      start = 2
    for index in [start || 1 ... operation.length]
      if argument = operation[index]
        if cmd = argument.command
          string += cmd.key
        else
          string += argument
          if operation.length - 1 > index
            string += @separator

    if @suffix
      string += @suffix

    return string

  push: (operation) ->
    for index in [1 ... operation.length]
      if cmd = operation[index]?.command
        inherited = @inherit(cmd, inherited)

    if tags = @tags
      for tag, i in tags
        match = true
        # Check if all args match the tag
        for index in [1 ... operation.length]
          if cmd = operation[index]?.command
            if !(cmd.tags?.indexOf(tag) > -1)
              match = false
              break

        # Merge tagged arguments
        if match
          inherited = false
          for i in [1 ... operation.length]
            arg = operation[i]
            if cmd = arg?.command 
              inherited = @mergers[tag](@, cmd, operation, arg, inherited)

    return @
  
  inherit: (command, inherited) ->
    if command.scoped
      @scoped = command.scoped
    if path = command.path
      if inherited
        @path += @separator + path
      else
        @path = path + @path
    return true

  continue: (engine, operation, continuation = '') ->
    return continuation + (@key || '')

  jump: (engine, tail, continuation, ascender) ->
    if (tail.path == tail.key || ascender? || 
        (continuation && continuation.lastIndexOf(engine.Continuation.PAIR) != continuation.indexOf(engine.Continuation.PAIR)))
      return @head
    else
      return @tail[1]

  # Pass control to parent operation. 
  # 
  ascend: (engine, operation, continuation, result, scope, ascender) ->
    unless parent = operation.parent
      return
    if (top = parent.command) instanceof Command.List
      return
    
    # For each node in collection, recurse to a parent with id appended to continuation key
    if engine.isCollection(result)
      engine.console.group '%s \t\t\t\t%O\t\t\t%c%s', engine.Continuation.ASCEND, operation.parent, 'font-weight: normal; color: #999', continuation
      
      for item in result
        @ascend engine, operation, @fork(engine, continuation), item, scope, operation.index
      
      engine.console.groupEnd()
    else 
      # Some operations may capture its arguments (e.g. comma captures nodes by subselectors)
      if top.provide?(engine, result, operation, continuation, scope, ascender)
        return 

      # Recurse to ascend query result
      if @key
        top.solve engine, parent, continuation, scope, operation.index, result
      else
        return result
     

  mergers: {}
module.exports = Query