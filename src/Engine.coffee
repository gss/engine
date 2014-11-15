### Base class: Engine

Engine is a base class for scripting environments.
It initializes and orchestrates all moving parts.

It includes interpreter that operates in multiple environments called domains.
Each domain has its own command set, that extends engine defaults.
Domains that set constraints only include constraints that refer shared variables
forming multiple unrelated dependency graphs. ###


# Little shim for require.js so we dont have to carry it around
@require ||= (string) ->
  if string == 'cassowary'
    return c
  bits = string.replace('', '').split('/')
  return this[bits[bits.length - 1]]
@module ||= {}

Domain = require ('./concepts/Domain')

class Engine extends Domain

  Command:      require('./concepts/Command')
  Property:     require('./concepts/Property')
  Update:       require('./concepts/Update')
    
  Operation:    require('./concepts/Operation')
  Continuation: require('./concepts/Continuation')

  Console:      require('./utilities/Console')
  Inspector:    require('./utilities/Inspector')
  Exporter:     require('./utilities/Exporter')
  
  Properties:   require('./properties/Axioms')
  
  Identity:     require('./modules/Identity')
  Signatures:   require('./modules/Signatures')

  Domains: 
    Abstract:   require('./domains/Abstract')
    Document:   require('./domains/Document')
    Intrinsic:  require('./domains/Intrinsic')
    Numeric:    require('./domains/Numeric')
    Linear:     require('./domains/Linear')
    Finite:     require('./domains/Finite')
    Boolean:    require('./domains/Boolean')


  constructor: () -> #(scope, url, data)
    for argument, index in arguments
      continue unless argument
      switch typeof argument
        when 'object'
          if argument.nodeType
            if @Command
              Engine[Engine.identity.yield(argument)] = @
              @scope = scope = argument
            else
              scope = argument
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
    unless @Command
      return new Engine(arguments[0], arguments[1], arguments[2])

    # Create instance own objects and context objects.
    # Context objects are contain non-callable 
    # definitions of commands and properties.
    # Definitions are compiled into functions 
    # right before first commands are executed
    super(@, url)
    
    @domains      = []
    @domain       = @
    @inspector    = new @Inspector(@)
    

    @precompile()
 
    @Operation    = new @Operation(@)
    @Continuation = @Continuation.new(@)

    # Constant and input values
    @assumed = new @Numeric(assumed)
    @assumed.displayName = 'Assumed'
    @assumed.setup()

    # Conditions and final values
    @solved = new @Boolean
    @solved.displayName = 'Solved'
    @solved.eager = true
    @solved.setup()

    # Alias engine.values from solved domain
    @values = @solved.values

    @variables   = {}
    @bypassers   = {}

    @strategy = 
      unless window?
        'substitute'
      else if @scope
        'document'
      else
        'abstract'

    return @

  events:
    # Receieve message from worker
    message: (e) ->
      values = e.target.values ||= {}
      for property, value of e.data
        values[property] = value
      if @updating
        if @updating.busy.length
          @updating.busy.splice(@updating.busy.indexOf(e.target.url), 1)
          if (i = @updating.solutions.indexOf(e.target)) > -1
            @updating.solutions[i] = e.data
          unless @updating.busy.length
            return @updating.each(@resolve, @, e.data) || @onSolve()
          else
            return @updating.apply(e.data)

      @yield e.data

    # Handle error from worker
    error: (e) ->
      throw new Error "#{e.message} (#{e.filename}:#{e.lineno})"

    destroy: (e) ->
      if @scope
        Engine[@scope._gss_id] = undefined
      if @worker
        @worker.removeEventListener 'message', @eventHandler
        @worker.removeEventListener 'error', @eventHandler

  # Import exported variables to thread
  substitute: (expressions, result, parent, index) ->
    if result == undefined
      start = true
      result = null
    for expression, i in expressions by -1
      if expression?.push
        result = @substitute(expression, result, expressions, i)
    if expressions[0] == 'remove'
      @updating.push expressions, null
      if parent
        parent.splice(index, 1)
    if expressions[0] == 'value'
      # Substituted part of expression
      if expressions[4]
        exp = parent[index] = expressions[3].split(',')
        path = @getPath(exp[1], exp[2])
      # Updates for substituted variables
      else if !expressions[3]
        path = expressions[2]
        if parent
          parent.splice(index, 1)
        else
          return []
      if path && @assumed.values[path] != expressions[1]
        unless (result ||= {}).hasOwnProperty(path)
          result[path] = expressions[1]
        else unless result[path]?
          delete result[path]
    unless start
      if !expressions.length
        parent.splice(index, 1)
      return result
    # Substitute variables next
    if result
      @assumed.merge result
    # Perform remove commands first
    if @updating
      @updating.each(@resolve, @, result)
    # Execute given expressions
    if expressions.length
      @yield expressions

  # engine.solve({}) - solve with given constants
  # engine.solve([]) - evaluate commands
  # engine.solve(function(){}) - buffer and solve changes of state within callback
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
    unless old = @updating
      @engine.updating = new @update
      @engine.updating.start ?= @engine.console.time()

    if @providing == undefined
      @providing = null
      providing = true
    if typeof args[0] == 'function'
      solution = args.shift().apply(@, args) 
    else
      solution = Domain::solve.apply(@, args)

    if solution
      @updating.apply(solution)

    @queries?.onBeforeSolve()
    @pairs?.onBeforeSolve()

    if providing
      while yieldd = @providing
        @providing = null
        @update(yieldd)
      @providing = undefined

    if name
      @console.end(reason)

    workflow = @updating
    if workflow.domains.length
      if old
        if old != workflow
          old.push(workflow)
      if !old || !workflow.busy?.length
        workflow.each @resolve, @
      if workflow.busy?.length
        return workflow

    onlyRemoving = (workflow.problems.length == 1 && workflow.domains[0] == null)
    restyled = onlyRemoving || (@restyled && !old && !workflow.problems.length)

    if @engine == @ && providing && (!workflow.problems[workflow.index + 1] || restyled) 
      return @onSolve(null, restyled)

  onSolve: (update, restyled) ->
    # Apply styles

    if solution = update || @updating.solution
      #if Object.keys(solution).length
      @applier?.solve(solution)
    else if !@updating.reflown && !restyled
      if !@updating.problems.length
        @updating = undefined
      return

    if @intrinsic# && (restyled || (solution && Object.keys(solution).length))
      @intrinsic.changes = {}
      scope = @updating.reflown || @scope
      @updating.reflown = undefined
      @intrinsic?.each(scope, @intrinsic.measure)
      @updating.apply @intrinsic.changes
      @intrinsic.changes = undefined

    @solved.merge solution

    @pairs?.onBeforeSolve()
    @updating.reset()

    # Launch another pass here if solutions caused effects
    # Effects are processed separately, then merged with found solution
    if effects = @updating.effects
      @updating.effects = undefined
    else
      effects = {}

    effects = @updating.each(@resolve, @, effects)
    if @updating.busy?.length
      return effects
      
    #return if @requesting

    if effects && Object.keys(effects).length
      return @onSolve(effects)

    # Fire up solved event if we've had remove commands that 
    # didnt cause any reactions
    if (!solution || (!solution.push && !Object.keys(solution).length) || @updating.problems[@updating.index + 1]) &&
        (@updating.problems.length != 1 || @updating.domains[0] != null) &&
        !@engine.restyled
      return 

    if !@updating.problems.length && @updated?.problems.length && !@engine.restyled
      @updating.finish()
      @restyled = undefined
      @updating = undefined
      return
    else
      @updated = @updating
      @updating.finish()
      @updating = undefined
      @restyled = undefined

    @console.info('Solution\t   ', @updated, solution, @solved.values)

    # Trigger events on engine and scope node
    @triggerEvent('solve', @updated.solution, @updated)
    if @scope
      @dispatchEvent(@scope, 'solve', @updated.solution, @updated)

    # Legacy events
    @triggerEvent('solved', @updated.solution, @updated)
    if @scope
      @dispatchEvent(@scope, 'solved', @updated.solution, @updated)
    
    @inspector.update(@)
        
    
    return @updated.solution

  # Accept solution from a solver and resolve it to verify
  yield: (solution) ->
    if !solution.push
      return @updating?.each(@resolve, @, solution) || @onSolve()

    #if @providing != undefined
    #  (@providing ||= []).push(Array.prototype.slice.call(arguments, 0))
    #  return
    
    return @update.apply(@, arguments)

  resolve: (domain, problems, index, workflow) ->
    if domain && !domain.solve && domain.postMessage
      workflow.postMessage domain, problems
      workflow.await(domain.url)
      return domain

    for problem, index in problems
      if problem instanceof Array && problem.length == 1 && problem[0] instanceof Array
        problem = problems[index] = problem[0]
    if problems instanceof Array && problems.length == 1 && problem instanceof Array
      problems = problem
    if domain
      @console.start(problems, domain.displayName)
      result = domain.solve(problems) || undefined
      if result && result.postMessage
        workflow.await(result.url)
      else
        if result?.length == 1
          result = result[0]
      @console.end()

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
     
      for other, i in @domains
        locals = []
        other.changes = undefined
        for remove in removes
          for path, index in remove
            continue if index == 0
            if other.paths[path]
              locals.push(path)
            else if other.observers?[path]
              other.remove(path)
        if other.changes
          for property, value of other.changes
            (result ||= {})[property] = value
          other.changes = undefined

        if locals.length
          other.remove.apply(other, locals)
          locals.unshift 'remove'
          workflow.push([locals], other, true)
        if others.length
          workflow.push(others, other)
      if typeof problems[0] == 'string'
        problems = [problems]
      for url, worker of @workers
        workflow.push problems, worker
    return result


  # auto-worker url, only works with sync scripts!
  getWorkerURL: do ->
    if document?
      scripts = document.getElementsByTagName('script')
      src = scripts[scripts.length - 1].src
      if location.search?.indexOf('log=0') > -1
        src += ((src.indexOf('?') > -1) && '&' || '?') + 'log=0'
    return (url) ->
      return typeof url == 'string' && url || src



  # Initialize new worker and subscribe engine to its events
  useWorker: (url) ->
    unless typeof url == 'string' && Worker? && self.onmessage != undefined
      return

    @worker = @getWorker(url)
    @worker.url = url
    @worker.addEventListener 'message', @eventHandler
    @worker.addEventListener 'error', @eventHandler
    @solve = (commands) =>
      @engine.updating ||= new @update
      @engine.updating.postMessage(@worker, commands)
      return @worker
    return @worker

  getWorker: (url) ->
    return (@engine.workers ||= {})[url] ||= (Engine.workers ||= {})[url] ||= new Worker(url)

  # Compile initial domains and shared engine features 
  precompile: ->
    @Domain.compile(@Domains,   @)
    @update = Engine::Update.compile(@)
    @mutations?.connect(true)

    if location.search.indexOf('export=') > -1
      @preexport()

  # Hook: Should interpreter iterate returned object?
  # (yes, if it's a collection of objects or empty array)
  isCollection: (object) ->
    if object && object.length != undefined && !object.substring && !object.nodeType
      return true if object.isCollection
      switch typeof object[0]
        when "object"
          return object[0].nodeType
        when "undefined"
          return object.length == 0

  clone: (object) -> 
    if object && object.map
      return object.map @clone, @
    return object

  indexOfTriplet: (array, a, b, c) ->
    if array
      for op, index in array by 3
        if op == a && array[index + 1] == b && array[index + 2] == c
          return index
    return -1

  # Comile user yieldd features specific to this engine
  compile: (state) ->
    if state
      for name of @Domains
        if domain = @[name.toLowerCase()]
          @Command.compile domain
      @Command.compile(@assumed)
      @Command.compile(@solved)
        
    @console.compile(@)
    @running = state ? null
    @triggerEvent('compile', @)
  
Engine.Continuation = Engine::Continuation

# Identity and console modules are shared between engines
Engine.identity = Engine::identity = new Engine::Identity
Engine.console  = Engine::console  = new Engine::Console

Engine.Engine   = Engine
Engine.Domain   = Engine::Domain   = Domain

# Listen for message in worker to initialize engine on demand
if !self.window && self.onmessage != undefined
  self.addEventListener 'message', (e) ->
    engine = Engine.messenger ||= Engine()
    changes = engine.assumed.changes = {}
    solution = engine.solve(e.data) || {}
    engine.assumed.changes = undefined
    for property, value of changes
      solution[property] = value
    postMessage(solution)
module.exports = @GSS = Engine