# Exports given commands as self-contained functions 
# to be used as helpers in user scripts and specs

Helper = (command, scoped, displayName)  ->
  if displayName == '_get'
    debugger
  if typeof command == 'function'
    func = command
  helper = (scope) ->
    args = Array.prototype.slice.call(arguments, 0)
    length = arguments.length
    if scoped || command.serialized
      unless scope && scope.nodeType
        scope = @scope || document
        if typeof command[args.length] == 'string'
          context = scope
        else
          args.unshift(scope)
      else
        if typeof command[args.length - 1] == 'string'
          context = scope = args.shift()

    unless fn = func
      if typeof (method = command[args.length]) == 'function'
        fn = method
      else
        unless method && (fn = scope[method])
          if fn = @commands[method]
            context = @
          else
            fn = command.command
            args = [null, args[2], null, null, args[0], args[1]]

    return fn.apply(context || @, args)
  if displayName
    helper.displayName = displayName 
  return helper

module.exports = Helper
