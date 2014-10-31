# Return command definition (or instance) for given operation
# by arguments type signature. 
class Command 
  constructor: (operation) ->
    unless command = operation.command
      match = Command.match(@, operation)
      if typeof operation[0] == 'string'
        command = match.instance || new match(operation)
        if command.key?
          command.push(operation)
        else
          match.instance = command
      operation.command = command
    
    return command
  
  # Process arguments and match appropriate command
  @match: (engine, operation, parent, index) ->
    operation.parent = parent
    operation.index = index
    
    if typeof operation[0] == 'string'
      unless signature = engine.signatures[operation[0]]
        if engine.Default
          return engine.Default
        else
          throw operation[0] + ' is not defined'
      i = 0
    else
      i = -1
    j = operation.length
    Default = undefined 
    while ++i < j
      argument = operation[i]
      if argument?.push
        type = engine.Command(argument).type
      else
        type = @types[typeof argument]

      if match = signature[type]
        signature = match
      else unless (Default ||= signature.Default || engine.Default)
        throw "Unexpected " + type + " in " + operation[0]

    if command = Default || signature.resolved
      return command 
    else if engine.Default
      return engine.Default
    else
      throw "Too few arguments in" + operation[0]
      
      
  solve: (engine, operation, continuation, scope = @engine.scope, ascender, ascending) ->
    # Analyze operation
    if (command = @) == Command
      command = engine.Command(operation, !operation.hasOwnProperty('parent'))
    
    # Use custom argument evaluator of parent operation if it has one
    if (solve = operation.parent?.command?.solve)
      solved = solve.call(engine, operation, continuation, scope, ascender, ascending)
      return if solved == false
      if typeof solved == 'string'
        continuation = solved

    # Use a shortcut operation when possible (e.g. native dom query)
    if @tail

      if (@tail.path == @tail.key || ascender? || 
          (continuation && continuation.lastIndexOf(engine.Continuation.PAIR) != continuation.indexOf(engine.Continuation.PAIR)))
        operation = @head
      else
        operation = @tail[1]

    # Let engine modify continuation or return cached result
    if continuation && command.path
      result = engine.getSolution(operation, continuation, scope)
      switch typeof result
        when 'string'
          if operation[0] == '$virtual' && result.charAt(0) != engine.Continuation.PAIR
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
      args = command.descend(engine, operation, continuation, scope, ascender, ascending)

      return if args == false

      if operation.name && !command.hidden
        @engine.console.row(operation, args, continuation || "")

      # Execute function and log it in continuation path
      if command
        result = command.execute(engine, operation, continuation, scope, args)
        continuation = @getContinuation(operation, continuation, scope)
    # Ascend the execution (fork for each item in collection)
    return command.ascend(engine, operation, continuation, result, scope, ascender)

  getContinuation: (operation, continuation = '', scope) ->
    if @key && !@hidden
      if @scoped && operation.length == 3
        return continuation + @path
      else
        return continuation + @key
    else
      return continuation

  # Get result of executing operation with resolved arguments
  execute: (engine, operation, continuation, scope, args) ->
    scope ||= engine.scope
    # Let context lookup for cached value
    if @before
      result = @before(node || scope, args, engine, operation, continuation, scope)
    
    # Execute the function
    if result == undefined
      result = func.apply(engine, args)

    # Let context transform or filter the result
    if @after
      result = @after(node || scope, args, result, engine, operation, continuation, scope)

    return result

  # Evaluate operation arguments in order, break on undefined
  descend: (engine, operation, continuation, scope, ascender, ascending) ->
    args = prev = undefined
    offset = 0
    for argument, index in operation
      # Skip function name
      if index == 0 
        if typeof argument == 'string'
          offset = 1
          continue
          
      # Use ascending value
      if ascender == index
        argument = ascending

      # Process function calls and lists
      else if argument instanceof Array
        # Leave forking mark in a path when resolving next arguments
        if ascender?
          contd = engine.Continuation.descend(operation, continuation, ascender)
        else
          contd = continuation
        argument = @solve(argument, contd, scope, undefined, prev)

      # Handle undefined argument, usually stop evaluation
      if argument == undefined
        command = operation.command
        if (ascender? || (!engine.eager && command?.eager) )
          if command?.capture and 
          (if operation.parent then !command else !offset)

            stopping = true
          # Lists are allowed to continue execution when they hit undefined
          else if (command || offset)
            return false
            
        offset += 1
        continue
      (args ||= [])[index + offset] = prev = argument
    return args

  # Pass control (back) to parent operation. 
  # If child op returns DOM collection or node, evaluator recurses for each node.
  # In that case, it discards the descension value stack
  ascend: (engine, operation, continuation, result, scope, ascender) ->
    if result? 
      if parent = operation.parent
        pcommand = engine.Command(parent)
      if parent && (typeof parent[0] == 'string' || operation.command.noop) && (parent.domain == operation.domain || parent.domain == @engine.document || parent.domain == @engine)
        # For each node in collection, recurse to a parent with id appended to continuation key
        if parent && engine.isCollection(result)
          engine.console.group '%s \t\t\t\t%O\t\t\t%c%s', engine.Continuation.ASCEND, operation.parent, 'font-weight: normal; color: #999', continuation
          for item in result
            contd = engine.Continuation.ascend(continuation, item)
            @ascend engine, operation, contd, item, scope, operation.index

          engine.console.groupEnd()
          return
        else 
          # Some operations may capture its arguments (e.g. comma captures nodes by subselectors)
          return if pcommand?.capture?.call(engine, result, operation, continuation, scope, ascender)

          # Topmost unknown commands are returned as results
          if !operation.command && typeof operation[0] == 'string' && result.length == 1
            return 

          if !parent.name
            if result && (!parent ||    # if current command is root
              (!pcommand &&               # or parent is unknown command
                (!parent.parent ||        # and parent is a root
                parent.length == 1) ||    # or a branch with a single item
                ascender?))               # or if value bubbles up

              if result.length == 1
                result = result[0]
              
              # Return result back to engine
              return engine.provide result

          else if parent && (ascender? || 
              ((result.nodeType || operation.command.key) && 
              (!operation.command.hidden || parent.command.tail == parent)))
            #if operation.def.mark && continuation != @engine.Continuation.PAIR
            #  continuation = @engine.Continuation(continuation, null, @engine[operation.def.mark])
            @solve engine, parent, continuation, scope, operation.index, result
            return

          return result
      else if parent && ((typeof parent[0] == 'string' || operation.exported) && (parent.domain != operation.domain))
        if !continuation && operation[0] == 'get'
          continuation = operation[3]
          
        solution = ['value', result, continuation || '', 
                    operation.toString()]
        unless scoped = (scope != engine.scope && scope)
          if operation[0] == 'get' && operation[4]
            scoped = engine.identity.solve(operation[4])
        if operation.exported || scoped
          solution.push(operation.exported ? null)
        if scoped
          solution.push(engine.identity.provide(scoped))

        solution.operation = operation
        solution.parent    = operation.parent
        solution.domain    = operation.domain
        solution.index     = operation.index

        parent[operation.index] = solution
        engine.engine.provide solution
        return
      else
        return engine.provide result

    # Ascend without recursion (math, regular functions, constraints)
    return result
       
  # Define command subclass
  @extend: (definition, methods) ->
    
    if (Constructor = @prototype.constructor) == Command || Constructor.length == 0
      Constructor = undefined
    Kommand = ->
      if Constructor
        Constructor.apply(@, arguments)
    Kommand.__super__ = @

    Prototype = ->
    Prototype.prototype = @prototype
    Kommand.prototype = new Prototype
    
    # Define given properties on a prototype  
    for property, value of definition
      Kommand.prototype[property] = value
      
    if methods
      Command.define.call(Kommand, methods)
      
    return Kommand
      
  # Define subclasses for given methods
  @define: (name, options) ->
    if !options
      for property, value of name
        Command.define.call(@, property, value)
    else
      @[name] = Command.extend.call(@, options)
    return
    
  
  # Attempt to re-use argument's command for the operation if groups match
  @reduce: (operation, command) ->
    for i in [1 ... operation.length]
      if argument = operation[i]
        if argument.command?.push?(operation, command)
          return argument.command
  
  @types:
    'string': 'String'
    'number': 'Number'
  
  # Find defined command signatures in the engine and register their methods
  @compile: (engine, command) ->
    unless command
      for property, value of engine
        if (proto = value?.prototype)? && proto instanceof Command
          if property.match /^[A-Z]/
            @compile(engine, value)
      return

    Types = command.types = {}
    for property, value of command
      if property.match /^[A-Z]/
        if value?.prototype instanceof Command
          Types[property] = value
          @compile engine, value
            
    for property, value of command
      if value != Command[property] && property != '__super__'
        if typeof value == 'function'
          if value?.prototype instanceof Command
            unless property.match /^[A-Z]/
              engine.signatures.set property, value, Types
    @Types = Types
      
    @
    
  module.exports = Command