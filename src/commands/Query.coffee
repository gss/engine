Command = require('../concepts/Command')

class Query extends Command
  type: 'Query'
  
  constructor: (operation) ->
    @key = @path = @toString(operation)

  toString: (operation) ->
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

  mergers: {}
module.exports = Query