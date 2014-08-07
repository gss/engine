### Base class: Engine

Engine is a base class for scripting environments.
It initializes and orchestrates all moving parts.

It includes interpreter that operates in defined constraint domains.
Each domain has its own command set, that extends engine defaults. ###

Native          = require('./methods/Native')
Events          = require('./concepts/Events')
Domain          = require('./concepts/Domain')
Domain.Events ||= Native::mixin(Domain, Events)

class Engine extends Domain.Events

  Identity:    require('./modules/Identity')
  Expressions: require('./modules/Expressions')

  Method:      require('./concepts/Method')
  Property:    require('./concepts/Property')
  Console:     require('./concepts/Console')
  Workflow:    require('./concepts/Workflow')
  
  Properties:  require('./properties/Axioms')

  Methods:     Native::mixin new Native,
               require('./methods/Conventions')
               require('./methods/Algebra')
               require('./methods/Variables')
  Domains: 
    Document:  require('./domains/Document')
    Intrinsic: require('./domains/Intrinsic')
    Numeric:   require('./domains/Numeric')
    Linear:    require('./domains/Linear')
    Finite:    require('./domains/Finite')

  constructor: (scope, url) ->
    for argument, index in arguments
      continue unless argument
      switch typeof argument
        when 'object'
          if argument.nodeType
            if @Expressions
              Engine[Engine.identity.provide(scope)] = @
              @scope = scope
              @all = scope.getElementsByTagName('*')
            else
              while scope
                if id = Engine.identity.solve(scope)
                  if engine = Engine[id]
                    return engine
                break unless scope.parentNode
                scope = scope.parentNode
          else
            assumed = argument
        when 'string', 'boolean'
          url = argument

    # **GSS()** creates new Engine at the root, 
    # if there is no engine assigned to it yet
    unless @Expressions
      return new Engine(scope, url)

    # Create instance own objects and context objects.
    # Context objects are contain non-callable 
    # definitions of commands and properties.
    # Definitions are compiled into functions 
    # once engine is started
    super(@, url)
    @domain      = @
    @properties  = new @Properties(@)
    @methods     = new @Methods(@)
    @expressions = new @Expressions(@)

    @precompile()

    @assumed     = new @Numeric(assumed)
    @strategy  =  window? && 'document' || 'linear'

    return @

  events:
    # Receieve message from worker
    message: (e) ->
      @provide e.data

    # Handle error from worker
    error: (e) ->
      throw new Error "#{e.message} (#{e.filename}:#{e.lineno})"

    destroy: (e) ->
      Engine[@scope._gss_id] = undefined

  solve: () ->
    if typeof arguments[0] == 'string'
      if typeof arguments[1] == 'string'
        source = arguments[0]
        reason = arguments[1]
        index = 2
      else
        reason = arguments[0]
        index = 1

    args = Array.prototype.slice.call(arguments, index || 0)

    unless @running
      @compile(true)

    if typeof args[0] == 'object'
      if name = source || @displayName
        @console.start(reason || args[0], name)
    unless old = @workflow
      @engine.workflow = new @Workflow

    if typeof args[0] == 'function'
      solution = args.shift().apply(@, args) 
    else
      @providing = null
      unless solution = Domain::solve.apply(@, args)
        while provided = @providing
          i = 0
          @providing = null
          provided.index ?= args[0].index
          provided.parent ?= args[0].parent
          solution = @Workflow(provided)
      @providing = undefined

    if name
      @console.end(reason)


    workflow = @workflow
    if workflow.domains.length
      if old
        if old != workflow
          old.merge(workflow)
      else
        solution = workflow.each @resolve, @
    @engine.workflow = old

    if !solution || @engine != @
      return solution

    if @applier && !@applier.solve(solution)
      return

    @console.info('Solution\t   ', solution)

    # Trigger events on engine and scope node
    @triggerEvent('solve', solution)
    if @scope
      @dispatchEvent(@scope, 'solve', solution)

    return solution

  # Accept solution from a solver and resolve it to verify
  provide: (solution) ->
    if solution.operation
      return @engine.workflow.provide solution
    if !solution.push
      return @merge(solution)
    if @providing != undefined
      unless @hasOwnProperty('providing')
        @engine.providing ||= []
      (@providing ||= []).push(Array.prototype.slice.call(arguments, 0))
      return
    else
      return @Workflow.apply(@, arguments)

  resolve: (domain, problems, index) ->
    for problem, index in problems
      if problem instanceof Array && problem.length == 1 && problem[0] instanceof Array
        problem = problems[index] = problem[0]
    if problems instanceof Array && problems.length == 1 && problems[0] instanceof Array
      problems = problem

    @console.start(problems, domain.displayName)
    @providing = null
    result = domain.solve(problems) || @providing || undefined
    @providing = undefined
    @console.end()
    if result?.length == 1
      result = result[0]
    return result

  # Initialize new worker and subscribe engine to its events
  useWorker: (url) ->
    return unless typeof url == 'string' && self.onmessage != undefined
    @worker = new @getWorker(url)
    @worker.addEventListener 'message', @eventHandler
    @worker.addEventListener 'error', @eventHandler
    @solve = (commands) =>
      @worker.postMessage(@clone(commands))

      return

  getWorker: (url) ->
    return (Engine.workers ||= {})[url] ||= new Worker url

  # Compile initial domains and shared engine features 
  precompile: ->
    if @constructor::running == undefined
      for property, method of @Methods::
        @constructor::[property] ||= 
        @constructor[property] ||= Engine::Method(method, true, property)
      @constructor::compile()
    @Domain.compile(@Domains,   @)

  # Comile user provided features specific to this engine
  compile: (state) ->
    methods    = @methods    || @Methods  ::
    properties = @properties || @Properties::
    @Method  .compile(methods,    @)
    @Property.compile(properties, @)
    @Domain  .compile(@Domains,   @) if @running

    @running = state ? null
    
    @triggerEvent('compile', @)

# Identity and console modules are shared between engines
Engine.identity = Engine::identity = new Engine::Identity
Engine.console  = Engine::console  = new Engine::Console

Engine.Engine   = Engine
Engine.Domain   = Engine::Domain   = Domain
Engine.mixin    = Engine::mixin    = Native::mixin
Engine.time     = Engine::time     = Native::time
Engine.clone    = Engine::clone    = Native::clone

# Listen for message in worker to initialize engine on demand
if !self.window && self.onmessage != undefined
  self.addEventListener 'message', (e) ->
    postMessage (self.engine ||= Engine()).solve(e.data)

module.exports = @GSS = Engine