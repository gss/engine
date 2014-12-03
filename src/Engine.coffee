### Base class: Engine

Engine is a base class for scripting environment.
It initializes and orchestrates all moving parts.

It operates with workers and domains. Workers are
separate engines running in web worker thread. 
Domains are either independent constraint graphs or
pseudo-solvers like intrinsic measurements.

###

Events  = require('./structures/Events')

class Engine extends Events

  Command:      require('./Command')
  Domain:       require('./Domain')
  Update:       require('./Update')
    
  Console:      require('./utilities/Console')
  Inspector:    require('./utilities/Inspector')
  Exporter:     require('./utilities/Exporter')
  
  Identity:     require('./structures/Identity')
  Signatures:   require('./structures/Signatures')

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
              Engine[Engine.identify(argument)] = @
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

    if url?
      @url = url
    
    super
    @addListeners(@$events)

    @variables    = {}
    @domains      = []
    @engine       = @
    @inspector    = new @Inspector(@)

    @precompile()
 
    # Known suggested values
    @assumed = new @Numeric
    @assumed.displayName = 'Assumed'
    @assumed.static = true
    @assumed.setup()
    for property, value of assumed
      @assumed.values[property] = value

    # Final values, used in conditions
    @solved = new @Boolean
    @solved.displayName = 'Solved'
    @solved.priority = -200
    @solved.setup()

    @values = @solved.values

    # Cassowary is a default solver for all unknown variables
    @domain = @linear


    @strategy = 
      unless window?
        'evaluate'
      else if @scope
        'document'
      else
        'abstract'

    return @

  # Evaluate bypassing abstract domain
  # So queries will not be executed, 
  # and variable names will be used as given 
  evaluate: (expressions) ->
    @update(expressions).solution

  # engine.solve({}) - solve with given constants
  # engine.solve([]) - evaluate commands
  # engine.solve(function(){}) - buffer and solve changes of state within callback
  solve: () ->
    args = @transact.apply(@, arguments)

    unless @transacting
      @transacting = transacting = true

    unless old = @updating
      @engine.updating = new @update
      @updating.start ?= @engine.console.time()


    if typeof args[0] == 'function'
      solution = args.shift().apply(@, args) 
    else if args[0]?
      strategy = @[@strategy]
      if strategy.solve
        solution = strategy.solve.apply(strategy, args) || {}
      else
        solution = strategy.apply(@, args)

    return @commit(solution, old, transacting)

  # Figure out arguments and prepare to solve given operations
  transact: ->
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

    return args

  # Process and apply computed values
  commit: (solution, old, transacting) ->
    if solution
      @updating.apply(solution)

    @fireEvent('commit', solution)

    if started = @started
      @started = undefined

    if transacting
      @transacting = undefined

      @console.end()

    update = @updating
    if update.domains.length
      if old
        if old != update
          old.push(update)
      if !old || !update.busy?.length
        update.each @resolve, @
      if update.busy?.length
        return update

    removing = (update.problems.length == 1 && update.domains[0] == null)
    restyling = (@restyled && !update.problems.length)
    complete = !update.problems[update.index + 1]
    effects = removing || restyling || complete
    if @engine == @ && transacting && effects 
      return @onSolve(null, effects)

  onSolve: (solution, restyled) ->
    # Apply styles
    update = @updating
    if solution ||= update.solution
      #if Object.keys(solution).length

      @fireEvent('apply', solution, update)
      @applier?.solve(solution)
    else if !update.reflown && !restyled
      if !update.problems.length
        @updating = undefined
      return

    if @intrinsic
      @intrinsic.changes = {}
      update.apply @intrinsic.perform()
      @intrinsic.changes = undefined

    @solved.merge solution

    #@commit()
    update.reset()

    # Launch another pass here if solutions caused effects
    effects = update.each(@resolve, @)
    if update.busy?.length
      return effects

    if effects && Object.keys(effects).length
      return @onSolve(effects)

    # Solved event is fired even for commands that cause side effects
    if (!solution || (!solution.push && !Object.keys(solution).length) || update.problems[update.index + 1]) &&
        (update.problems.length != 1 || update.domains[0] != null) &&
        !@engine.restyled
      return 

    @updating.finish()
    
    if !update.problems.length && @updated?.problems.length && !@engine.restyled
      @restyled = @updating = undefined
      return
    else
      @restyled = @updating = undefined
      @updated = update

    @console.info('Solution\t   ', @updated, solution, @solved.values)

    # Trigger events on engine and scope node
    @fireEvent 'solve', @updated.solution, @updated
    @fireEvent 'solved', @updated.solution, @updated
    
    @inspector.update(@)
        
    
    return @updated.solution

  # Accept solution from solver, remeasure if necessary
  yield: (solution) ->
    if !solution.push
      return @updating?.each(@resolve, @engine, solution) || @onSolve(solution)

    return @update.apply(@engine, arguments)

  # Solve problems by given domain/worker
  # Writes messages to lazy buffer, when using worker
  resolve: (domain, problems, index, update) ->
    if domain && !domain.solve && domain.postMessage
      update.postMessage domain, problems
      update.await(domain.url)
      return domain


    for problem, index in problems
      if problem instanceof Array && problem.length == 1 && problem[0] instanceof Array
        problem = problems[index] = problem[0]
    
    unless domain
      return @broadcast problems, index, update

    @console.start(problems, domain.displayName)
    result = domain.solve(problems) || undefined
    if result && result.postMessage
      update.await(result.url)
    else
      if result?.length == 1
        result = result[0]
    @console.end()
    domain.setup()
    if domain.Solver && !domain.url
      if @domains.indexOf(domain) == -1
        @domains.push(domain)

    return result

  # Dispatch operations without specific domain (e.g. remove)
  broadcast: (problems, index, update) ->
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
   
    for other, i in [@assumed, @solved].concat(@domains)
      locals = []
      other.changes = undefined
      for remove in removes
        for path, index in remove
          continue if index == 0
          if other.paths?[path]
            locals.push(path)
          else if other.observers?[path]
            other.remove(path)
      if other.changes
        for property, value of other.changes
          (result or result = {})[property] = value
        other.changes = undefined

      if locals.length
        #other.remove.apply(other, locals)
        locals.unshift 'remove'
        update.push([locals], other, true)
      if others.length
        update.push(others, other)
    if typeof problems[0] == 'string'
      problems = [problems]
    for url, worker of @workers
      working = problems.filter (command) ->
        command[0] != 'remove' || worker.paths?[command[1]]

      update.push working, worker
    return

  # Compile initial domains and shared engine features 
  precompile: ->
    @Domain.compile(@Domains,   @)
    @update = Engine::Update.compile(@)
    @mutations?.connect(true)

    if location.search.indexOf('export=') > -1
      @preexport()

  # Compile all static definitions in the engine
  compile: (state) ->
    if state
      for name of @Domains
        if domain = @[name.toLowerCase()]
          domain.compile()
      @assumed.compile()
      @solved.compile()
        
    @console.compile(@)
    @running = state ? null
    @triggerEvent('compile', @)

  # Trigger event on engine and its scope element
  fireEvent: (name, data, object) ->
    @triggerEvent(name, data, object)
    if @scope
      @dispatchEvent(@scope, name, data, object)

  # Alias `engine.then(callback)` to `engine.once('solve', callback)`
  DONE: 'solve'

  $events:
    # Dispatch remove command
    remove: (path) ->
      @updating.remove(path)

    # Unsubscribe from worker and forget the engine
    destroy: (e) ->
      if @scope
        Engine[@scope._gss_id] = undefined
      if @worker
        @worker.removeEventListener 'message', @eventHandler
        @worker.removeEventListener 'error', @eventHandler

    # Receive message from worker
    message: (e) ->
      values = e.target.values ||= {}
      for property, value of e.data
        if value?
          values[property] = value
        else
          delete values[property]

      if @updating
        if @updating.busy.length
          @updating.busy.splice(@updating.busy.indexOf(e.target.url), 1)
          if (i = @updating.solutions.indexOf(e.target)) > -1
            @updating.solutions[i] = e.data
          unless @updating.busy.length
            return @updating.each(@resolve, @, e.data) || @onSolve(e.data)
          else
            return @updating.apply(e.data)

    # Handle error from worker
    error: (e) ->
      throw new Error "#{e.message} (#{e.filename}:#{e.lineno})"
    
  # Figure out worker url automatically, only works with sync scripts!
  getWorkerURL: do ->
    if document?
      scripts = document.getElementsByTagName('script')
      src = scripts[scripts.length - 1].src
      if location.search?.indexOf('log=0') > -1
        src += ((src.indexOf('?') > -1) && '&' || '?') + 'log=0'
    return (url) ->
      return typeof url == 'string' && url || src

  # Initialize new worker and subscribe engine to listen for message
  useWorker: (url) ->
    unless typeof url == 'string' && Worker? && self.onmessage != undefined
      return

    @engine.worker ||= @engine.getWorker(url)
    @worker.url = url
    @worker.addEventListener 'message', @engine.eventHandler
    @worker.addEventListener 'error', @engine.eventHandler
    @solve = (commands) =>
      @engine.updating ||= new @update
      @engine.updating.postMessage(@worker, commands)
      return @worker
    return @worker

  # Use worker from a shared pool. To use multiple workers, provide #hashed urls
  getWorker: (url) ->
    return (@engine.workers ||= {})[url] ||= (Engine.workers ||= {})[url] ||= new Worker(url)


# Listen for message in worker to initialize engine on demand
if !self.window && self.onmessage != undefined
  self.addEventListener 'message', (e) ->
    unless engine = Engine.messenger
      engine = Engine.messenger = Engine()
    data = e.data
    values = undefined
    commands = []
    removes = []
    solution = engine.solve ->
      if (values = data[0]) && !values.push
        for command, index in data
          if index
            if command[0] == 'remove'
              removes.push(command)
            else
              if command[0]?.key?
                command[1].parent = command
              commands.push(command)
      if removes.length
        @solve(removes)
      if values
        @assumed.merge(values)
      if commands.length
        @solve(commands)

    result = {}
    if values
      for property, value of values
        result[property] = value
      for property, value of solution
        result[property] = value
    postMessage(result)

Engine.Engine   = Engine

# Identity and console modules are shared between engines
Engine.identity = Engine::identity = new Engine::Identity
Engine.identify = Engine::identify = Engine.identity.set
Engine.console  = Engine::console  = new Engine::Console

  # Slice arrays recursively to remove the meta data
Engine.clone    = Engine::clone = (object) -> 
  if object && object.map
    return object.map @clone, @
  return object

module.exports = @GSS = Engine