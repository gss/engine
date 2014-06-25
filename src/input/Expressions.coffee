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

  flush: ->
    console.log(@engine.onDOMContentLoaded && 'Document' || 'Worker', 'Output:', @buffer)
    @lastOutput = GSS.clone @buffer
    @output.pull(@buffer) if @buffer
    @buffer = undefined

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

  # Evaluate operation depth first
  evaluate: (operation, continuation, scope, ascender, ascending, overloaded) ->
    console.error(operation)
    # Use custom argument evaluator of parent operation if it has one
    def = operation.def || @analyze(operation).def
    if (parent = operation.parent) && !overloaded
      if (pdef = parent.def) && pdef.evaluate
        evaluated = pdef.evaluate.call(@, operation, continuation, scope, ascender, ascending)
        return evaluated unless evaluated == @

    # Use a shortcut operation when possible (e.g. native dom query)
    if operation.tail
      if (operation.tail.path == operation.tail.key || ascender?)
        operation = operation.tail.shortcut ||= @context[def.group].perform(@, operation)
      else
        operation = operation.tail[1]
      parent = operation.parent
      ascender = ascender != undefined && 1 || undefined
      def = operation.def

    if ((p = operation.path) && continuation)
      last = -1
      while (index = continuation.indexOf('–', last + 1))
        if index == -1
          break if last == continuation.length - 1
          index = continuation.length
          breaking = true
        start = continuation.substring(last + 1, last + 1 + p.length)
        if start == p
          separator = last + 1 + p.length
          if separator < index
            if continuation.charAt(separator) == '$'
              id = continuation.substring(separator, index)
          if id
            return @engine[id]
          else
            return @engine.queries[continuation.substring(0, separator)]
        break if breaking
        last = index

    # Recursively evaluate arguments, stop on undefined.
    args = prev = undefined
    skip = operation.skip
    offset = operation.offset || 0
    for argument, index in operation
      continue if offset > index
      if index == 0 && (!operation.noop && !offset)
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
        return if (!def.eager || ascender?) && (!operation.noop || operation.parent)
        offset += 1
        continue
      (args ||= [])[index - offset] = prev = argument

    # No-op commands are to be executed by something else (e.g. Solver)
    if operation.noop
      if parent && parent.def.capture
        return parent.def.capture @engine, args, parent, continuation, scope
      else
        if args && (!parent || (parent.noop && (parent.length == 1 || ascender?)))
          @push args.length == 1 && args[0] || args
          return
        return args

    # Use function, or look up method on the first argument. Falls back to builtin
    scope ||= @engine.scope
    if def.scoped || !args
      (args ||= []).unshift scope
    if typeof args[0] == 'object'
      node = args[0]
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

    if continuation
      path = continuation
      path += operation.key if def.serialized && !def.hidden
    else
      path = operation.path
    
    # Ascend the execution (fork for each item in collection)
    if result?
      if parent
        if @engine.isCollection(result)
          #console.group path
          for item in result
            subpath = @engine.getPath(path, item)
            @evaluate parent, subpath, scope, operation.index, item
          #console.groupEnd path
          return
        else if parent.def.capture
          return parent.def.capture @engine, result, parent, continuation, scope
        else if (ascender? || result.nodeType)
          @evaluate parent, path, scope, operation.index, result
          return
      else
        return @push result

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
    prefix = def.prefix || (otherdef && otherdef.prefix) || (operation.noop && operation.name) || ''
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


module.exports = Expressions