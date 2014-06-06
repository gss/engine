Memory = require('./Memory.js')


class Processor
  constructor: ->
    @memory = new Memory
    @memory.object = @
    @promises = {}

  # Evaluate operation, map() compatible arguments
  # Last four arguments are used for continuations :(
  evaluate: (operation, index, context, contd, promised, from, bubbled, singular) ->
    if context == undefined
      if context = operation.context
        if index == undefined
          index = context.indexOf(operation)
      
    command = method = operation[0]
    func = def = @[method]
    if def
      # Dispatch command dynamically (e.g. $combinator, $pseudo)
      if typeof def == 'function'
        operation.shift()
        def = def.call(@, operation, operation[0])
      group = def.group

      # Use a groupping operation for lazy tokens
      if contd && group && from == undefined
        command = ''
        def = @[group]
        if promised 
          operation = [operation[0], group, promised]

      # Lookup method suggested by command
      method = def.method
      func = @[method]
      evaluate = def.evaluate

    # Recursively evaluate arguments, stop on undefined.
    args = []
    for arg, i in operation
      if i == 0 && contd && def != true
        arg = contd
      else if from == i 
        arg = bubbled
      else if arg instanceof Array
        arg.context = operation
        value = (evaluate || @evaluate).call(@, arg, i, operation)
        if typeof value == 'string'
          # Resolve promise if can't give a sub-promise
          if !arg.context || @[arg[0]].group != group
            if contd
              value = contd + command + value
            value = @memory.watch value, operation
        arg = value
      return if arg == undefined
      args[i] = arg

    # Handle custom commands
    unless func
      switch typeof def
        # Thread commands pass through
        when "boolean"
          unless context
            return @return args
          return args
        # Substitute constants
        when "number", "string"
          return def
        # Commands may define binary and unary operators separately
        when "object"
          if def.match && args.length > (command == '' && 3 || 2)
            getter = func = def.match
            binary = true
          else if def.valueOf != Object.valueOf
            getter = func = def.valueOf

      args.shift()

    # Concat token path in lazy arguments. Groups native selectors
    if context && group && !contd# || (from && args.length == 1))
      if contd
        path = @toPath(def, contd)
      else
        path = @toPath(def, args[1], args[0], operation)
        @promises[path] = operation
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
      path = @toPath(result, contd, command, operation)
      
      # Store variable values. Functions and binary operators always recompute
      unless binary
        @memory.set path, result, index

    # Execute parent expression if promise resolved singular value
    if contd && result != undefined
      if promised == contd && !singular
        return
      return @callback context, path, result, index, link

    return path

  'toPath': (command, path, method, operation, def) ->
    # Reverse path bits for combinators
    if operation && !def
      second = operation[2]
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
          relative = 
            if def
              @toPath(def, operation[1])
            else
              (method || '') + '$' + GSS.setupId(command)
      else
        if absolute = command.selector
          return absolute
        relative = command.prefix || ''
        relative += method if method
        relative += command.suffix if command.suffix 
    return (path || command.path || '') + relative

  # Continues execution of expression with given value
  callback: (operation, path, value, from, singular) ->
    return value unless operation
    # Was the value promised?
    switch typeof value
      when "undefined"
        if promise = @promises[path]
          return @evaluate promise, undefined, undefined, path, path
      when "object"
        # Execute expression for each item in collection (fork)
        if value && typeof value.length == 'number' && @[value[0]] != true 
          console.groupCollapsed path
          for val in value
            breadcrumb = @toPath(val, path)
            @memory.set breadcrumb, val
            @evaluate operation, undefined, undefined, breadcrumb, path, from, val
          console.groupEnd path
        else
          return @evaluate operation, undefined, undefined, singular || @toPath(value, path), path, from, value, singular
    return path

module.exports = Processor