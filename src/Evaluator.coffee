Registry = require('./Registry.js')

class Evaluator extends Registry
  constructor: ->
    @values = {}
    super()

  evaluate: (op, i, context, contd) ->
    method = op[0]
    func = def = @[method]
    console.log(op, i, method)
    if (method == '$combinator')
      debugger

    # Run macro, check if property has custom evaluator (e.g. "if")
    if def
      if typeof def == 'function'
        op.shift()
        def = def.call(@, context, op[0])

      func = @[def.method]
      evaluate = def.evaluate
      group = def.group

    # Evaluate arguments. Stops if one of the values is undefined
    args = []
    eager = false
    for arg, i in op
      if arg instanceof Array
        arg.parent = op
        args[i] = value = (evaluate || @evaluate).call(@, arg, i, op, contd)
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

      # Resolve the promise if current node isnt lazy
      if eager
        console.info('@' + op[0], 'Resolve promise:', eager)
        @subscribe eager, context
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
            func = def.valueOf

    # Concat token path in lazy arguments. Groups native selectors
    if group && !eager
      promise = @toPath(def, args[0], args[1])
      @register promise, op
      console.log('promising', promise, op)
      return promise

    # Look up method on the first argument
    unless func
      scope = args.shift()
      if typeof scope == 'object'
        func = scope && scope[method]

    # Execute the function
    if func
      result = func.apply(scope || @, args)
    else if result == undefined
      throw new Error("Engine Commands broke, couldn't find method: #{method}")

    absolute = @toPath(result, method)
    @operations[absolute] = context 

    return absolute

  'toPath': (command, method, path) ->
    if absolute = command.selector
      return absolute
    relative = command.prefix
    relative += method if method
    relative += command.suffix if command.suffix 
    return (path || command.path || '') + relative

  continuate: (arg, i, context) ->
    return evaluate(context, i, context.parent)
    123

module.exports = Evaluator