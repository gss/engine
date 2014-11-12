Command = require('../concepts/Command')

class Query extends Command
  type: 'Query'
  
  constructor: (operation) ->
    @key = @path = @serialize(operation)

  # Pass control to parent operation (possibly multiple times)
  # For each node in collection, fork continuation with element id
  ascend: (engine, operation, continuation, scope, result, ascender) ->
    if parent = operation.parent
      if engine.isCollection(result)
        for node in result
          contd = @fork(engine, continuation, node)
          unless parent.command.yield?(node, engine, operation, contd, scope, ascender)
            parent.command.solve(engine, parent, contd, scope, parent.indexOf(operation), node)
        return
      else
        
          
        unless parent.command.yield?(result, engine, operation, continuation, scope, ascender)
          if @hidden && !(subscope = @subscope(scope, result))
            return result
          else
            return parent.command.solve(engine, parent, continuation, subscope || scope, parent.indexOf(operation), result)
          
  subscope: (scope, result) ->
    return
     
  serialize: (operation) ->
    if @prefix?
      string = @prefix
    else
      string = operation[0]
    if typeof operation[1] == 'object'
      start = 2
    length = operation.length
    for index in [start || 1 ... length]
      if argument = operation[index]
        if cmd = argument.command
          string += cmd.key
        else
          string += argument
          if length - 1 > index
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

  # Evaluate compound native selector by jumping to either its head or tail
  jump: (engine, operation, continuation, scope, ascender, ascending) ->
    tail = @tail

    # Let it descend quickly
    if tail[1]?.command?.key? && !ascender? && 
          (continuation && continuation.lastIndexOf(engine.Continuation.PAIR) == continuation.indexOf(engine.Continuation.PAIR))
      return tail[1].command.solve(engine, tail[1], continuation, scope)


    return @perform(engine, @head, continuation, scope, ascender, ascending)

  # Return shared absolute path of a dom query ($id selector) 
  getPath: (engine, operation, continuation) ->
    if continuation
      if continuation.nodeType
        return engine.identity.yield(continuation) + ' ' + @path
      else if operation.marked && operation.arity == 2
        return continuation + @path
      else
        return continuation + (@selector || @key)
    else
      return (@selector || @key)

  retrieve: (engine, operation, continuation, scope) ->
    unless @hidden
      return engine.pairs.getSolution(operation, continuation, scope)
      
  prepare: ->
    
  mergers: {}
module.exports = Query