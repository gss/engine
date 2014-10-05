# Interepretes given expressions lazily, functions are defined by @context
# supports forking for collections 
# (e.g. to apply something for every element matched by selector)

# Doesnt send the output until all commands are executed.

# * Input: Engine, reads commands
# * Output: Engine, outputs results, leaves out unrecognized commands as is

class Expressions
  displayName: 'Expressions'

  constructor: (@engine) ->

  # Evaluate operation depth first
  solve: (operation, continuation, scope = @engine.scope, meta, ascender, ascending) ->
    # Analyze operation once
    unless operation.def
      @engine.Operation.analyze(operation)

    # Use custom argument evaluator of parent operation if it has one
    if meta != operation && (solve = operation.parent?.def?.solve)
      solved = solve.call(@engine, operation, continuation, scope, meta, ascender, ascending)
      return if solved == false
      if typeof solved == 'string'
        continuation = solved


    # Use a shortcut operation when possible (e.g. native dom query)
    if operation.tail
      operation = @skip(operation, ascender, continuation)

    # Let engine modify continuation or return cached result
    if continuation && operation.path && operation.def.serialized
      result = @engine.Operation.getSolution(operation, continuation, scope)
      switch typeof result
        when 'string'
          if operation.def.virtual && result.charAt(0) != @engine.Continuation.PAIR
            return result
          else
            continuation = result
            result = undefined
        when 'object'
          return result 
          
        when 'boolean'
          return

    if result == undefined
      # Recursively solve arguments, stop on undefined
      args = @descend(operation, continuation, scope, meta, ascender, ascending)

      return if args == false

      if operation.name && !operation.def.hidden
        @engine.console.row(operation, args, continuation || "")

      # Execute function and log it in continuation path
      if operation.def.noop
        result = args
      else
        result = @execute(operation, continuation, scope, args)

        continuation = @engine.Operation.getPath(operation, continuation, scope)
    # Ascend the execution (fork for each item in collection)
    return @ascend(operation, continuation, result, scope, meta, ascender)

  # Get result of executing operation with resolved arguments
  execute: (operation, continuation, scope, args) ->
    scope ||= @engine.scope
    # Command needs current context (e.g. ::this)
    if !args
      node = scope
      (args ||= []).unshift scope
    # Operation has a context 
    else 
      node = @engine.getContext(args, operation, scope, node)

    # Use function, or look up method on the first argument. Falls back to builtin
    unless func = operation.func
      if method = operation.method
        if node && func = node[method]
          args.shift() if args[0] == node
          context = node
        unless func
          if !context && (func = scope[method])
            context = scope
          else if command = @engine.methods[method]
            func = @engine[command.displayName]
            if operation.def.scoped && operation.bound
              args.unshift scope

    unless func
      throw new Error("Couldn't find method: #{operation.method}")

    # Let context lookup for cached value
    if onBefore = operation.def.before
      result = @engine[onBefore](context || node || scope, args, operation, continuation, scope)
    
    # Execute the function
    if result == undefined
      result = func.apply(context || @engine, args)

    # Let context transform or filter the result
    if onAfter = operation.def.after
      result = @engine[onAfter](context || node || scope, args, result, operation, continuation, scope)

    return result

  # Evaluate operation arguments in order, break on undefined
  descend: (operation, continuation, scope, meta, ascender, ascending) ->
    args = prev = undefined
    skip = operation.skip
    shift = 0
    offset = operation.offset || 0
    for argument, index in operation
      continue if offset > index
      if (!offset && index == 0 && !operation.def.noop)
        args = [operation, continuation || operation.path, scope, meta]
        shift += 3
        continue
      else if ascender == index
        argument = ascending
      else if skip == index
        shift--
        continue
      else if argument instanceof Array
        # Leave forking mark in a path when resolving next arguments
        if ascender?
          contd = @engine.Continuation.descend(operation, continuation, ascender)
        else
          contd = continuation
        argument = @solve(argument, contd, scope, meta, undefined, prev)
      if argument == undefined
        if ((!@engine.eager && !operation.def.eager) || ascender?)
          if operation.def.capture and 
          (if operation.parent then operation.def.noop else !operation.name)

            stopping = true
          # Lists are allowed to continue execution when they hit undefined
          else if (!operation.def.noop || operation.name)
            return false
            
        offset += 1
        continue
      (args ||= [])[index - offset + shift] = prev = argument
    return args

  # Pass control (back) to parent operation. 
  # If child op returns DOM collection or node, evaluator recurses for each node.
  # In that case, it discards the descension stack
  ascend: (operation, continuation, result, scope, meta, ascender) ->
    if result? 
      if parent = operation.parent
        pdef = parent.def
      if parent && (pdef || operation.def.noop) && (parent.domain == operation.domain || parent.domain == @engine.document || parent.domain == @engine)
        # For each node in collection, recurse to a parent with id appended to continuation key
        if parent && @engine.isCollection(result)
          @engine.console.group '%s \t\t\t\t%O\t\t\t%c%s', @engine.Continuation.ASCEND, operation.parent, 'font-weight: normal; color: #999', continuation
          for item in result
            contd = @engine.Continuation.ascend(continuation, item)
            @ascend operation, contd, item, scope, meta, operation.index

          @engine.console.groupEnd()
          return
        else 
          # Some operations may capture its arguments (e.g. comma captures nodes by subselectors)
          return if pdef?.capture?.call(@engine, result, operation, continuation, scope, meta, ascender)

          # Topmost unknown commands are returned as results
          if operation.def.noop && operation.name && result.length == 1
            return 

          if !parent.name
            if result && (!parent ||    # if current command is root
              ((!pdef || pdef.noop) &&  # or parent is unknown command
                (!parent.parent ||        # and parent is a root
                parent.length == 1) ||    # or a branch with a single item
                ascender?))               # or if value bubbles up

              if result.length == 1
                result = result[0]

              return @engine.provide result

          else if parent && (ascender? || 
              ((result.nodeType || operation.def.serialized) && 
              (!operation.def.hidden || parent.tail == parent)))
            #if operation.def.mark && continuation != @engine.Continuation.PAIR
            #  continuation = @engine.Continuation(continuation, null, @engine[operation.def.mark])
            @solve parent, continuation, scope, meta, operation.index, result
            return

          return result
      else if parent && ((typeof parent[0] == 'string' || operation.exported) && (parent.domain != operation.domain))
        if !continuation && operation[0] == 'get'
          continuation = operation[3]
        solution = ['value', result, continuation || '', 
                    operation.toString()]
        unless scoped = (scope != @engine.scope && scope)
          if operation[0] == 'get' && operation[4]
            scoped = @engine.identity.solve(operation[4])
        if operation.exported || scoped
          solution.push(operation.exported ? null)
        if scoped
          solution.push(@engine.identity.provide(scoped))

        solution.operation = operation
        solution.parent    = operation.parent
        solution.domain    = operation.domain
        solution.index     = operation.index

        parent[operation.index] = solution
        @engine.engine.provide solution
        return
      else
        return @engine.provide result

    # Ascend without recursion (math, regular functions, constraints)
    return result

  # Advance to a groupped shortcut operation
  skip: (operation, ascender, continuation) ->
    if (operation.tail.path == operation.tail.key || ascender? || 
        (continuation && continuation.lastIndexOf(@engine.Continuation.PAIR) != continuation.indexOf(@engine.Continuation.PAIR)))
      return operation.tail.shortcut ||= 
        @engine.methods[operation.def.group].perform.call(@engine, operation)
    else
      return operation.tail[1]


@module ||= {}
module.exports = Expressions