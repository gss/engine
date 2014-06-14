# Engine is a base class for scripting environments.
# It includes interpreter and reference tracker. 
# Acts as a faux-pipe that evaluates Expressions
# and outputs the results to submodules

class Engine
  Expressions:
    require('./input/Expressions.js')
  References:
    require('./input/References.js')

  constructor: (scope) ->
    # GSS(node) finds parent nearest engine or makes one on root
    if scope && scope.nodeType
      unless @Expressions
        while scope
          if id = Engine.identify(scope)
            if engine = Engine[id]
              return engine
          break unless scope.parentNode
          scope = scope.parentNode
        return new (Engine.Document || Engine)(scope)

      # new GSS(node) assigns engine to node if it doesnt have one
      id = Engine::References.acquire(scope)
      if engine = Engine[id]
        return engine

      Engine[id] = @
      @scope   = scope

    # Create a new engine
    if @Expressions
      @context     = new @Context(@)
      @expressions = new @Expressions(@)
      @references  = new @References(@)
      @events      = {}
      return
    else
      return new arguments.callee(scope)

  # Delegate: Pass input to interpreter
  read: ->
    return @expressions.read.apply(@expressions, arguments)

  # Hook: Pass output to a subscriber
  write: ->
    return @output.read.apply(@output, arguments)

  # Hook: Should interpreter iterate given object?
  isCollection: (object) ->
    if typeof object == 'object' && object.length != undefined
      unless typeof object[0] == 'string' && !@context[object[0]]
        return true

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
      index = 0
      while fn = group[index]
        fn.call(@, a, b, c)
        if fn.once
          group.splice(index, 1)
        else
          index++
    method = 'on' + type
    if method in @
      return @[method](a, b, c)

  handleEvent: (e) ->
    @triggerEvent(e.type, e)

  @include = ->
    Context = (@engine) ->
    for mixin in arguments
      for name, fn of mixin::
        Context::[name] = fn
    return Context

  @identify: Engine::References.identify

self.GSS = Engine

module.exports = Engine