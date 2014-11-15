# Return command definition (or instance) for given operation
# by arguments type signature. 
class Command 
  constructor: (operation, parent, index) ->
    unless command = operation.command
      match = Command.match(@, operation, parent, index)
      unless command = match.instance
        command = new match(operation)
      unless parent
        command = Command.descend(command, @, operation)
      if command.key?
        command.push(operation)
      else
        match.instance = command
      operation.command = command
    
    return command

  @subtype: (engine, operation, types) ->

  
  # Process arguments and match appropriate command
  @match: (engine, operation, parent, index) ->
    # Function call
    first = operation[0]
    i = -1
    switch typeof first
      when 'string'
        unless signature = engine.signatures[first]
          unless Default = engine.Default
            throw new Error '`' + first + '` is not defined in ' + engine.displayName + ' domain'
        i = 0
      when 'object'
        type = @typeOfObject(first)
        unless signature = engine.signatures[type.toLowerCase()]
          unless Default = engine[type] || Command[type]
            throw new Error '`' + type + '` can\'t be invoked in ' + engine.displayName + ' domain'
        else
          i = 0

    j = operation.length
    while ++i < j
      argument = operation[i]
      if argument?.push
        argument.parent ?= operation
        type = engine.Command(argument, operation, i).type
      else
        type = @types[typeof argument]
        if type == 'Object'
          type = @typeOfObject(argument)
      if signature
        if match = signature[type] || signature.Any
          signature = match
        else unless (Default ||= signature.Default || engine.Default)
          throw new Error "Unexpected `" + type + "` in `" + operation[0] + '` of ' + engine.displayName + ' domain'


    if command = Default || signature?.resolved || engine.Default
      return command
    else
      throw new Error "Too few arguments in `" + operation[0] + '` for ' + engine.displayName + ' domain'
  
  # Choose a sub type for command    
  @descend: (command, engine, operation) ->
    if variants = command.variants
      for type in variants
        if type::condition(engine, operation, command)
          unless command = type.instance
            command = new type(operation)
          operation.command = command
          unless command.key?
            type.instance = command
          break
    for argument in operation
      if cmd = argument.command
        Command.descend(cmd, engine, argument)
    return command
      
  continue: (result, engine, operation, continuation) ->
    return continuation

  # Hook that happens before actual function call
  # If it returns something, the function will not be called
  before: ->

  # Hook that happens after function call or succesful before hook
  # Can transform the returned value
  after: (args, result) ->
    return result

  # Provide logging for an action
  log: (args, engine, operation, continuation, scope, name) ->
    engine.console.row(name || operation[0], args, continuation || "")

  solve: (engine, operation, continuation, scope, ascender, ascending) -> 
    domain = operation.domain || engine
    
    # Use a shortcut operation when possible (e.g. native dom query)
    if @head# && @head != operation
      return @jump(domain, operation, continuation, scope, ascender, ascending)

    # Let engine modify continuation or return cached result
    switch typeof (result = @retrieve(domain, operation, continuation, scope))
      when 'string'
        if @stringy && result.charAt(0) != engine.Continuation.PAIR
          return result
        else
          continuation = result
          result = undefined
          
      when 'object'
        if continuation.indexOf(engine.Continuation.PAIR) > -1
            return result
        
      when 'boolean'
        return

    if result == undefined
      # Recursively solve arguments, stop on undefined
      args = @descend(domain, operation, continuation, scope, ascender, ascending)

      return if args == false

      @log(args, domain, operation, continuation)

      # Execute command with hooks
      result = @before(args, domain, operation, continuation, scope)
      result ?= @execute.apply(@, args)
      if result = @after(args, result, domain, operation, continuation, scope)
        continuation = @continue(result, domain, operation, continuation, scope)

    if result?
      return @ascend(engine, operation, continuation, scope, result, ascender, ascending)

  # Evaluate operation arguments in order, break on undefined
  descend: (engine, operation, continuation, scope, ascender, ascending) ->
    for index in [1 ... operation.length] by 1

      # Use ascending value
      
      if ascender == index
        argument = ascending
      else
        argument = operation[index]

        if argument instanceof Array
          command = argument.command || engine.Command(argument)
          argument.parent ||= operation
            
          # Leave forking/pairing mark in a path when resolving next arguments
          contd = @connect(engine, operation, continuation, scope, args, ascender)

          # Evaluate argument
          argument = command.solve(operation.domain || engine, argument, contd || continuation, scope)
            
          if argument == undefined
            return false
          
      # Place argument at position enforced by signature
      (args || args = Array(operation.length - 1 + @padding))[@permutation[index - 1]] = argument
    
    # Methods that accept more arguments than signature gets extra meta arguments
    extras = @extras ? @execute.length - index + 1
    if extras > 0
      for i in [0 ... extras] by 1
        (args ||= Array(operation.length - 1 + @padding)).push arguments[i]

    return args

  # Pass control to parent operation. 
  ascend: (engine, operation, continuation, scope, result, ascender, ascending) ->
    
    if (parent = operation.parent)

      # Return partial solution to dispatch to parent command's domain
      if domain = operation.domain
        if (wrapper = parent.domain) && wrapper != domain && wrapper != engine
          @transfer(operation.domain, parent, continuation, scope, ascender, ascending, parent.command)
          return
        
      # Hook parent command to capture yielded value 
      if top = parent.command
        if yielded = top.yield?(result, engine, operation, continuation, scope, ascender)
          return if yielded == true
          return yielded

      # Recurse to ascend query result
      if ascender?
        return top.solve(parent.domain || engine, parent, continuation, scope, parent.indexOf(operation), result)
      
    return result

  # Reinitialize foreign expression as local to parent domain
  patch: (engine, operation, continuation, scope, replacement) ->
    op = @sanitize(engine, operation, undefined, replacement).parent
    domain = replacement || engine
    op.command.transfer(domain, op, continuation, scope, undefined, undefined, op.command, replacement)




  # Write meta data for a foreign domain
  transfer: (engine, operation, continuation, scope, ascender, ascending, top, replacement) ->
    if (meta = @getMeta(operation))
      for path of operation.variables
        if (value = (replacement || engine).values[path])?
          (meta.values ||= {})[path] = value
        else if meta.values?[path]
          delete meta.values[path]
    if top
      parent = operation
      while parent.parent?.domain == parent.domain && !(parent.parent.command instanceof Command.List)
        parent = parent.parent
      engine.updating.push([parent], parent.domain)


  getMeta: (operation) ->
    parent = operation
    while parent = parent.parent
      if parent[0].key?
        return parent[0]

  connect: (engine, operation, continuation, scope, args, ascender) ->
    if ascender?
      return engine.Continuation.get(continuation, null, engine.Continuation.PAIR)

  fork: (engine, continuation, item) ->
    return engine.Continuation.get(continuation + engine.identity.yield(item), null, engine.Continuation.ASCEND)

  # Return alternative operation to process
  jump: ->

  # Do something with arguments
  #execute: ->

  # Retrieve cached result
  retrieve: ->

  # Map to reorder arguments, no changes by default
  permutation: [0 ... 10]

  # Add this nubmer of undefineds at the end of argument list
  padding: 0

  # Number of extra arguments (max 6: engine, operation, continuation, scope, ascender, ascending)
  # Computed automatically for each command by checking `.length` of `@execute` callback
  extras: undefined

  toExpression: (operation) ->
    switch typeof operation
      when 'object'
        switch operation[0]
          when 'get'
            return operation[1]
          else
            return @toExpression(operation[1]) + operation[0] + @toExpression(operation[2])
      else
        return operation

  # Forget command  
  sanitize: (engine, operation, ascend, replacement) ->

    # Clean sub-expressions with the same domain
    for argument in operation
      unless ascend == argument
        if argument?.domain == engine
          if argument[0] == 'get'
            return ascend
          @sanitize(engine, argument, false)

    operation.domain = operation.command = undefined

    if replacement
      operation.domain = replacement
      replacement.Command(operation)

    unless ascend == false
      if operation.parent?.domain == engine
        return @sanitize(engine, operation.parent, operation, replacement)

    return operation

  # Define command subclass, and its class and instance properties
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
    
    Kommand.extend   = Command.extend
    Kommand.define   = Command.define

    for property, value of definition
      Kommand::[property] = value
      
    if methods
      Kommand.define(methods)

    return Kommand
      
  # Define subclasses for given methods
  @define: (name, options) ->
    if !options
      for property, value of name
        Command.define.call(@, property, value)
    else
      if typeof options == 'function'
        options = {execute: options}
      @[name] = @extend(options)
    return

  @types:
    'string': 'String'
    'number': 'Number'
    'object': 'Object'

  # Convert native object into lookup string
  @typeOfObject: (object) ->
    if object.nodeType
      return 'Node'
    if object.push
      return 'List'
    return 'Object'
  
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
          @compile(engine, value)
            
    for property, value of command
      if value != Command[property] && property != '__super__'
        if value?.prototype instanceof Command
          unless property.match /^[A-Z]/
            engine.Signatures.set(engine.signatures, property, value, Types)
            if engine.helps
              engine.engine[property] = @Helper(engine, property)
              if aliases = value.prototype.helpers
                for name in aliases
                  engine.engine[name] = engine.engine[property]
    @Types = Types
      
    @
  
  @Empty: {}

  @Helper: (engine, name) ->
    signature = engine.signatures[name] 
    base = [name]
    engine[name] ||= ->
      args = Array.prototype.slice.call(arguments)
      command = Command.match(engine, base.concat(args)).prototype
      args.length = command.permutation.length + command.padding
      return command.execute.apply(command, args.concat(engine, args, '', engine.scope))

class Command.List extends Command
  constructor: ->
  extras: 0

  execute: ->

  log: ->

  # Capture results and do nothing with them to stop propagation
  yield: ->
    return true

  # Fast descender for lists - doesnt build evaluated list of arguments
  descend: (engine, operation, continuation, scope, ascender, ascending) ->
    for argument, index in operation
      if command = argument?.command
        command.solve(engine, argument, continuation, scope)
    return

# An optional command for unmatched ast
class Command.Default extends Command
  type: 'Default'
  constructor: ->

# Command for objects called as functions
class Command.Object extends Command
  type: 'List'
  constructor: ->


module.exports = Command

