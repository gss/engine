Command = ->
  for argument, i in operation
    if argument?.push
      arg = @Command argument, operation, i

  if typeof operation[0] == 'string'
    command = @engine.methods[operation[0]]
    if typeof command == 'function'
	    command = command.group && Command.wrap(operation) || new command(operation)


Command.wrap = (operation) ->
	for i in [1 ... operation.length]
		if argument = operation[i]
			if argument.command?.push?(operation)
				return argument.command
