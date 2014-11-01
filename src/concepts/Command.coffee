# Return command definition (or instance) for given operation
# by arguments type signature. 
class Command 
  constructor: (operation, parent, index) ->
    unless command = operation.command
      match = Command.match(@, operation, parent, index)
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

    # Function call
    if typeof operation[0] == 'string'
      unless signature = engine.signatures[operation[0]]
        unless Default = engine.Default
          throw operation[0] + ' is not defined'
      i = 0
    # List
    else
      i = -1
      Default = engine.List || Command.List

    j = operation.length
    while ++i < j
      argument = operation[i]
      if argument?.push
        type = engine.Command(argument, operation, i).type
      else
        type = @types[typeof argument]

      if signature
        if match = signature[type]
          signature = match
        else unless (Default ||= signature.Default)
          throw "Unexpected " + type + " in " + operation[0]

    if command = Default || signature.resolved || engine.Default
      return command 
    else
      throw "Too few arguments in" + operation[0]
      
      
  solve: (engine, operation, continuation, scope, ascender, ascending) ->
    # Use a shortcut operation when possible (e.g. native dom query)
    if tail = @tail
      operation = @jump(engine, tail, continuation, ascender)

    # Let engine modify continuation or return cached result
    if continuation && @path
      result = engine.getSolution(operation, continuation, scope)
      switch typeof result
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
      return @ascend(engine, operation, continuation, result, scope, ascender)

  continue: (engine, operation, continuation) ->
    return continuation

  # Hook that happens before actual function call
  # If it returns something, the function will not be called
  before: ->

  # Hook that happens after function call or succesful before hook
  # Can transform the returned value
  after: (args, result) ->
    return result

  log: (args, engine, operation, continuation) ->
    engine.console.row(operation, args, continuation || "")

  # Evaluate operation arguments in order, break on undefined
  descend: (engine, operation, continuation, scope, ascender, ascending) ->
    args = prev = undefined

    for index in [@start ... operation.length] by 1
      # Use ascending value
      argument =
        if ascender == index
          ascending
        else
          operation[index]

      # Process function calls and lists
      if command = argument.command
        # Leave forking/pairing mark in a path when resolving next arguments
        if ascender?
          contd = @connect(operation, continuation)
        argument = command.solve(engine, argument, contd || continuation, scope)

        # Handle undefined argument, usually stop evaluation
        if argument == undefined
          unless command.eager || engine.eager
            return false
          else
            continue
      
      (args ||= []).push(argument)

    for i in [0 ... @extras ? @execute.length - index + 1] by 1
      args.push arguments[i]

    return args

  connect: (engine, operation, continuation) ->
    return engine.Continuation.get(continuation, null, @PAIR)

  fork: (engine, continuation) ->
    return engine.Continuation.get(continuation, null, @ASCEND)

  # Pass control to parent operation. 
  # If child op returns DOM collection or node, evaluator recurses for each node.
  # In that case, it discards the descension value stack
  ascend: (engine, operation, continuation, result, scope, ascender) ->
    unless parent = operation.parent
      return

    if (top = parent.command).constructor == Command.List
      return

    # Return partial solution to dispatch to parent command's domain
    if parent.domain != operation.domain
      engine.engine.subsolve(operation, continuation, scope)
      return
    
    # Some operations may capture its arguments (e.g. comma captures nodes by subselectors)
    if top.provide?(engine, result, operation, continuation, scope, ascender)
      return 

    # Recurse to ascend query result
    if ascender?
      top.solve engine, parent, continuation, scope, operation.index, result
    else
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
    

    for property, value of definition
      Kommand::[property] = value
      
    if methods
      Command.define.call(Kommand, methods)
    return Kommand
      
  # Define subclasses for given methods
  @define: (name, options) ->
    if !options
      for property, value of name
        Command.define.call(@, property, value)
    else
      if typeof options == 'function'
        options = {execute: options}
      @[name] = Command.extend.call(@, options)
    return
    
  
  # Attempt to re-use argument's command for the operation if groups match
  @reduce: (operation, command) ->
    for i in [1 ... operation.length] by 1
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
  
  @Empty: {}
  start: 1

class Command.List extends Command
  start: 0
  extras: 0

  log: ->

class Command.Default extends Command



module.exports = Command

