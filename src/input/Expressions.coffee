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
  pull: ->
    if @buffer == undefined
      @buffer = null
      buffer = true
    #console.log(@engine.onDOMContentLoaded && 'Document' || 'Worker', 'input:', JSON.parse JSON.stringify arguments[0])
    result = @evaluate.apply(@, arguments)
    if buffer
      @flush()
    return result

  # Hook: Buffer equasions if needed
  push: (args, batch) ->
    return unless args?
    if (buffer = @buffer) != undefined
      if buffer
        # Optionally, combine subsequent commands (like remove)
        if batch
          if last = buffer[buffer.length - 1]
            if last[0] == args[0]
              if last.indexOf(args[1]) == -1
                last.push.apply(last, args.slice(1))
              return buffer
      else 
        @buffer = buffer = []
      buffer.push(args)
      return
    else
      return @output.pull.apply(@output, args)

  # Output buffered expressions
  flush: ->
    console.log(@engine.onDOMContentLoaded && 'Document' || 'Worker', 'Output:', @buffer)
    @lastOutput = GSS.clone @buffer
    @output.pull(@buffer) if @buffer
    @buffer = undefined

  # Evaluate operation depth first
  evaluate: (operation, continuation, scope, ascender, ascending, overloaded) ->
    # Analyze operation once
    unless operation.def
      @analyze(operation)
    
    # Use custom argument evaluator of parent operation if it has one
    if !overloaded && operation.parent
      overloading = @overload(operation, continuation, scope, ascender, ascending)
      return overloading unless overloading == @

    # Use a shortcut operation when possible (e.g. native dom query)
    if operation.tail
      operation = @skip(operation, ascender)

    # Use computed result by *cough* parsing continuation string
    if continuation && operation.path
      if (result = @reuse(operation.path, continuation)) != false
        debugger
        return result

    # Recursively evaluate arguments, stop on undefined
    args = @resolve(operation, continuation, scope, ascender, ascending)
    return if args == false

    # Execute function
    if operation.def.noop
      result = args
    else
      result = @execute(operation, continuation, scope, args)

    # Log operation in a continuation path
    breadcrumbs = @breadcrumb(operation, continuation)
    debugger if breadcrumbs && breadcrumbs.indexOf('scope::scope') > -1

    # Ascend the execution (fork for each item in collection)
    return @ascend(operation, breadcrumbs, result, scope, ascender)

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
          else
            func = @[method] || @context[method]

    # Execute the function
    unless func
      throw new Error("Engine broke, couldn't find method: #{operation.method}")

    result = func.apply(context || @context, args)

    # Let context transform or filter the result
    if callback = operation.def.callback
      result = @context[callback](context || node || scope, args, result, operation, continuation, scope)

    return result

  # Try to read saved results within continuation
  reuse: (path, continuation) ->
    last = -1
    if path.indexOf('::scope') > -1 && continuation && continuation.indexOf('::scope') > -1
      debugger
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
          return @engine[id]
        else
          return @engine.queries[continuation.substring(0, separator)]
      break if breaking
      last = index
    return false

  # Evaluate operation arguments in order, break on undefined
  resolve: (operation, continuation, scope, ascender, ascending) ->
    args = prev = undefined
    skip = operation.skip
    offset = operation.offset || 0
    for argument, index in operation
      continue if offset > index
      if index == 0 && (!operation.def.noop && !offset)
        argument = continuation || operation
      else if ascender == index
        argument = ascending
      else if skip == index
        offset += 1
        continue
      else if argument instanceof Array
        # Leave forking mark in a path when resolving next arguments
        if ascender < index
          contd = continuation
          contd += '–' unless contd.charAt(contd.length - 1) == '–'
        argument = @evaluate(argument, contd || continuation, scope, undefined, prev)
      if argument == undefined
        return false if (!operation.def.eager || ascender?) && (!operation.def.noop || operation.parent)
        offset += 1
        continue
      (args ||= [])[index - offset] = prev = argument
    return false if !args && operation.def.noop
    return args
  # Pass control to parent operation 
  ascend: (operation, continuation, result, scope, ascender) ->
    if result? 
      if (parent = operation.parent) || operation.def.noop
        if parent && @engine.isCollection(result)
          console.group continuation
          for item in result
            breadcrumbs = @engine.getPath(continuation, item)
            @evaluate operation.parent, breadcrumbs, scope, operation.index, item
          console.groupEnd continuation
          return
        else if parent && parent.def.capture
          return parent.def.capture @engine, result, parent, continuation, scope
        else 
          # A topmost noop operation adds itself to output queue
          if operation.def.noop
            if result && (!parent || (parent.def.noop && parent.length == 1 || ascender?))
              if result.length == 1
                return @push result[0]
              else
                return @push result
          else if parent && (ascender? || result.nodeType)
            @evaluate parent, continuation, scope, operation.index, result
            return 
      else
        return @push result

    return result

  # Advance to a groupped shortcut operation
  skip: (operation, ascender) ->
    if (operation.tail.path == operation.tail.key || ascender?)
      return operation.tail.shortcut ||= @context[operation.def.group].perform(@, operation)
    else
      return operation.tail[1]

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
        if groupper = @context[def.group]
          groupper.analyze(operation)

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
          if (group && (groupper = @context[group]))
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

  breadcrumb: (operation, continuation) ->
    if continuation?
      if operation.def.serialized && !operation.def.hidden
        return continuation + operation.key 
      return continuation
    else
      return operation.path

  overload: (operation, continuation, scope, ascender, ascending) ->
    parent = operation.parent
    if (pdef = parent.def) && pdef.evaluate
      evaluated = pdef.evaluate.call(@, operation, continuation, scope, ascender, ascending)
      return evaluated
    return @


module.exports = Expressions