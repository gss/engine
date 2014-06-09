class Processor
  constructor: ->
    @promises = {}

  # Evaluate operation depth first
  evaluate: (operation, context, continuation, promised, from, bubbled, singular) ->
    offset = operation.offset ? @preprocess(operation).offset
    skip   = operation.skip

    # Recursively evaluate arguments, stop on undefined.
    args = null
    for argument, index in operation
      if index == 0
        continue if offset
        if continuation && !operation.noop
          argument = continuation
      else if skip == index
        offset += 1
        continue
      else if from == index 
        argument = bubbled
      else if argument instanceof Array
        argument.parent ||= operation
        value = (operation.evaluate || @evaluate).call(@, argument, args)
        # Got promise, resolve if node can't give a sub-promise of the same type
        if argument.group != operation.group
          eager = true
          if typeof value == 'string'
            if continuation
              value = continuation + operation.command + value
            value = @memory.watch value, operation, index
        argument = value
      return if argument == undefined
      (args ||= [])[index - offset] = argument

    # No-op commands are to be executed by something else (e.g. Thread)
    if operation.noop
      return if operation.parent then args else @return(args)

    # Return promise if possible
    path = @toPath operation, args, continuation
    if operation.group && !continuation #&& (!continuation || path != continuation)
      @promises[path] = operation
      return path

    # Look up method on the first argument
    unless func = operation.func
      scope = (typeof args[0] == 'object' && args.shift()) || @engine.queryScope
      func = scope && scope[operation.method]

    # Execute the function
    unless func
      throw new Error("Engine broke, couldn't find method: #{operation.method}")

    result = func.apply(scope || @, args)

    console.log(@observer, operation.combinator || operation.name == '$query')
    if operation.combinator || operation.name == '$query'
      @observer.add(scope, operation, continuation)

    # Compute sub-path if forked, or reuse parent path
    if result && @isCollection(result)
      @memory.set path, result, operation.index
      return
    else
      link = path = continuation

    # Execute parent expression if promise resolved singular value
    if continuation
      if promised == continuation && !singular
        return
      return @callback operation.parent, path, result, operation.index, link

    return path

  toPath: (operation, args, promised) ->
    if subgroup = operation[1].group
      if subgroup != operation.group
        return promised
    prefix = operation.prefix || ''
    suffix = operation.suffix || ''
    path = operation.skipped || ''
    for arg, index in args
      if typeof arg == 'string'
        if index == 0
          prefix = arg + prefix
        else
          path = arg
    return prefix + path + suffix

  preprocess: (operation) ->
    operation.name = operation[0]
    operation.offset = 0;
    def = @[operation[0]]

    if operation.parent && typeof operation.index != 'number'
      operation.index = operation.parent.indexOf(operation)

    arity = operation.length - 1 
    if def.lookup
      operation.skip = arity == 1 ? 2 : 1
      operation.skipped = operation[arity]
      operation.name = (def.prefix || '') + operation.skipped
      if typeof def.lookup == 'function'
        def = def.lookup.call(@, operation)
        for property in def
          if property != 'lookup'
            operation[property] = def[property]
      else
        def = @[operation.name]

    if def == true
      operation.noop = true
      return operation
  
    operation.group  = group  if group  = def.group
    operation.prefix = prefix if prefix = def.prefix
    operation.suffix = suffix if suffix = def.suffix

    # Dispatch function by number of arguments
    if func = def[arity]
      operation.offset = 1
    else
      func = def.command

    if typeof func == 'string'
      if @[func]
        operation.func = @[func]
      else
        operation.method = func
    else
      operation.func = func

    return operation

  # Should we iterate the object?
  isCollection: (object) ->
    if typeof object == 'object' && object.length != undefined
      unless typeof object[0] == 'string' && @[object[0]] == true
        return true

  # Continues execution of expression with given value
  callback: (operation, path, value, from, singular) ->
    return value unless operation
    switch typeof value
      when "undefined"
        # Resolve promise
        if responsible = @promises[path]
          promise = [responsible.group, path]
          promise.path = path
          promise.parent = operation
          promise.index = from
          promise.push value unless value == undefined
          return @evaluate promise, undefined, path
      when "object"
        # Execute expression for each item in collection (fork)
        if value && @isCollection(value)
          console.group path
          debugger
          for val in value
            breadcrumb = path + @toId(val)
            @memory.set breadcrumb, val
            @evaluate operation, undefined, breadcrumb, path, from, val
          console.groupEnd path
        else
          return @evaluate operation, undefined, singular || @toId(value, path), path, from, value, singular
    return path

module.exports = Processor