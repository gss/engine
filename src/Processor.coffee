Memory = require('./Memory.js')


class Processor
  constructor: ->
    @memory = new Memory
    @memory.object = @
    @promises = {}

  evaluate: (op, i, context, contd) ->
    method = op[0]
    func = def = @[method]

    # Run macro, check if command has custom evaluator (e.g. "if")
    if def
      if typeof def == 'function'
        op.shift()
        def = def.call(@, op, op[0])
      group = def.group
      if contd && group
        command = method
        def = @[group]
        method = def.method
      func = @[def.method]
      evaluate = def.evaluate

    # Evaluate arguments. Stops if one of the values is undefined
    args = []
    eager = false
    for arg, i in op
      if arg instanceof Array
        arg.context = op
        args[i] = value = (evaluate || @evaluate).call(@, arg, i, op)
      else
        args[i] = arg
        continue
      switch typeof value
        when "object", "number"
          eager = value
        # Argument is promised to be observable at the returned path
        when "string"
          if @[arg[0]].group != group
            eager = value
        # The argument depends on some other values. Wait for it.
        when "undefined"
          return

      # Resolve promised argument if current command isnt lazy
      if eager
        console.info('@' + op[0], 'Got promise:', [eager, method])
        @memory.watch eager, op
        return

    # Handle custom commands
    unless func
      args.shift()
      switch typeof def
        # Thread commands pass through
        when "boolean"
          return args
        # Substitute constants
        when "number", "string"
          return def
        # Properties may provide a getter 
        when "object"
          if def.valueOf != Object.valueOf
            getter = func = def.valueOf

    # Concat token path in lazy arguments. Groups native selectors
    if group && !eager && !contd
      path = @toPath(def, args[0], args[1])
      @promise path, op
      console.log('promising', path, op, args.slice())
      debugger
      return path

    # Look up method on the first argument
    unless func
      scope = args.shift()
      if typeof scope == 'object'
        func = scope && scope[method]
      else if contd
        scope = document
        func = scope[method]
    # Execute the function
    if func
      result = func.apply(scope || @, args)
    else
      throw new Error("Engine Commands broke, couldn't find method: #{method}")

    # Return value path
    path = @toPath(result, command || method)
    console.warn('publish', path, result)
    @memory.set path, result
    return path

  'toPath': (command, method, path) ->
    if absolute = command.selector
      return absolute
    relative = command.prefix || ''
    relative += method if method
    relative += command.suffix if command.suffix 
    return (path || command.path || '') + relative

  # This operation will compute the given key *yawn* later. Maybe. It's lazy.
  promise: (key, op) ->
    @promises[key] = op

  # Continues execution of expression with given value
  callback: (op, key, value) ->
    # Was the value promised?
    if value == undefined
      if promise = @promises[key]
        return @evaluate promise, promise.context.indexOf(promise), promise.context, key
      else return

    context = op.context
    i = context.indexOf(op)
    # Fork execution for each item in collection
    if typeof value == 'object' && value && value.length
      for val in value
        @evaluate op, i, context, key, value
    else
      return @evaluate op, i, context, key, value

module.exports = Processor