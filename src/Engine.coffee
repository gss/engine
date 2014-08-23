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
  Domains: 
    Document:  require('./domains/Document')
    Intrinsic: require('./domains/Intrinsic')
    Numeric:   require('./domains/Numeric')
    Linear:    require('./domains/Linear')
    Finite:    require('./domains/Finite')
    Boolean:   require('./domains/Boolean')

  constructor: (scope, url) ->
    for argument, index in arguments
      continue unless argument
      switch typeof argument
        when 'object'
          if argument.nodeType
            if @Expressions
              Engine[Engine.identity.provide(scope)] = @
              @scope = scope
            else
              while scope
                if id = Engine.identity.find(scope)
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
    # right before first commands are executed
    super(@, url)
    @domain      = @
    @properties  = new @Properties(@)
    @methods     = new @Methods(@)
    @expressions = new @Expressions(@)

    @precompile()

    @assumed = new @Numeric(assumed)
    @assumed.displayName = 'Assumed'
    @assumed.setup()

    @solved = new @Boolean
    @solved.displayName = 'Solved'
    @solved.setup()

    @values = @solved.values


    unless window?
      @strategy = 'substitute'
    else
      @strategy =  'document'

    return @

  events:
    # Receieve message from worker
    message: (e) ->
      values = e.target.values ||= {}
      for property, value of e.data
        values[property] = value
      @provide e.data

    # Handle error from worker
    error: (e) ->
      throw new Error "#{e.message} (#{e.filename}:#{e.lineno})"

    destroy: (e) ->
      Engine[@scope._gss_id] = undefined

  # Import exported variables to thread
  substitute: (expressions, result, parent, index) ->
    if result == undefined
      start = true
      result = null
    for expression, i in expressions by -1
      if expression?.push
        result = @substitute(expression, result, expressions, i)
    if expressions[0] == 'value'
      # Substituted part of expression
      if expressions[4]
        exp = parent[index] = expressions[3].split(',')
        path = @getPath(exp[1], exp[2])
      # Updates for substituted variables
      else if !expressions[3]
        path = expressions[2]
        parent.splice(index, 1)
      if path && @assumed[path] != expressions[1]
        (result ||= {})[path] = expressions[1]
    unless start
      if !expressions.length
        parent.splice(index, 1)
      return result
    if result
      @assumed.merge result
    @inputs = result
    console.log('inputs')
    console.info(JSON.stringify(result))
    if expressions.length
      @provide expressions

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

    problematic = undefined
    for arg, index in args
      if arg && typeof arg != 'string'
        if problematic
          if typeof arg == 'function'
            @then arg
            args.splice index, 1
            break
        else
          problematic = arg

    if typeof args[0] == 'object'
      if name = source || @displayName
        @console.start(reason || args[0], name)
    unless old = @workflow
      @engine.workflow = new @Workflow

    if @providing == undefined
      @providing = null
      providing = true
    if typeof args[0] == 'function'
      solution = args.shift().apply(@, args) 
    else
      solution = Domain::solve.apply(@, args)
    if !solution? && providing
      while provided = @providing
        @providing = null
        if args[0]?.index
          provided.index ?= args[0].index
          provided.parent ?= args[0].parent
        @Workflow(provided)
    if providing
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

      if @engine == @
        return @onSolve(solution, workflow)

  onSolve: (solution, workflow = @workflow, result) ->
    # Apply styles
    if solution
      @applier?.solve(solution)
    else if @workflow.reflown
      @intrinsic?.each(@workflow.reflown || @scope, @intrinsic.update)

    @queries?.onBeforeSolve()

    @solved.merge solution
    

    @console.info('Solution\t   ', solution, JSON.stringify(solution), @solved.values)

    updated = {}
    updated = workflow.each(@resolve, @, updated)
    if Object.keys(updated).length
      return @onSolve(updated, workflow, solution)

    if result
      for property, value of updated
        solution[property] = value

    if (!solution || workflow.problems[@workflow.index + 1]) &&
        (workflow.problems.length != 1 || workflow.domains[0] != null)
      return 
    @engine.workflown = workflow
    @engine.workflow = undefined
    

    @console.info('Solution\t   ', solution, JSON.stringify(solution), @solved.values)

    # Trigger events on engine and scope node
    @triggerEvent('solve', solution, workflow)
    if @scope
      @dispatchEvent(@scope, 'solve', solution, workflow)

    return solution

  # Accept solution from a solver and resolve it to verify
  provide: (solution) ->
    if solution.operation
      return @engine.workflow.provide solution
    if !solution.push
      return @onSolve(solution)
    if @providing != undefined
      unless @hasOwnProperty('providing')
        @engine.providing ||= []
      (@providing ||= []).push(Array.prototype.slice.call(arguments, 0))
      return
    else
      return @Workflow.apply(@, arguments)

  resolve: (domain, problems, index, workflow) ->
    if domain && !domain.solve && domain.postMessage
      return domain.postMessage(@clone problems)
    for problem, index in problems
      if problem instanceof Array && problem.length == 1 && problem[0] instanceof Array
        problem = problems[index] = problem[0]
    if problems instanceof Array && problems.length == 1 && problem instanceof Array
      problems = problem

    if domain
      @providing = null
      @console.start(problems, domain.displayName)
      result = domain.solve(problems) || @providing || undefined
      if @providing && @providing != result
        workflow.merge(@Workflow(@frame || true, @providing))
        workflow.optimize()

      @providing = undefined
      @console.end()
      if result?.length == 1
        result = result[0]

    # Broadcast operations without specific domain (e.g. remove)
    else
      others = []
      removes = []
      if problems[0] == 'remove'
        removes.push problems
      else
        for problem in problems
          if problem[0] == 'remove'
            removes.push(problem)
          else
            others.push(problem)
      for other in @domains
        locals = []
        for remove in removes
          for path, index in remove
            continue if index == 0
            if other.paths[path]
              locals.push(path)
        if locals.length
          locals.unshift 'remove'
          workflow.merge([locals], other, true)
        if others.length
          workflow.merge(others, other)
      for url, worker of @workers
        workflow.merge problems, worker
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
    return (Engine::workers ||= {})[url] ||= new Worker(url)

  # Compile initial domains and shared engine features 
  precompile: ->
    if @constructor::running == undefined
      for property, method of @Methods::
        @constructor::[property] ||= 
        @constructor[property] ||= Engine::Method(method, property)
      @constructor::compile()
    @Domain.compile(@Domains,   @)
    for name, domain of @Domains
      if domain::helps
        for property, method of domain::Methods::
          @constructor::[property] ||= 
          @constructor[property] ||= Engine::Method(method, property, name.toLowerCase())
    @Workflow = Engine::Workflow.compile(@)
    @intrinsic?.queries.connect()

  # Comile user provided features specific to this engine
  compile: (state) ->
    methods    = @methods    || @Methods  ::
    properties = @properties || @Properties::
    @Method  .compile(methods,    @)
    @Property.compile(properties, @)

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
    engine = Engine.messenger ||= Engine()
    assumed = engine.assumed.toObject()
    solution = engine.solve(e.data)
    for property, value of engine.inputs
      if value? || !solution[property]?
        solution[property] = value
    console.error(engine.domains.map (d) ->
      [d.constraints?.length, d.substituted?.length])
    postMessage(solution)

module.exports = @GSS = Engine