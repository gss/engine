# Interepretes given expressions lazily, functions are defined by @context
# supports forking for collections 
# (e.g. to apply something for every element matched by selector)

# Doesnt send the output until all commands are executed.

# * Input: Engine, reads commands
# * Output: Engine, outputs results, leaves out unrecognized commands as is

class Expressions
  constructor: (@engine, @output) ->
    @commands = @engine && @engine.commands || @

  # Hook: Evaluate input and pass produced output
  pull: ->
    @engine.start()

    buffer = @capture() # Enable buffering if nobody enabled it already
    result = @evaluate.apply(@, arguments)
    if buffer # Flush buffered output if this function started the buffering
      @flush()
    return result

  # Hook: Output commands in batch
  push: (args, batch) ->
    return unless args?
    if (buffer = @buffer) != undefined
      unless @engine._onBuffer && @engine._onBuffer(buffer, args, batch) == false
        (buffer || (@buffer = [])).push args
      return
    else
      return @output.pull.apply(@output, args)

  # Output buffered commands
  flush: ->
    buffer = @buffer
    if @engine._onFlush
      added = @engine._onFlush(buffer)
      buffer = buffer && added && added.concat(buffer) || buffer || added
    @lastOutput = GSS.clone buffer
    console.log(@engine.onDOMContentLoaded && 'Document' || 'Worker', 'Output:', buffer)

    if buffer
      @buffer = undefined
      @output.pull(buffer)
    else if @buffer == undefined
      @engine.push()

  # Run without changing lastOutput or buffer settings
  do: ->
    {lastOutput, buffer} = @
    @lastOutput = @buffer = undefined
    result = @pull.apply(@, arguments)
    @lastOutput = lastOutput
    @buffer = buffer
    return result 

  # Evaluate operation depth first
  evaluate: (operation, continuation, scope, ascender, ascending, meta) ->
    # console.log('Evaluating', operation, continuation, [ascender, ascending, meta])
    # Analyze operation once
    unless operation.def
      @analyze(operation)
    
    # Use custom argument evaluator of parent operation if it has one
    if !meta && (evaluate = operation.parent?.def.evaluate)
      evaluated = evaluate.call(@engine, operation, continuation, scope, ascender, ascending)
      return if evaluated == false
      if typeof evaluated == 'string'
        continuation = evaluated


    # Use a shortcut operation when possible (e.g. native dom query)
    if operation.tail
      operation = @skip(operation, ascender)

    # Use computed result by *cough* parsing continuation string
    if continuation && operation.path
      if (result = @reuse(operation.path, continuation)) != false
        return result

    # Recursively evaluate arguments,stop on undefined
    args = @resolve(operation, continuation, scope, ascender, ascending, meta)
    return if args == false

    # Execute function and log it in continuation path
    if operation.def.noop
      result = args
    else
      result = @execute(operation, continuation, scope, args)
      continuation = @log(operation, continuation)

    # Ascend the execution (fork for each item in collection)
    return @ascend(operation, continuation, result, scope, ascender)

  # Get result of executing operation with resolved arguments
  execute: (operation, continuation, scope, args) ->
    scope ||= @engine.scope
    if operation.def.scoped || !args
      (args ||= []).unshift scope
    if typeof args[0] == 'object'
      node = args[0]

    # Use function, or look up method on the first argument. Falls back to builtin
    unless func = operation.func
      if method = operation.method
        if node && func = node[method]
          args.shift()
          context = node
        unless func
          if !context && (func = scope[method])
            context = scope
          else if command = @commands[method]
            func = @engine[command.reference]

    # Execute the function
    unless func
      throw new Error("Couldn't find method: #{operation.method}")

    result = func.apply(context || @engine, args)

    # If it's NaN, then we've done some bad math, leave it to solver
    unless result == result
      args.unshift operation.name
      return args

    # Let context transform or filter the result
    if callback = operation.def.callback
      result = @engine[callback](context || node || scope, args, result, operation, continuation, scope)

    
    return result

  # Try to read saved results within continuation
  reuse: (path, continuation) ->
    last = -1
    while (index = continuation.indexOf('–', last + 1))
      if index == -1
        break if last == continuation.length - 1
        index = continuation.length
        breaking = true
      start = continuation.substring(last + 1, last + 1 + path.length)
      if start == path
        separator = last + 1 + path.length
        if separator < index
          if continuation.charAt(separator) == '$'
            id = continuation.substring(separator, index)
        if id
          return @engine.elements[id]
        else
          return @engine.queries[continuation.substring(0, separator)]
      break if breaking
      last = index
    return false

  # Evaluate operation arguments in order, break on undefined
  resolve: (operation, continuation, scope, ascender, ascending, meta) ->
    args = prev = undefined
    skip = operation.skip
    shift = 0
    offset = operation.offset || 0
    for argument, index in operation
      continue if offset > index
      if (!offset && index == 0 && !operation.def.noop)
        args = [operation, continuation || operation.path, scope]
        shift += 2
        continue
      else if ascender == index
        argument = ascending
      else if skip == index
        shift--
        continue
      else if argument instanceof Array
        # Leave forking mark in a path when resolving next arguments
        if ascender < index
          contd = continuation
          contd += '–' unless contd.charAt(contd.length - 1) == '–'
        argument = @evaluate(argument, contd || continuation, scope, undefined, prev)
      if argument == undefined
        if !operation.def.eager || ascender?
          if !operation.def.noop || operation.parent
            return false 
          if operation.name && !operation.parent
            stopping = true
        offset += 1
        continue
      (args ||= [])[index - offset + shift] = prev = argument
    return false if stopping || (!args && operation.def.noop)
    return args

  # Pass control back to parent operation. 
  # If child op returns DOM collection or node, evaluator recurses to do so.
  # When recursion unrolls all caller ops are discarded
  ascend: (operation, continuation, result, scope, ascender) ->
    if result? 
      if (parent = operation.parent) || operation.def.noop
        # For each node in collection, we recurse to a parent op with a distinct continuation key
        if parent && @engine.isCollection(result)
          console.group continuation
          for item in result
            breadcrumbs = @engine.getContinuation(continuation, item)
            @evaluate operation.parent, breadcrumbs, scope, operation.index, item
          console.groupEnd continuation
          return
        
        # Some operations may capture its arguments (e.g. comma captures nodes by subselectors)
        else if parent?.def.capture
          captured = parent.def.capture.call(@engine, result, operation, continuation, scope)
          return if captured == true
        # Topmost operations produce output
        else 
          if operation.def.noop || (parent.def.noop && !parent.name)
            if result && (!parent || (parent.def.noop && (!parent.parent || parent.length == 1) || ascender?))
              return @push(if result.length == 1 then result[0] else result)
          else if parent && (ascender? || result.nodeType)
            @evaluate parent, continuation, scope, operation.index, result
            return 
      else
        return @push result

    # Ascend without recursion (math, regular functions, constraints)
    return result

  # Advance to a groupped shortcut operation
  skip: (operation, ascender) ->
    if (operation.tail.path == operation.tail.key || ascender?)
      return operation.tail.shortcut ||= 
        @engine.commands[operation.def.group].perform.call(@engine, operation)
    else
      return operation.tail[1]

  # Process and pollute a single AST node with meta data.
  analyze: (operation, parent) ->
    operation.name = operation[0] if typeof operation[0] == 'string'
    def = @commands[operation.name]

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
      operation.name = (def.prefix || '') + operation[operation.skip] + (def.suffix || '')
      otherdef = def
      switch typeof def.lookup
        when 'function'
          def = def.lookup.call(@, operation)
        when 'string'
          def = @commands[def.lookup + operation.name]
        else
          def = @commands[operation.name]
      
    for child, index in operation
      if child instanceof Array
        @analyze(child, operation)

    if def == undefined
      operation.def = {noop: true}
      return operation

    operation.def  = def
    if def.serialized
      # String representation of operation without complex arguments
      operation.key  = @serialize(operation, otherdef, false)
      # String representation of operation with all types of arguments
      operation.path = @serialize(operation, otherdef)

      if def.group
        # String representation of operation with arguments filtered by type
        operation.groupped = @serialize(operation, otherdef, def.group)
        if groupper = @commands[def.group]
          groupper.analyze(operation)

    # Try predefined command if can't dispatch by number of arguments
    if typeof def == 'function'
      func = def
      operation.offset = 1
    else if func = def[operation.arity]
      operation.offset = 1
    else
      func = def.command
    operation.offset ?= def.offset if def.offset

    # Command may resolve to method, which will be called on the first argument
    if typeof func == 'string'
      operation.method = func
    else
      operation.func = func

    return operation

  # Serialize operation to a string with arguments, but without context
  serialize: (operation, otherdef, group) ->
    def = operation.def
    prefix = def.prefix || (otherdef && otherdef.prefix) || (operation.def.noop && operation.name) || ''
    suffix = def.suffix || (otherdef && otherdef.suffix) || ''
    separator = operation.def.separator
    
    after = before = ''
    for index in [1 ... operation.length]
      if op = operation[index]
        if typeof op != 'object'
          after += op
        else if op.key && group != false
          if (group && (groupper = @commands[group]))
            if (op.def.group == group)
              if tail = op.tail ||= (groupper.condition(op) && op)
                operation.groupped = groupper.promise(op, operation)
                tail.head = operation
                operation.tail = tail
                before += (before && separator || '') + op.groupped || op.key
              else continue
            else
              group = false 
              continue
          else if separator
            before += (before && separator || '') + op.path
          else
            before += op.path

    return before + prefix + after + suffix

  log: (operation, continuation) ->
    if continuation?
      if operation.def.serialized && !operation.def.hidden
        return continuation + operation.key 
      return continuation
    else
      return operation.path

  capture: ->
    if @buffer == undefined
      @buffer = null
      return true


@module ||= {}
module.exports = Expressions