# Return command definition (or instance) for given operation
# by arguments type signature. 
class Command 
  type: 'Command'

  constructor: (operation, parent, index) ->
    unless command = operation.command
      match = Command.match(@, operation, parent, index)
      unless command = match.instance
        command = new match(operation, @)
      if command.key?
        command.push(operation)
      else
        (command.definition || match).instance = command
      operation.command = command
      unless parent
        command = Command.descend(command, @, operation)
    
    return command

  # Evaluate operation arguments, execute command, propagate result
  solve: (engine, operation, continuation, scope, ascender, ascending) -> 
    domain = operation.domain || engine
    
    # Let engine modify continuation or return cached result
    switch typeof (result = @retrieve(domain, operation, continuation, scope, ascender, ascending))
      when 'undefined'
        break
      when 'function'
        unless (continuation = result.call(@, engine, operation, continuation, scope))?
          return
        result = undefined
      else
        if continuation.indexOf(@PAIR) > -1 || @reference
          return result


    if result == undefined
      # Use a shortcut operation when possible (e.g. native dom query)
      if @head
        return @jump(domain, operation, continuation, scope, ascender, ascending)

      # Recursively solve arguments, stop on undefined
      args = @descend(domain, operation, continuation, scope, ascender, ascending)

      return if args == false

      @log(args, engine, operation, continuation, scope)

      # Execute command with hooks
      result = @before(args, domain, operation, continuation, scope, ascender, ascending)
      result ?= @execute.apply(@, args)
      if result = @after(args, result, domain, operation, continuation, scope, ascender, ascending)
        continuation = @continue(result, domain, operation, continuation, scope, ascender, ascending)

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
          # Find a class that will execute the command
          command = argument.command || engine.Command(argument)
          argument.parent ||= operation
            
          # Leave forking/pairing mark in a path when resolving next arguments
          if continuation && ascender && ascender != index
            contd = @connect(engine, operation, continuation, scope, args, ascender)

          # Evaluate argument
          argument = command.solve(operation.domain || engine, argument, contd || continuation, scope, undefined, ascending)
            
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
        
      # Offer parent command to capture a value
      if top = parent.command
        if yielded = top.yield?(result, engine, operation, continuation, scope, ascender)
          return if yielded == true
          return yielded

      # Recurse to execute parent expression with ascending query result
      if ascender?
        return top.solve(parent.domain || engine, parent, continuation, scope, parent.indexOf(operation), result)
      
    return result



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
    if advices = command.advices
      for type in advices
        if (proto = type::).condition
          continue unless proto.condition(engine, operation, command)
        else
          type(engine, operation, command)
          continue

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


  # Reinitialize foreign expression as local to parent domain
  patch: (engine, operation, continuation, scope, replacement) ->
    op = @sanitize(engine, operation, undefined, replacement)
    unless op.parent.command.boundaries
      op = op.parent
    domain = replacement || engine
    if op.domain != domain && op.command
      op.command.transfer(domain, op, continuation, scope, undefined, undefined, op.command, replacement)

  # Write meta data for a foreign domain, optionally queues parent operation
  transfer: (engine, operation, continuation, scope, ascender, ascending, top, replacement) ->
    if (meta = @getMeta(operation))
      for path of operation.variables
        if (value = (replacement || engine).values[path])?
          (meta.values ||= {})[path] = value
        else if meta.values?[path]
          delete meta.values[path]
    if top
      parent = operation
      while parent.parent?.domain == parent.domain && !parent.parent.command.boundaries
        operation = parent
        parent = parent.parent
      unless domain = parent.domain
        if domain = parent.command.domains?[parent.indexOf(operation)]
          domain = engine[domain]
      engine.updating.push([parent], domain)

  # Meta information is stored in a wrapper root object by convention
  # Used to restore continuation/scope and to export values across domains
  getMeta: (operation) ->
    parent = operation
    while parent = parent.parent
      if parent[0].key?
        return parent[0]

  # Return pairing continuation after one query has been resolved
  connect: (engine, operation, continuation, scope, args, ascender) ->
    if ascender? && continuation[continuation.length - 1] != @DESCEND
      return @delimit(continuation, @PAIR)

  # Return parent scope continuation to execute and pair another query
  rewind: (engine, operation, continuation, scope) ->
    return @getPrefixPath(engine, continuation)

  # Return ascending continuation with ids when iterating collection
  fork: (engine, continuation, item) ->
    return @delimit(continuation + engine.identify(item), @ASCEND)


  # Return alternative operation to process
  jump: ->

  # Do something with arguments
  #execute: ->

  # Retrieve cached result
  retrieve: ->

  # Map to reorder arguments, 640 should be enough for everybody
  permutation: [0 ... 640]

  # Add this nubmer of undefineds at the end of argument list
  padding: 0

  # Number of extra arguments (max 6: engine, operation, continuation, scope, ascender, ascending)
  # Computed automatically for each command by checking `.length` of `@execute` callback
  extras: undefined

  # Serialize operation with infix syntax (useful for constraints) 
  toExpression: (operation) ->
    switch typeof operation
      when 'object'
        if operation[0] == 'get'
          if operation.length == 2
            return operation[1]
          else
            return operation[1].command.path + '[' + operation[2] + ']'
        str = @toExpression(operation[1] ? '') + operation[0] + @toExpression(operation[2] ? '')
        return str
      else
        return operation

  # Forget command  
  sanitize: (engine, operation, ascend, replacement) ->

    # Clean sub-expressions with the same domain
    unless ascend == false
      for argument in operation
        unless ascend == argument
          if argument.push && argument?.domain == engine
            if argument[0] == 'get'
              return ascend
            @sanitize(engine, argument, false, replacement)

    operation.domain = operation.command = undefined

    if replacement
      operation.domain = replacement
      replacement.Command(operation)

    unless ascend == false
      if (parent = operation.parent) && parent.domain == engine && !parent.command.boundaries
        return @sanitize(engine, parent, operation, replacement)

    return operation

# ### Delimeters

# **↑ Referencing**, e.g. to jump to results of dom query,
# or to figure out which element in that collection 
# called this function
  ASCEND: String.fromCharCode(8593)

# **→ Linking**, to pair up elements in arguments
  PAIR: String.fromCharCode(8594)

# **↓ Nesting**, as a way for expressions to own side effects,
# e.g. to remove stylesheet, css rule or conditional branch
  DESCEND: String.fromCharCode(8595)

  DELIMITERS: [8593, 8594, 8595]
  

  # Update delimeter at the end of the path
  delimit: (path, delimeter = '') ->
    unless path
      return path
    if @DELIMITERS.indexOf(path.charCodeAt(path.length - 1)) > -1
      return path.substring(0, path.length - 1) + delimeter
    else
      return path + delimeter


  # Return topmost known command
  getRoot: (operation) ->
    while operation.command.type != 'Default'
      operation = operation.parent
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
    Kommand.prototype.definition = Kommand
    
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
  
  # Unset domain and variable references from sub-tree
  @orphanize: (operation) ->
    if operation.domain
      operation.domain = undefined
    if operation.variables
      operation.variables = undefined
    for arg in operation
      if arg?.push
        @orphanize arg
    operation

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
            @register(engine.signatures, property, value, Types)
            if engine.helps
              engine.engine[property] ||= @Helper(engine, property)
              if aliases = value.prototype.helpers
                for name in aliases
                  engine.engine[name] = engine.engine[property]
    @Types = Types
      
    @

  # Compile command as an external helper on engine prototype
  @Helper: (engine, name) ->
    signature = engine.signatures[name] 
    base = [name]
    engine.engine[name] ||= ->
      args = Array.prototype.slice.call(arguments)
      command = Command.match(engine, base.concat(args)).prototype
      length = (command.hasOwnProperty('permutation') && command.permutation.length || 0) + command.padding
      
      if length > args.length
        args.length = length

      if extras = command.extras ? command.execute.length 
        args.push(engine)
        if extras > 1
          args.push(args)
          if extras > 2         
            args.push('')
            if extras > 3
              args.push(engine.scope)

      if (result = command.execute.apply(command, args))?
        unless command.ascend == command.constructor.__super__.ascend
          command.ascend(engine, args, '', engine.scope, result)
        return result
  

  ### 

  Generate lookup structures to match methods by name and argument type signature

  Signature for `['==', ['get', 'a'], 10]` would be `engine.signatures['==']['Variable']['Number']`

  A matched signature returns customized class for an operation that can further 
  pick a sub-class dynamically. Signatures allows special case optimizations and 
  composition to be implemented structurally, instead of branching in runtime.

  Signatures are shared between commands. Dispatcher support css-style 
  typed optional argument groups, but has no support for keywords or repeating groups yet
  ###

  # Register signatures defined in a given object

  @sign: (command, object) ->
    if signed = command.signed
      return signed
    command.signed = storage = []
    if signature = object.signature
      @get command, storage, signature
    else if signature == false
      storage.push ['default']
    else if signatures = object.signatures
      for signature in signatures
        @get command, storage, signature
    return storage
        
  # Reorder keys within optional group
  @permute: (arg, permutation) ->
    keys = Object.keys(arg)
    return keys unless permutation
    values = Object.keys(arg)
    group = []
    
    # Put keys at their permuted places
    for position, index in permutation
      unless position == null
        group[position] = keys[index]
    
    # Fill blank spots with     
    for i in [permutation.length ... keys.length] by 1
      for j in [0 ... keys.length] by 1
        unless group[j]?
          group[j] = keys[i]
          break
          
    # Validate that there're no holes
    for arg in group
      if arg == undefined
        return
        
    return group

  # Return array of key names for current permutation
  @getPermutation: (args, properties) ->
    result = []
    for arg, index in args
      unless arg == null
        result[arg] = properties[index]
    for arg, index in result by -1
      unless arg?
        result.splice(index, 1)
    return result

  # Return array with positions for given argument signature
  @getPositions: (args) ->
    result = []
    for value, index in args
      if value?
        result[value] = index
    for arg, index in result by -1
      unless arg?
        result.splice(index, 1)
    return result

  # Return array of keys for a full list of arguments
  @getProperties: (signature) ->
    if properties = signature.properties
      return properties
    signature.properties = properties = []
    for arg in signature
      if arg.push
        for a in arg
          for property, definition of a
            properties.push(definition)
      else
        for property, definition of arg
          properties.push(definition)
    return properties

  # Generate a list of all type paths
  @generate: (combinations, positions, properties, combination, length) ->
    if combination
      i = combination.length
    else
      combination = []
      combinations.push(combination)
      i = 0

    while (props = properties[i]) == undefined && i < properties.length
      i++
    if i == properties.length
      combination.length = length
      combination.push positions
    else
      for type, j in properties[i]
        if j == 0
          combination.push(type)
        else
          position = combinations.indexOf(combination)
          combination = combination.slice(0, i)
          combination.push type
          combinations.push(combination)
        @generate combinations, positions, properties, combination, length
    return combinations

  # Create actual nested lookup tables for argument types
  # When multiple commands share same output node, 
  # they may register to choose type conditionally
  @write: (command, storage, combination)->
    for i in [0 ... combination.length]
      if (arg = combination[i]) == 'default'
        storage.Default = command
      else
        last = combination.length - 1
        if arg != undefined && i < last
          storage = storage[arg] ||= {}
        else
          variant = command.extend 
              permutation: combination[last], 
              padding: last - i
              definition: command

          if resolved = storage.resolved
            proto = resolved::
            if variant::condition
              unless proto.hasOwnProperty('advices')
                proto.advices = proto.advices?.slice() || []
                if proto.condition
                  proto.advices.push(resolved)
              proto.advices.push(variant)
            else
              if proto.condition
                variant::advices = proto.advices?.slice() || [resolved]
                storage.resolved = variant
          else
            storage.resolved = variant

    return

  # Write cached lookup tables into a given storage (register method by signature)
  @register: (signatures, property, command, types) ->
    storage = signatures[property] ||= {}

    for type, subcommand of types
      if proto = command.prototype
        # Command has a handler for this subtype
        if (execute = proto[type]) || 
            # Subtype explicitly subscribes to command type handler 
            ((kind = subcommand::kind) && 
              ((kind == 'auto') || 
                (execute = proto[kind])))
          Prototype = subcommand.extend()
          for own property, value of proto
            Prototype::[property] = value
          if typeof execute == 'object'
            for property, value of execute
              Prototype::[property] = value
          else if execute
            Prototype::execute = execute

            
          for combination in @sign(subcommand, Prototype.prototype)
            @write Prototype, storage, combination

    for combination in @sign(command, command.prototype)
      @write command, storage, combination

    return
    
  # Generate a lookup structure to find method definition by argument signature
  @get: (command, storage, signature, args, permutation) ->

    args ||= []
    i = args.length
    
    # Find argument by index in definition
    `seeker: {`
    for arg in signature
      if arg.push
        for obj, k in arg
          j = 0
          group = arg
          for property of obj
            unless i
              arg = obj
              unless keys = @permute(arg,  permutation)
                return
              argument = arg[property]
              `break seeker`
            i--
            j++
      else
        j = undefined
        for property of arg
          unless i
            argument = arg[property]
            `break seeker`
          i--
    `}`
    
    # End of signature
    unless argument
      @generate(storage, @getPositions(args), @getPermutation(args, @getProperties(signature)), undefined, args.length)
      return
      
    # Permute optional argument within its group
    if keys && j?
      permutation ||= []
      
      for i in [0 ... keys.length] by 1
        if permutation.indexOf(i) == -1
          @get command, storage, signature, args.concat(args.length - j + i), permutation.concat(i)
  
      @get command, storage, signature, args.concat(null), permutation.concat(null)
      return
        
    # Register all input types for given arguments
    @get command, storage, signature, args.concat(args.length)


# A list of operations that doesnt return values
class Command.List extends Command
  type: 'List'
  
  constructor: ->
  extras: 0
  boundaries: true

  execute: ->

  log: ->

  # Capture results and do nothing with them to stop propagation
  yield: ->
    return true

  # Fast descender for lists - doesnt build evaluated list of arguments
  descend: (engine, operation, continuation, scope, ascender, ascending) ->
    for argument, index in operation
      if argument?.push
        argument.parent ||= operation
        if command = argument.command || engine.Command(argument)
          command.solve(engine, argument, continuation, scope)
    return


# An optional command for unmatched operation
class Command.Default extends Command
  type: 'Default'

  extras: 2

  execute: (args..., engine, operation) ->
    args.unshift operation[0]
    return args

  constructor: ->

# Command for objects called as functions
class Command.Object extends Command
  constructor: ->

# Command with a provided object
class Command.Meta extends Command
  type: 'Meta'

  signature: [
    body: ['Any']
  ],

  execute: (data)->
    return data

module.exports = Command

