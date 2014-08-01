### Base class: Engine

Engine is a base class for scripting environments.
It initializes and orchestrates all moving parts.

It includes interpreter that operates in defined constraint domains.
Each domain has its own command set, that extends engine defaults. ###

Events          = require('./concepts/Events')
Domain          = require('./concepts/Domain')
Native          = require('./methods/Native')
Domain.Events ||= Native::mixin(Domain, Events)

class Engine extends Domain.Events

  Identity:    require('./modules/Identity')
  Expressions: require('./modules/Expressions')

  Method:      require('./concepts/Method')
  Property:    require('./concepts/Property')
  Console:     require('./concepts/Console')
  
  Properties:  require('./properties/Axioms')

  Methods:     Native::mixin new Native,
               require('./methods/Conventions')
               require('./methods/Algebra')
  Domains: 
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
        when 'string'
          if @Expressions
            @url = url
          else
            url = url

    # **GSS()** creates new Engine at the root, 
    # if there is no engine assigned to it yet
    unless @Expressions
      return new Engine(scope, url)

    # Create instance own objects and context objects.
    # Context objects are contain non-callable 
    # definitions of commands and properties.
    # Definitions are compiled into functions 
    # once engine is started
    super()
    @engine      = @
    @domain      = @
    @properties  = new @Properties(@)
    @methods     = new @Methods(@)

    @precompile()

    @expressions = new @Expressions(@)
    @assumed     = new @Domain(@, assumed, 'Assumed')
    @solved      = new @Numeric(@)

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

  strategy: 'expressions'

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

    if args[0]?.push
      @console.start(reason || args[0], source || @displayName || 'Intrinsic')

    if typeof args[0] == 'function'
      solution = args.shift().apply(@, args)
    else
      @providing = null
      unless solution = Domain::solve.apply(@, args)
        if provided = @providing
          @providing = undefined
          solution = @provide provided
      @providing = undefined

    if args[0]?.push
      @console.end(reason)

    unless solution
      return

    if @applier && !@applier.solve(solution)
      return

    @console.info('Solution\t   ', solution)

    # Trigger events on engine and scope node
    @triggerEvent('solve', solution)
    if @scope
      @dispatchEvent(@scope, 'solve', solution)

    return solution

  # Verify solutions
  # Finds final domain of given expression
  provide: (solution, recursive) ->
    if @providing != undefined
      (@providing ||= []).push(solution)
      return

    domains = undefined
    switch typeof solution
      when 'object'
        if solution.push
          for arg in solution
            if arg?.push
              provided = @engine.provide arg, true
              if domains
                for domain in provided
                  if domain != @ && domains.indexOf(domain) == -1
                    merged = undefined
                    if isFinite(domain.priority)
                      for d in domains
                        if merged = d.merge(domain)
                          domain = merged
                          break
                    domains.unshift(domain) unless merged
              else
                domains = provided
          host = solution[0] == 'get' && @Domain(solution) || solution.domain
          if host && host != @ && (!domains || domains.indexOf(host) == -1)
            domains ||= []
            for domain, index in domains
              if domain.priority <= host.priority
                break
            domains.splice(index, 0, host)
    if domains
      if !recursive
        console.error(domains)
        result = solution
        for domain in domains
          @console.start(result, domain.displayName)
          @providing = null
          result = domain.solve(result) || @providing
          @providing = undefined
          @console.end()
        return result

      return domains
    else if recursive
      return [@intrinsic]

    return solution

  # Initialize new worker and subscribe engine to its events
  useWorker: (url) ->
    return unless typeof url == 'string' && self.onmessage != undefined
    @worker = new @getWorker(url)
    @worker.addEventListener 'message', @onmessage.bind(this)
    @worker.addEventListener 'error',   @onerror  .bind(this)
    @solve = =>
      return @worker.postMessage.apply(@worker, arguments)
    return @worker

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
    Engine().solve(e.data)

module.exports = @GSS = Engine