# Engine is a base class for scripting environments.
# It includes interpreter and reference tracker. 
# Acts as a faux-pipe that evaluates Expressions
# and outputs the results to submodules
# Engine is the GSS global variable

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
      @context     = new @Context(@)
      @expressions = new @Expressions(@)
      @events      = {}
      @values      = {}
      return

    # GSS.Document() and GSS() create new GSS.Document
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
    @merge data
    @triggerEvent('solved', data)
    @dispatchEvent(@scope, 'solved', data)
    if @output
      return @output.pull.apply(@output, arguments)

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
      if @context.onChange
        @context.onChange prop, value, old
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
    return Engine::[id]

  # Get object by id
  get: (id) ->
    return @[id]

  # Get or generate uid for a given object.
  @identify: (object, generate) ->
    unless id = object._gss_id
      if object == document
        object = window
      unless generate == false
        object._gss_id = id = "$" + (object.id || ++Engine.uid)
      Engine::[id] = object
    return id

  # Get id if given object has one
  @recognize: (object) ->
    return Engine.identify(object, false)

  identify: (object) ->
    return Engine.identify(object)

  recognize: (object) ->
    return Engine.identify(object, false)

  @uid: 0

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

  
this.GSS = Engine

module.exports = Engine