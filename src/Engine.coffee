# Engine is a base class for scripting environments.
# It includes interpreter that can be used with provided functions
# Acts as a faux-pipe that evaluates Expressions
# routes it through submodules to solve equasions and set styles
# Engine is the GSS global variable


# Little shim for require.js so we dont have to carry it around
this.require ||= (string) ->
  bits = string.replace('.js', '').split('/')
  if string == 'cassowary'
    return c
  return this[bits[bits.length - 1]]


class Engine

  Expressions:
    require('./input/Expressions.js')
  Values:
    require('./input/Values.js')

  constructor: (scope, url) ->
    if scope && scope.nodeType
      # new GSS(node) assigns a new Engine.Document to node if it doesnt have one
      if @Expressions
        if Document = Engine.Document
          unless this instanceof Document
            return new Document(scope, url)

        Engine[Engine.identify(scope)] = @
        @scope = scope
        @all = scope.getElementsByTagName('*')
      # GSS(node) finds nearest parent engine or makes one at root
      else
        while scope
          if id = Engine.recognize(scope)
            if engine = Engine[id]
              return engine
          break unless scope.parentNode
          scope = scope.parentNode

    # new GSS() creates a new Engine.Solver
    if !scope || typeof scope == 'string'
      if Engine.Solver && !(this instanceof Engine.Solver)
        return new Engine.Solver(undefined, undefined, scope)

    if @Expressions
      @properties  = new @Properties(@)  if @Properties
      @commands    = new @Commands(@)    if @Commands
      @expressions = new @Expressions(@)
      @values      = new @Values(@)
      @events      = {}
      return

    # GSS.Document() and GSS() create new GSS.Document on root initially
    return new (Engine.Document || Engine)(scope, url)

  # Delegate: Pass input to interpreter
  run: ->
    return @expressions.pull.apply(@expressions, arguments)

  pull: ->
    return @expressions.pull.apply(@expressions, arguments)

  do: ->
    return @expressions.do.apply(@expressions, arguments)

  # Schedule execution of expressions to the next tick, buffer input
  defer: ->
    unless @deferred?
      @expressions.buffer ||= null
      @deferred = (window.setImmediate || window.setTimeout)(@expressions.flush.bind(@expressions), 0)
    return @run.apply(@, arguments)

  # Hook: Pass output to a subscriber
  push: (data) ->
    # Unreference removed elements
    if @removed
      for id in @removed
        delete @engine.elements[id]
      @removed = undefined
    # Store solutions
    @values.merge data
    # Trigger events on engine and scope node
    @triggerEvent('solved', data)
    @dispatchEvent(@scope, 'solved', data) if @scope
    # Proceed
    return @output.pull.apply(@output, arguments) if @output

  # Hook: Should interpreter iterate returned object?
  isCollection: (object) ->
    # (yes, if it's a collection of objects or empty array)
    if object && object.length != undefined && !object.substring && !object.nodeType
      switch typeof object[0]
        when "object"
          return object[0].nodeType
        when "undefined"
          return object.length == 0

  # Destroy engine
  destroy: ->
    if @scope
      Engine[@scope._gss_id] = undefined

  # Return concatenated path for a given object and prefix
  getContinuation: (path, value, suffix = '') ->
    if path
      path = path.replace(/[→↓↑]$/, '')
    #return path unless value?
    return value if typeof value == 'string'
    return path + (value && Engine.identify(value) || '') + suffix


  # Check if selector is bound to current scope's element
  getContext: (args, operation, scope, node) ->
    index = args[0].def && 4 || 0
    if (args.length != index && (args[index]?.nodeType))
      return args[index]
    if !operation.bound
      return @scope
    return scope;
    

  # Execution has forked (found many elements, trying brute force to complete selector)
  @UP:    '↑'
  # One selector was resolved, expecting another selector to pair up
  @RIGHT: '→'
  # Execution goes depth first (inside stylesheet or css rule)
  @DOWN:  '↓'

  # When cleaning a path, also clean forks, rules and pairs
  getPossibleContinuations: (path) ->
    [path, path + Engine.UP, path + Engine.RIGHT, path + Engine.DOWN]

  getPath: (id, property) ->
    unless property
      property = id
      id = undefined
    if property.indexOf('[') > -1 || !id
      return property
    else
      return id + '[' + property + ']'

  # Get or generate uid for a given object.
  @identify: (object, generate) ->
    unless id = object._gss_id
      if object == document
        object = window
      unless generate == false
        object._gss_id = id = "$" + (object.id || ++Engine.uid)
      Engine::elements[id] = object
    return id

  # Get id if given object has one
  @recognize: (object) ->
    return Engine.identify(object, false)

  identify: (object) ->
    return Engine.identify(object)

  recognize: (object) ->
    return Engine.identify(object, false)

  @uid: 0
  elements: {}
  engines: {}

  # Simple EventTrigger that fires @on<event>
  once: (type, fn) ->
    fn.once = true
    @addEventListener(type, fn)

  addEventListener: (type, fn) ->
    (@events[type] ||= []).push(fn)

  removeEventListener: (type, fn) ->
    if group = @events && @events[type]
      if (index = group.indexOf(fn)) > -1
        group.splice(index, 1)

  triggerEvent: (type, a, b, c) ->
    if group = @events[type]
      for fn, index in group by -1
        group.splice(index, 1) if fn.once
        fn.call(@, a, b, c)
    if @[method = 'on' + type]
      return @[method](a, b, c)

  dispatchEvent: (element, type, detail, bubbles, cancelable) ->
    return unless @scope
    (detail ||= {}).engine = @
    element.dispatchEvent new CustomEvent(type, {detail,bubbles,cancelable})

  @clone: (object) -> 
    if object && object.map
      return object.map @clone, @
    return object

  # Combine mixins
  @include = ->
    Context = (@engine) ->
    for mixin in arguments
      for name, fn of mixin::
        Context::[name] = fn
    return Context

  # Catch-all event listener 
  handleEvent: (e) ->
    @triggerEvent(e.type, e)

  # Export all commands as underscored functions into engine
  # This ensures commands are called in engine context
  # Doing so on first run allows commands to be set after init
  start: ->
    return if @running
    for key, command of @commands
      continue if command == @
      command.reference = '_' + key
      @[command.reference] = Engine.Command(command, command.reference)

    for key, property of @properties
      continue if property == @
      Engine.Property(property, key, @properties)
    @running = true

  @Property: (property, reference, properties) ->
    if typeof property == 'object'
      for key, value of property
        if property == 'shortcut'

        else
          if reference.match(/^[a-z]/i)
            path = reference + '-' + key
          else
            path = reference + key

          properties[path] = Engine.Property(value, path, properties)
    return property

  # Helperize non-callable commands, keep original command properties
  @Command: (command, reference) ->
    unless typeof command == 'function'
      helper = Engine.Helper(command)
      for key, value of command
        helper[key] = value
      command = helper
    command.reference = reference
    return command

  # Export given commands as self-contained functions to be used as helpers 
  @Helper: (command, scoped)  ->
    if typeof command == 'function'
      func = command
    return (scope) ->
      args = Array.prototype.slice.call(arguments, 0)
      length = arguments.length
      if scoped || command.serialized
        unless scope && scope.nodeType
          scope = @scope || document
          if typeof command[args.length] == 'string'
            context = scope
          else
            args.unshift(scope)
        else
          if typeof command[args.length - 1] == 'string'
            context = scope = args.shift()

      unless fn = func
        if typeof (method = command[args.length]) == 'function'
          fn = method
        else
          unless method && (fn = scope[method])
            if fn = @commands[method]
              context = @
            else
              fn = command.command
              args = [null, args[2], null, null, args[0], args[1]]

      return fn.apply(context || @, args)

  @time: (other) ->
    time = performance?.now() || Date.now?() || + (new Date)
    return time unless other
    return Math.floor((time - other) * 100) / 100


this.GSS = Engine

module.exports = Engine