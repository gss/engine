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

  constructor: (scope, url) ->
    if scope && scope.nodeType
      # new GSS(node) assigns a new Engine.Document to node if it doesnt have one
      if @Expressions
        id = Engine.identify(scope)
        #if engine = Engine[id]
        #  return engine

        if Document = Engine.Document
          unless this instanceof Document
            return new Document(scope, url)

        Engine[id] = @
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
      @events      = {}
      @values      = {}
      return

    # GSS.Document() and GSS() create new GSS.Document on root initially
    return new (Engine.Document || Engine)(scope, url)

  # Delegate: Pass input to interpreter
  run: ->
    return @expressions.pull.apply(@expressions, arguments)

  pull: ->
    return @expressions.pull.apply(@expressions, arguments)

  # Schedule execution of expressions to the next tick, buffer input
  defer: ->
    unless @deferred?
      @expressions.buffer ||= null
      @deferred = setImmediate @expressions.flush.bind(@expressions)
    return @run.apply(@, arguments)

  # Hook: Pass output to a subscriber
  push: (data) ->
    # Unreference removed elements
    if @removed
      for id in @removed
        delete @engine.elements[id]
      @removed = undefined
    # Store solutions
    @merge data
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
          return !object[0].push
        when "undefined"
          return object.length == 0

  # Store solutions
  merge: (object) ->
    for prop, value of object
      old = @values[prop]
      continue if old == value
      if @_onChange
        @_onChange prop, value, old
      if value?
        @values[prop] = value
      else
        delete @values[prop]
    @

  # Destroy engine
  destroy: ->
    if @scope
      Engine[@scope._gss_id] = undefined

  # Return concatenated path for a given object and prefix
  getPath: (path, value) ->
    return value if typeof value == 'string'
    return path + Engine.identify(value)

  # Get object by id
  @get: (id) ->
    return Engine::elements[id]

  # Get object by id
  get: (id) ->
    return @elements[id]

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
    unless @running
      for property, command of @commands
        command.reference = '_' + property
        @[command.reference] = Engine.Command(command, command.reference)
      @running = true

  # Make non-function commands helpers with original command properties
  @Command: (command, reference) ->
    unless typeof command == 'function'
      helper = Engine.Helper(command)
      for property, value of command
        helper[property] = value
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

      return fn.apply(context || @, args)


this.GSS = Engine

module.exports = Engine