# Engine is a base class for scripting environments.
# It includes interpreter that can be used with provided functions
# Acts as a faux-pipe that evaluates Expressions
# routes it through submodules to solve equasions and set styles
# Engine is the GSS global variable

# Combine mixins
include = ->
  Context = (@engine) ->
  for mixin in arguments
    for name, fn of mixin::
      Context::[name] = fn
  return Context

EventTrigger = require('./concepts/EventTrigger')
Buffer       = require('./concepts/Buffer')

class Engine extends include(EventTrigger, Buffer)

  Expressions:
    require('./input/Expressions')
  Values:
    require('./input/Values')

  Commands:
    require('./commands/Conventions')

  Property:
    require('./concepts/Property')
  Command:
    require('./concepts/Command')
  Helper:
    require('./concepts/Helper')
  Console:
    require('./concepts/Console')

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
      @values      = @vars = new @Values(@)
      @events      = {}
      @input       = @expressions
      @engine      = @
      return

    # GSS.Document() and GSS() create new GSS.Document on root initially
    return new (Engine.Document || Engine)(scope, url)

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
    return super

  # Destroy engine
  destroy: ->
    if @scope
      Engine[@scope._gss_id] = undefined

  # Get or generate uid for a given object.
  @identify: (object, generate) ->
    unless id = object._gss_id
      if object == document
        id = "::document"
      else if object == window
        id = "::window"

      unless generate == false
        object._gss_id = id ||= "$" + (object.id || ++Engine.uid)
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

  # Export all commands as underscored functions into engine
  # This ensures commands are called in engine context
  # Doing so on first run allows commands to be set after init
  # Built in commands are compiled on the prototype
  start: ->
    return if @running
    if @constructor::running == undefined
      @constructor::running = null
      @constructor::compile()
    @compile()
    return @running = true

  # Make helpers, styles and properties callable
  compile: ->
    commands = (@commands || @Commands::)
    commands.engine ||= @
    for key, command of commands
      continue if command == @ || !commands.hasOwnProperty(key)
      if key.charAt(0) != '_'
        subkey = '_' + key
        command = @Command(command, subkey)
        @[subkey] ?= command

      @[key] ?= command

    properties = (@properties || @Properties::)
    properties.engine ||= @
    for key, property of properties
      continue if property == @ || !properties.hasOwnProperty(key)
      prop = @Property(property, key, properties)
      @['_' + key] ?= prop

    for key, property of properties
      @['_' + key] ?= property
    @

  console: @console = new Engine::Console
  time:    @time    = Engine::Console.time

  # Recursively slice arrays
  clone:   @clone   = (object) -> 
    if object && object.map
      return object.map @clone, @
    return object

  @include: include

@GSS = Engine

module.exports = Engine