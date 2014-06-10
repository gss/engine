class Processor
  constructor: ->
    @continuations = {}

  # Evaluate operation depth first
  evaluate: (operation, context, continuation, from, ascending) ->
    offset = operation.offset ? @preprocess(operation).offset

    # Use a shortcut operation when possible
    if promise = operation.promise
      operation = operation.tail.shortcut ||= @getGrouppedOperation(operation)
      from = ascending != undefined && 1 || undefined

    # Recursively evaluate arguments, stop on undefined.
    args = null
    skip = operation.skip

    for argument, index in operation
      continue if offset > index
      if index == 0
        if continuation && !operation.noop
          argument = continuation
      else if from == index
        argument = ascending
      else if skip == index
        offset += 1
        continue
      else if argument instanceof Array
        argument = (operation.evaluate || @evaluate).call(@, argument, args)
      return if argument == undefined
      (args ||= [])[index - offset] = argument

    # No-op commands are to be executed by something else (e.g. Thread)
    if operation.noop
      return if operation.parent then args else @return(args)

    # Look up method on the first argument
    unless func = operation.func
      scope = (typeof args[0] == 'object' && args.shift()) || @engine.queryScope
      func = scope && scope[operation.method]

    # Execute the function
    unless func
      throw new Error("Engine broke, couldn't find method: #{operation.method}")

    result = func.apply(scope || @, args)

    # Set up DOM observer
    if operation.type == 'combinator' || operation.type == 'qualifier'
      console.log('observing', operation, GSS.getId(scope || @))
      @observer.add(scope, operation, continuation)

    path = (continuation || '')
    
    # Fork for each item in collection, ascend 
    if result?
      if @isCollection(result)
        path += operation.path
        console.group path
        for item in result
          @evaluate operation.parent, undefined, path + @toId(item), operation.index, item
        console.groupEnd path
      else if !context
        if operation.parent
          @evaluate operation.parent, undefined, path, operation.index, result
        else
          return @return result
    return result

  toPath: (operation) ->
    prefix = operation.prefix || ''
    suffix = operation.suffix || ''
    path = ''
    start = 1 + (operation.length > 2)
    for index in [start ... operation.length]
      path += operation[index]
    return prefix + path + suffix

  # Process and pollute a single AST node with meta data.
  preprocess: (operation, parent) ->
    operation.name = operation[0]
    def = @[operation.name]

    if parent
      operation.parent = parent
      operation.index = parent.indexOf(operation)

    # Handle commands that refer other commands (e.g. [$combinator, node, >])
    operation.arity = operation.length - 1
    if def.lookup
      operation.arity--
      operation.skip = operation.length - operation.arity
      operation.name = (def.prefix || '') + operation[operation.skip]
      console.log(def.lookup, def, 'lol')
      for property in def
        if property != 'lookup'
          operation[property] = def[property]
      if typeof def.lookup == 'function'
        def = def.lookup.call(@, operation)
      else
        def = @[operation.name]


    # Assign definition properties to AST node
    operation.group  = group  if group  = def.group
    operation.prefix = prefix if prefix = def.prefix
    operation.suffix = suffix if suffix = def.suffix

    unless def == true
      operation.path = @toPath(operation)

    # Group multiple nested tokens into a single token
    for child, index in operation
      if child instanceof Array
        @preprocess(child, operation).group
        if index == 1 && group && group == child.group
          tail = child.tail ||= (@canStartGroup(child, group) && child)
          if tail
            operation.promise = (child.promise || child.path) + operation.path
            console.log('promising', operation.promise, child)
            tail.head = operation
            tail.promise = operation.promise
            operation.tail = tail

    operation.offset = 0
    if def == true
      operation.noop = true
      return operation

    # Try predefined command if can't dispatch by number of arguments
    if func = def[operation.arity]
      operation.offset += 1
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

  # Create a shortcut operation to get through a group of operations
  getGrouppedOperation: (operation) ->
    shortcut = [operation.group, operation.promise]
    if (operation.tail.parent == operation)
      console.error(operation)
    shortcut.parent = (operation.head || operation).parent
    shortcut.index = (operation.head || operation).index
    @preprocess(shortcut)
    tail = operation.tail
    global = tail.arity == 1 && tail.length == 2
    unless global
      shortcut.splice(1, 0, tail[1])
    return shortcut

  # Native selectors cant start with a non-space combinator or qualifier
  canStartGroup: (operation, group) ->
    if group == '$query'
      if operation.name == '$combinator'
        if group[group.skip] != ' '
          return false
      else if operation.arity == 2
        return false
    return true

  # Should we iterate the object?
  isCollection: (object) ->
    if typeof object == 'object' && object.length != undefined
      unless typeof object[0] == 'string' && @[object[0]] == true
        return true

module.exports = Processor