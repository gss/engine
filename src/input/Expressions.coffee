# Interepretes given expressions lazily, functions are defined by @context
# supports forking for collections 
# (e.g. to apply something for every element matched by selector)

# Doesnt send the output until all commands are executed.

# * Input: Engine, reads commands
# * Output: Engine, outputs results, leaves out unrecognized commands as is

class Expressions
  constructor: (@engine, @context, @output) ->
    @context ||= @engine && @engine.context || @

  # Hook: Evaluate input and send produced output
  read: ->
    @buffer = null
    console.log(@engine.onDOMContentLoaded && 'Document' || 'Worker', 'input:', JSON.parse JSON.stringify arguments[0])
    result = @evaluate.apply(@, arguments)
    if @buffer
      @lastOutput = @buffer
      @output.read(@buffer)
      @buffer = undefined
    return result

  # Hook: Buffer equasions if needed
  write: (args, batch) ->
    if (buffer = @buffer) != undefined
      if buffer
        # Optionally, combine subsequent commands (like remove)
        if batch
          if last = buffer[buffer.length - 1]
            if last[0] == args[0]
              last.push.apply(last, args.slice(1))
              return buffer
      else 
        @buffer = buffer = []
      debugger
      buffer.push(args)
      return buffer
    else
      return @output.read.apply(@output, args)

  # Evaluate operation depth first
  evaluate: (operation, context, continuation, from, ascending) ->
    offset = operation.offset ? @analyze(operation).offset

    # Use a shortcut operation when possible
    if promise = operation.promise
      operation = operation.tail.shortcut ||= @context[operation.group].perform(@, operation)
      from = ascending != undefined && 1 || undefined

    # Recursively evaluate arguments, stop on undefined.
    args = null
    skip = operation.skip

    for argument, index in operation
      continue if offset > index
      if index == 0 && (!operation.noop && !offset)
        if continuation
          argument = continuation
      else if from == index
        argument = ascending
      else if skip == index
        offset += 1
        continue
      else if argument instanceof Array
        argument = (operation.evaluate || @evaluate).call(@, argument, (args ||= []))
      return if argument == undefined
      (args ||= [])[index - offset] = argument

    # No-op commands are to be executed by something else (e.g. Thread)
    if operation.noop
      parent = operation.parent
      if parent && (!parent.noop || parent.parent)
        return args
      else
        return @write(args)

    # Look up method on the first argument
    unless func = operation.func
      scope = (typeof args[0] == 'object' && args.shift()) || @engine.scope
      func = scope && scope[operation.method]

    # Execute the function
    unless func
      throw new Error("Engine broke, couldn't find method: #{operation.method}")

    result = func.apply(scope || @context, args)

    # Let context transform or filter the result
    if callback = operation.callback
      result = @context[callback](@engine, scope, args, result, operation, continuation)

    path = (continuation || '') + operation.path
    
    # Ascend the execution (forks for each item in collection)
    if result?
      if @engine.isCollection(result)
        console.group path
        for item in result
          @evaluate operation.parent, undefined, @engine.references.combine(path, item), operation.index, item
        console.groupEnd path
      else if !context
        if operation.parent
          @evaluate operation.parent, undefined, path, operation.index, result
        else
          return @write result
    return result

  # Process and pollute a single AST node with meta data.
  analyze: (operation, parent) ->
    operation.name = operation[0]
    def = @engine.context[operation.name]

    if parent
      operation.parent = parent
      operation.index = parent.indexOf(operation)

    # Handle commands that refer other commands (e.g. [$combinator, node, >])
    operation.arity = operation.length - 1
    if def && def.lookup
      operation.arity--
      operation.skip = operation.length - operation.arity
      operation.name = (def.prefix || '') + operation[operation.skip]
      for property of def
        if property != 'lookup'
          operation[property] = def[property]
      if typeof def.lookup == 'function'
        def = def.lookup.call(@, operation)
      else
        def = @context[operation.name]


    operation.offset = 0
    
    for child, index in operation
      if child instanceof Array
        @analyze(child, operation).group

    if def == undefined
      operation.noop = true
      return operation

    # Assign definition properties to AST node
    operation.group    = group    if group    = def.group
    operation.prefix   = prefix   if prefix   = def.prefix
    operation.suffix   = suffix   if suffix   = def.suffix
    operation.callback = callback if callback = def.callback
    operation.path     = @serialize(operation)

    # Group multiple nested tokens into a single token
    for child, index in operation
      if child instanceof Array
        if index == 1 && group && group == child.group
          if def = @context[group]
            tail = child.tail ||= (def.attempt(child) && child)
            if tail
              operation.promise = (child.promise || child.path) + operation.path
              tail.head = operation
              tail.promise = operation.promise
              operation.tail = tail


    # Try predefined command if can't dispatch by number of arguments
    if typeof def == 'function'
      func = def
      operation.offset += 1
    else if func = def[operation.arity]
      operation.offset += 1
    else
      func = def.command

    if typeof func == 'string'
      if command = @context[func]
        operation.func = command
      else
        operation.method = func
    else
      operation.func = func

    return operation

  # Serialize operation to a string with arguments, but without context
  serialize: (operation) ->
    prefix = operation.prefix || (operation.noop && operation.name) || ''
    suffix = operation.suffix || ''
    path = ''
    start = 1 + (operation.length > 2)
    for index in [start ... operation.length]
      path += operation[index]
    return prefix + path + suffix


module.exports = Expressions