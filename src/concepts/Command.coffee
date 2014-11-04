# Return command definition (or instance) for given operation
# by arguments type signature. 
class Command 
  constructor: (operation, parent, index) ->
    unless command = operation.command
      match = Command.match(@, operation, parent, index)
      unless command = match.instance
        command = new match(operation)
        #Command.optimize(match)
      if command.key?
        command.push(operation)
      else
        match.instance = command
      operation.command = command
    
    return command
  
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
        type = engine.Command(argument, operation, i).type
      else
        type = @types[typeof argument]

      if signature
        if match = signature[type] || signature.Any
          signature = match
        else unless (Default ||= signature.Default || engine.Default)
          throw new Error "Unexpected `" + type + "` in " + operation[0]


    if command = Default || signature?.resolved || engine.Default
      return command 
    else
      throw new Error "Too few arguments in `" + operation[0] + '` for ' + engine.displayName + ' domain'
      
      
  continue: (engine, operation, continuation) ->
    return continuation

  # Hook that happens before actual function call
  # If it returns something, the function will not be called
  before: ->

  # Hook that happens after function call or succesful before hook
  # Can transform the returned value
  after: (args, result) ->
    return result

  # Provide logging for an action
  log: (args, engine, operation, continuation) ->
    engine.console.row(operation[0], args, continuation || "")

  solve: (engine, operation, continuation, scope, ascender, ascending) ->
    # Use a shortcut operation when possible (e.g. native dom query)
    if tail = operation.tail
      operation = @jump(tail, engine, operation, continuation, scope, ascender)

    # Let engine modify continuation or return cached result
    switch typeof (result = @retrieve(engine, operation, continuation, scope))
      when 'string'
        if operation[0] == 'virtual' && result.charAt(0) != engine.Continuation.PAIR
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
      args = @descend(engine, operation, continuation, scope, ascender, ascending)

      return if args == false

      @log(args, engine, operation, continuation)

      # Execute command with hooks
      result = @before(args, engine, operation, continuation, scope)
      result ?= @execute.apply(@, args)
      result = @after(args, result, engine, operation, continuation, scope)

    if result?
      continuation = @continue(engine, operation, continuation, scope)
      return @ascend(engine, operation, continuation, result, scope, ascender, ascending)

  # Evaluate operation arguments in order, break on undefined
  descend: (engine, operation, continuation, scope, ascender, ascending) ->
    for index in [1 ... operation.length] by 1
      # Use ascending value
      argument =
        if ascender == index
          ascending
        else
          operation[index]

      if command = argument.command
        unless argument.parent
          argument.parent = operation
          
        # Leave forking/pairing mark in a path when resolving next arguments
        if ascender?
          contd = @connect(engine, operation, continuation, scope, args)

        # Evaluate argument
        argument = command.solve(engine, argument, contd || continuation, scope)

        return false if argument == undefined
          
      # Place argument at position enforced by signature
      unless args
        args = Array(operation.length - 1 + @padding)
      args[@permutation[index - 1]] = argument

    # Methods that accept more arguments than signature receive extra meta information
    for i in [0 ... @extras ? @execute.length - index + 1] by 1
      args.push arguments[i]

    return args

  # Pass control to parent operation. 
  ascend: (engine, operation, continuation, result, scope, ascender, ascending) ->
    unless (parent = operation.parent)
      return

    if top = parent.command
      # Hook parent command to capture yielded value 
      if top.yield?(engine, result, operation, continuation, scope, ascender)
        return 

    # Return partial solution to dispatch to parent command's domain
    if parent.domain != operation.domain
      @transfer(engine, parent, continuation, scope, ascender, ascending, top)
      return
      
    if ascender?
      # Recurse to ascend query result
      return top.solve(engine, parent, continuation, scope, parent.indexOf(operation), result)
    
    return result

  # Write meta data for a foreign domain
  transfer: (engine, operation, continuation, scope, ascender, ascending, top) ->
    if meta = @getMeta(operation)
      for path of operation.variables
        if (value = engine.values[path])?
          (meta.values ||= {})[path] = value
    if top
      parent = operation
      while parent.parent.domain == parent.domain
        parent = parent.parent
      @update([parent])


  getMeta: (operation) ->
    parent = operation
    while parent = parent.parent
      if parent[0].key?
        return parent[0]

  connect: (engine, operation, continuation) ->
    return engine.Continuation.get(continuation, null, engine.Continuation.PAIR)

  fork: (engine, continuation, item) ->
    return engine.Continuation.get(continuation + engine.identity.yield(item), null, engine.Continuation.ASCEND)

  # Return different operation
  jump: (engine, operation) ->
    return operation

  # Do something with arguments
  execute: ->

  # Retrieve cached result
  retrieve: ->

  # Map to reorder arguments
  permutation: [0 ... 10]

  # Add this nubmer of undefineds at the end of argument list
  padding: 0

  # Number of extra arguments (max 6: engine, operation, continuation, scope, ascender, ascending)
  # Computed automatically for each command by checking `.length` of `@execute` callback
  extras: undefined

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
    
    Kommand.extend = Command.extend
    Kommand.define = Command.define

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
        if name == 'class'
          debugger
        options = {execute: options}
      @[name] = @extend(options)
    return
    
  
  # Attempt to re-use argument's command for the operation if groups match
  @reduce: (operation, command) ->
    for i in [1 ... operation.length] by 1
      if argument = operation[i]
        if argument.command?.push?(operation, command)
          return argument.command
  
  @optimize: (command) ->
    prototype = command::
    for property of prototype
      unless prototype.hasOwnProperty(property)
        prototype[property] = prototype[property]

  @types:
    'string': 'String'
    'number': 'Number'
    'object': 'Object'

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
    @Types = Types
      
    @
  
  @Empty: {}

  @Helper: (engine, name) ->
    signature = engine.signatures[name] 
    base = [name]
    engine[name] ||= ->
      args = Array.prototype.slice.call(arguments)
      command = Command.match(engine, base.concat(args))
      return command::execute.apply(command.prototype, args.concat(engine, args, '', engine.scope))

class Command.List extends Command
  constructor: ->
  extras: 0

  log: ->

  # Capture results and do nothing with them
  yield: ->
    return true

  # Fast descender for lists that doesnt build argument list
  descend: (engine, operation, continuation, scope, ascender, ascending) ->
    for argument in operation
      if command = argument?.command
        command.solve(engine, argument, continuation, scope)
    return

class Command.Default extends Command
  constructor: ->

class Command.Object extends Command
  constructor: ->


module.exports = Command

