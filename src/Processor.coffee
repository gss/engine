Memory = require('./Memory.js')


class Processor
  constructor: ->
    @memory = new Memory
    @memory.object = @
    @promises = {}

  # Evaluate operation, map() compatible arguments
  # Last four arguments are used for continuations :(
  evaluate: (op, index, context, contd, promised, from, bubbled) ->
    if context == undefined
      if context = op.context
        if index == undefined
          index = context.indexOf(op)
      
    command = method = op[0]
    func = def = @[method]

    if def
      # Dispatch command dynamically (e.g. $combinator, $pseudo)
      if typeof def == 'function'
        op.shift()
        def = def.call(@, op, op[0])
      group = def.group

      # Use a groupping operation for lazy tokens
      if contd && group && from == undefined
        command = ''
        def = @[group]
        if promised 
          op = [op[0], group, promised]
        else
          [group, op[1]]

      # Lookup method suggested by command
      method = def.method
      func = @[method]
      evaluate = def.evaluate

    # Recursively evaluate arguments, stop on undefined.
    args = []
    eager = false
    for arg, i in op
      if from == i
        args[i] = value = contd
        forked = true
      else if arg instanceof Array
        arg.context = op
        args[i] = value = (evaluate || @evaluate).call(@, arg, i, op)
      else
        args[i] = arg
        continue

      switch typeof value
        # Argument is promised to be observable at the returned path
        when "string"
          if !arg.context || from == i || @[arg[0]].group != group
            if value == promised || forked
              args[i] = bubbled ? @memory[contd]
            else
              eager = value

        # The argument depends on some other values. Wait for it.
        when "undefined"
          return

      # Resolve promised argument if current command isnt lazy
      if eager
        promise =
          if contd
            contd + command + eager
          else
            eager
        @memory.watch promise, op
        return

    # Handle custom commands
    unless func
      unless context
        return @return args
      args.shift()
      switch typeof def
        # Thread commands pass through
        when "boolean"
          return args
        # Substitute constants
        when "number", "string"
          return def
        # Commands may define binary and unary operators separately
        when "object"
          if def.match && args.length > (command == '' && 2 || 1)
            getter = func = def.match
            binary = true
          else if def.valueOf != Object.valueOf
            getter = func = def.valueOf

    if (command == " ")
      debugger
    # Concat token path in lazy arguments. Groups native selectors
    if context && group && !eager && !contd# || (from && args.length == 1))
      if contd
        path = @toPath(def, contd)
      else
        path = @toPath(def, args[1], args[0], op)
        @promise path, op
        return path

    # Look up method on the first argument
    unless func
      scope = args.shift()
      if typeof scope == 'object'
        func = scope && scope[method]
      else if contd
        scope = @engine.queryScope
        func = scope[method]

    # Execute the function
    if func
      console.warn('@' + (command || method) , args)
      result = func.apply(scope || @, args)
    else
      throw new Error("Engine Commands broke, couldn't find method: #{method}")

    # Compute sub-path if forked, or reuse parent path
    if result && (result.length == undefined || (typeof result[0] == 'string' && @[result[0]] == true))
      link = path = contd
    else
      path = @toPath(result, contd, command, op)
      
      # Store variable values. Functions and binary operators always recompute
      unless binary
        @memory.set path, result

    # Now that promise is resolved, execute parent expression
    if contd && result != undefined
      if context
        @callback context, path, result, index, link
      else
        return @return result

    return path

  'toPath': (command, path, method, op, def) ->
    # Reverse path bits for combinators
    if op && !def
      second = op[2]
      if second && second.push && second[0] == @[second[0]].prefix
        swap = path
        path = method
        method = swap

    if command == undefined
      relative = method
    else
      if command.nodeType
        if command.nodeType == 9
          return '#document'
        else
          if def
            relative = @toPath(def, op[1])
          else
            relative = (method || '') + '$' + GSS.setupId(command)
      else
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
  callback: (op, key, value, from, singular) ->
    # Was the value promised?
    if value == undefined
      if promise = @promises[key]
        return @evaluate promise, promise.context.indexOf(promise), promise.context, key, key
      else return

    # Fork execution for each item in collection
    if typeof value == 'object' && value && typeof value.length == 'number' && @[value[0]] != true 
      console.groupCollapsed key
      for val in value
        breadcrumb = @toPath(val, key)
        @memory.set breadcrumb, val
        @evaluate op, undefined, undefined, breadcrumb, key, from
        result = true
      console.groupEnd key
      return result
    else
      @evaluate op, undefined, undefined, singular || @toPath(value, key), key, from, value


module.exports = Processor