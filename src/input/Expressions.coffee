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
      return unless args?
      if buffer
        # Optionally, combine subsequent commands (like remove)
        if batch
          if last = buffer[buffer.length - 1]
            if last[0] == args[0]
              last.push.apply(last, args.slice(1))
              return buffer
      else 
        @buffer = buffer = []
      buffer.push(args)
      return
    else
      return @output.read.apply(@output, args)

  # Evaluate operation depth first
  evaluate: (operation, continuation, scope, ascender, ascending, overloaded) ->
    console.log(operation)
    def = operation.def || @analyze(operation).def
    if (parent = operation.parent) && !overloaded
      if (pdef = parent.def) && pdef.evaluate
        evaluated = pdef.evaluate.call(@, operation, continuation, scope, ascender, ascending)
        return evaluated unless evaluated == @


    # Use a shortcut operation when possible
    if promise = operation.promise
      operation = operation.tail.shortcut ||= @context[def.group].perform(@, operation)
      ascender = ascender != undefined && 1 || undefined

    # Recursively evaluate arguments, stop on undefined.
    args = prev = undefined
    skip = operation.skip
    offset = operation.offset || 0
    for argument, index in operation
      continue if offset > index
      if index == 0 && (!operation.noop && !offset)
        if continuation
          argument = continuation
      else if ascender == index
        argument = ascending
      else if skip == index
        offset += 1
        continue
      else if argument instanceof Array
        argument = @evaluate(argument, continuation, scope, undefined, prev)
      return if argument == undefined
      (args ||= [])[index - offset] = prev = argument

    # No-op commands are to be executed by something else (e.g. Thread)
    if operation.noop
      if parent && parent.def.receive
        return parent.def.receive @engine, scope, args
      else if parent && (!parent.noop || parent.parent)
        return args
      else
        return @write(args)

    # Look up method on the first argument
    if def.scoped
      scope ||= @engine.scope
      (args ||= []).unshift scope
    unless func = operation.func
      object = (typeof args[0] == 'object' && args.shift()) || @engine.scope
      func = object && object[operation.method]

    # Execute the function
    unless func
      throw new Error("Engine broke, couldn't find method: #{operation.method}")

    result = func.apply(object || @context, args)

    # Let context transform or filter the result
    if callback = operation.def.callback
      result = @context[callback](object, args, result, operation, continuation, scope)

    path = (continuation || '') + operation.path
    
    # Ascend the execution (fork for each item in collection)
    if result?
      if parent
        if @engine.isCollection(result)
          console.group path
          for item in result
            subpath = @engine.references.combine(path, item)
            @evaluate parent, subpath, scope, operation.index, item
          console.groupEnd path
          return
        else if parent.def.receive
          parent.def.receive @engine, object, result
        else if ascender?
          @evaluate parent, path, scope, operation.index, result
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
      if operation.arity > 1
        operation.arity-- 
        operation.skip = operation.length - operation.arity
      else
        operation.skip = 1
      operation.name = (def.prefix || '') + operation[operation.skip]
      otherdef = def
      if typeof def.lookup == 'function'
        def = def.lookup.call(@, operation)
      else
        def = @context[operation.name]

    
    for child, index in operation
      if child instanceof Array
        @analyze(child, operation)

    if def == undefined
      operation.def = operation.noop = true
      return operation

    # Assign definition properties to AST node
    operation.def      = def
    operation.path     = @serialize(operation, otherdef)

    if def.group && groupper = @context[def.group]
      groupper.analyze(operation)
      
    # Group multiple nested tokens into a single token
    for child, index in operation
      if child instanceof Array
        if index == 1 && def.group
          if def.group == child.def.group
            tail = child.tail ||= (groupper.attempt(child) && child)
            if tail
              operation.promise = (child.promise || child.path) + operation.path
              tail.head = operation
              tail.promise = operation.promise
              operation.tail = tail

    # Try predefined command if can't dispatch by number of arguments
    if typeof def == 'function'
      func = def
      operation.offset = 1
    else if func = def[operation.arity]
      operation.offset = 1
    else
      func = def.command

    # Command may resolve to method, which will be called on the first argument
    if typeof func == 'string'
      if command = @context[func]
        operation.func = command
      else
        operation.method = func
    else
      operation.func = func

    return operation

  # Serialize operation to a string with arguments, but without context
  serialize: (operation, otherdef) ->
    def = operation.def
    prefix = def.prefix || (otherdef && otherdef.prefix) || (operation.noop && operation.name) || ''
    suffix = def.suffix || (otherdef && otherdef.suffix) || ''
    path = ''
    start = 1 + (operation.length > 2)
    for index in [start ... operation.length]
      if op = operation[index]
        if typeof op != 'object'
          path += operation[index]
    return prefix + path + suffix


module.exports = Expressions