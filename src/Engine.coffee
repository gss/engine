# Engine is a base class for scripting environments.
# It includes interpreter and reference tracker. 
# Acts as a faux-pipe that evaluates Expressions
# and outputs the results to submodules
# Engine is the GSS global variable

class Engine
  Expressions:
    require('./input/Expressions.js')
  References:
    require('./input/References.js')

  constructor: (scope) ->
    if scope && scope.nodeType
      # new GSS(node) assigns a new engine to node if it doesnt have one
      if @Expressions
        id = Engine.identify(scope)
        if engine = Engine[id]
          return engine

        if Document = Engine.Document
          unless this instanceof Document
            return new Document(scope)

        Engine[id] = @
        @scope = scope
      # GSS(node) finds nearest parent engine or makes one at root
      else
        while scope
          if id = Engine.recognize(scope)
            if engine = Engine[id]
              return engine
          break unless scope.parentNode
          scope = scope.parentNode

    # new GSS() creates a new engine
    if @Expressions
      @context     = new @Context(@)
      @expressions = new @Expressions(@)
      @references  = new @References(@)
      @events      = {}
      @values      = {}
      return

    # GSS.Document() and GSS() create new GSS.Document
    return new (Engine.Document || Engine)(scope)

  # Delegate: Pass input to interpreter
  read: ->
    return @expressions.read.apply(@expressions, arguments)

  # Hook: Pass output to a subscriber
  write: ->
    return @output.read.apply(@output, arguments)

  # Hook: Should interpreter iterate returned object?
  isCollection: (object) ->
    # (yes, if it's a collection of objects or empty array)
    if object && object.length != undefined && !object.substring && !object.nodeType
      switch typeof object[0]
        when "object"
          return true
        when "undefined"
          return object.length == 0

  once: (type, fn) ->
    fn.once = true
    @addEventListener(type, fn)

  addEventListener: (type, fn) ->
    (@events[type] ||= []).push(fn)

  removeEventListener: (type, fn) ->
    if group = @events && @events[type]
      if index = group.indexOf(fn) > -1
        group.splice(index, 1)

  triggerEvent: (type, a, b, c) ->
    if group = @events[type]
      for fn, index in group by -1
        group.splice(index, 1) if fn.once
        fn.call(@, a, b, c)
    if @[method = 'on' + type]
      return @[method](a, b, c)

  # Catch-all event listener 
  handleEvent: (e) ->
    @triggerEvent(e.type, e)

  # Store solutions
  merge: (object) ->
    for prop, value of object
      if value?
        @values[prop] = value
      else
        delete @values[prop]

  # Combine mixins
  @include = ->
    Context = (@engine) ->
    for mixin in arguments
      for name, fn of mixin::
        Context::[name] = fn
    return Context

  # Set up delegates for setting and getting uids
  @recognize: Engine::References.recognize
  recognize:  Engine::References.recognize

  @identify:  Engine::References.identify
  identify:   Engine::References.identify

window.GSS = Engine

module.exports = Engine