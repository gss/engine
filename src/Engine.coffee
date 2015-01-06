### Base class: Engine

Engine is a base class for scripting environment.
It initializes and orchestrates all moving parts.

It operates with workers and domains. Workers are
separate engines running in web worker thread. 
Domains are either independent constraint graphs or
pseudo-solvers like intrinsic measurements.

###

class Engine

  Command:      require('./Command')
  Domain:       require('./Domain')
  Update:       require('./Update')
  Query:        require('./Query')
    
  Console:      require('./utilities/Console')
  Inspector:    require('./utilities/Inspector')
  Exporter:     require('./utilities/Exporter')

  Domains: 
    Document:   require('./domains/Document')
    Abstract:   require('./domains/Abstract')
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
              @scope = scope = @getScopeElement(argument)
              Engine[Engine.identify(argument)] = @
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

    @listeners = {}
    @observers = {}
    @queries   = {}

    @lefts = []
    @pairs = {}
    
    @eventHandler = @handleEvent.bind(@)
    @addListeners(@$events)
    @addListeners(@events)


    @variables    = {}
    @domains      = []
    @stylesheets  = []
    @imported     = {}
    @engine       = @
    @inspector    = new @Inspector(@)
    @exporter     = new @Exporter(@)

    @precompile()
 
    # Known suggested values
    @assumed = new @Numeric
    @assumed.displayName = 'Assumed'
    @assumed.static = true
    @assumed.setup()

    # Final values, used in conditions
    @solved = new @Boolean
    @solved.displayName = 'Solved'
    @solved.priority = -200
    @solved.finalized = true
    @solved.setup()

    @values = @solved.values

    for property, value of assumed
      @assumed.values[property] = @values[property] = value

    # Cassowary is a default solver for all unknown variables
    @domain = @linear


    @strategy = 
      unless window?
        'evaluate'
      else if @scope
        'document'
      else
        'abstract'

    #if @ready
    #  @compile()

    return @

  # Evaluate bypassing abstract domain
  # So queries will not be executed, 
  # and variable names will be used as given 
  evaluate: (expressions) ->
    @update(expressions)

  # engine.solve({}) - solve with given constants
  # engine.solve([]) - evaluate commands
  # engine.solve(function(){}) - buffer and solve changes of state within callback
  solve: () ->

    unless @transacting
      @transacting = transacting = true

    args = @transact.apply(@, arguments)


    if typeof args[0] == 'function'
      result = args.shift().apply(@, args) 
    else if args[0]?
      strategy = @[@strategy]
      if strategy.solve
        @console.start(strategy.displayName, args)
        result = strategy.solve.apply(strategy, args) || {}
        @console.end(result)
      else
        result = strategy.apply(@, args)

    if transacting
      @transacting = undefined
      return @commit(result)

  # Figure out arguments and prepare to solve given operations
  transact: ->
    if typeof arguments[0] == 'string'
      reason = arguments[0]
      if typeof arguments[1] == 'string'
        arg = arguments[1]

    args = Array.prototype.slice.call(arguments, +reason? + +arg?)


    
    unless @updating
      @console.start(reason || (@updated && 'Update' || 'Initialize'), arg || args)
      @engine.updating = new @update
      @updating.start ?= @engine.console.getTime()

    unless @running
      @compile()

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

    return args

  # Run solution in multiple ticks
  commit: (solution, update = @updating) ->
    return if update.blocking

    if solution && Object.keys(solution).length
      @triggerEvent('resume', solution, update)
        
    until update.isDone() && !update.restyled && !update.solved
      # Process stylesheets, mutations, pairs, conditions, branches
      until update.isDocumentDone()
        @triggerEvent('commit', update)
      return if update.blocking


      # Evaluate queue of generated constraints
      if update.domains.length
        if !update.busy?.length
          @console.start('Solvers', update.problems.slice(update.index))
          update.each @resolve, @
          @console.end(update.solution)
        if update.busy?.length
          return update


      # Apply styles in bulk
      @console.start('Apply', update.solution)
      @triggerEvent('apply', update.solution, update)
      @triggerEvent('write', update.solution, update)
      @triggerEvent('flush', update.solution, update)
      @console.end(@values)

      # Re-measure values
      if update.solved || update.isDone()
        update.solved = update.restyled = undefined
        @triggerEvent('validate', update.solution, update)

    # Discard pure update 
    unless update.hadSideEffects(solution)
      @updating = undefined
      @console.end()
      return

    update.finish()

    @updated = update
    @updating = undefined

    @inspector.update()
    @console.end(update.solution)
    @fireEvent 'solve', update.solution, @updated
    @fireEvent 'solved', update.solution, @updated

    return update.solution

  validate: (update) ->

    return true

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
      return @broadcast problems, update

    @console.start(domain.displayName, problems)
    result = domain.solve(problems) || undefined
    if result && result.postMessage
      update.await(result.url)
    else
      if result?.length == 1
        result = result[0]
    @console.end(result)

    return result

  # Dispatch operations without specific domain (e.g. remove)
  broadcast: (problems, update = @updating, insert) ->
    others = []
    removes = []
    if insert
      if update.domains[update.index + 1] != null
        update.domains.splice(update.index, 0, null)
        update.problems.splice(update.index, 0, problems)
      else
        broadcasted = update.problems[update.index + 1]
        broadcasted.push.apply(broadcasted, problems)

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
          else if other.watched?[path]
            other.remove(path)
      if other.changes
        for property, value of other.changes
          (result or result = {})[property] = value
        other.changes = undefined

      if locals.length
        #other.remove.apply(other, locals)
        locals.unshift 'remove'
        locals.index = -1
        update.push([locals], other, true)
      if others.length
        update.push(others, other)
    if typeof problems[0] == 'string'
      problems = [problems]
    for url, worker of @workers
      working = problems.filter (command) ->
        command[0] != 'remove' || worker.paths?[command[1]]

      update.push working, worker, true
    return

  # Compile initial domains and shared engine features 
  precompile: ->
    @Domain.compile(@Domains,   @)
    @update = Engine::Update.compile(@)
    @triggerEvent('precompile')

  # Compile all static definitions in the engine
  compile: () ->
    for name of @Domains
      if domain = @[name.toLowerCase()]
        domain.compile()
    @assumed.compile()
    @solved.compile()
      
    @console.compile(@)
    @running = true
    @triggerEvent('compile', @)

  # Trigger event on engine and its scope element
  fireEvent: (name, data, object) ->
    @triggerEvent(name, data, object)
    if @scope
      @dispatchEvent(@scope, name, data, object)

  # Alias `engine.then(callback)` to `engine.once('solve', callback)`
  DONE: 'solve'

  $events:

    # Perform pending query operations
    commit: ->
      @Query::commit(@)
      @Query::repair(@)
      @Query::branch(@)

    # Merge results into a solved domain (updates engine.values)
    flush: (solution) ->
      @solved.merge solution

    # Apply given values to current update object and solved domain
    resume: (solution, update) ->
      if update.solution != solution
        update.apply(solution)
      @solved.merge(solution)

    # Dispatch remove command
    remove: (path) ->
      @solved.remove(path)
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

      if @updating?.busy.length
        @updating.solutions[@updating.solutions.indexOf(e.target, @updating.index)] = e.data
        @updating.busy.splice(@updating.busy.indexOf(e.target.url), 1)
        @commit e.data

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
    @solve = (commands) =>
      @engine.updating ||= new @update
      @engine.updating.postMessage(@worker, commands)
      return @worker
    return @worker

  # Use worker from a shared pool. To use multiple workers, provide #hashed urls
  getWorker: (url) ->
    worker = (@engine.workers ||= {})[url] ||= (Engine.workers ||= {})[url] ||= new Worker(url)
    worker.url ||= url
    worker.addEventListener 'message', @engine.eventHandler
    worker.addEventListener 'error', @engine.eventHandler
    return worker


  # Return domain that should be used to evaluate given variable
  # For unknown variables, it creates a domain instance 
  # that will hold all dependent constraints and variables.
  getVariableDomain: (operation, Default) ->
    if operation.domain
      return operation.domain
    path = operation[1]
    if (i = path.indexOf('[')) > -1
      property = path.substring(i + 1, path.length - 1)
    
    if @assumed.values.hasOwnProperty(path)
      return @assumed
    else if property && intrinsic = @intrinsic
      if props = intrinsic.properties
        if (props[path]? || (props[property] && !props[property].matcher))
          return intrinsic
      if property.indexOf('computed-') == 0 || property.indexOf('intrinsic-') == 0
        return intrinsic
      
    if Default
      return Default

    if op = @variables[path]?.constraints?[0]?.operations[0]?.domain
      return op
    
    if @domain.url
      return @domain
    else
      return @domain.maybe()

  # Normalize scope element
  getScopeElement: (node) ->
    switch node.tagName
      when 'HTML', 'BODY', 'HEAD'
        return document
      when 'STYLE'
        if node.scoped
          return @getScopeElement(node.parentNode)
    return node

  # Return an index of 3 given items values in a flat array of triplets 
  indexOfTriplet: (array, a, b, c) ->
    if array
      for op, index in array by 3
        if op == a && array[index + 1] == b && array[index + 2] == c
          return index
    return -1
    
  destroy: ->
    @triggerEvent('destroy')
    if @scope
      @dispatchEvent(@scope, 'destroy')
    @removeListeners(@events) if @events


  # Event trigger

  addListeners: (listeners) ->
    for name, callback of listeners
      @addEventListener name, callback

  removeListeners: (listeners) ->
    for name, callback of listeners
      @removeEventListener name, callback

  once: (type, fn) ->
    fn.once = true
    @addEventListener(type, fn)

  addEventListener: (type, fn) ->
    (@listeners[type] ||= []).push(fn)

  removeEventListener: (type, fn) ->
    if group = @listeners[type]
      if (index = group.indexOf(fn)) > -1
        group.splice(index, 1)

  triggerEvent: (type, a, b, c) ->
    if group = @listeners?[type]
      index = 0
      j = group.length
      while index < j
        fn = group[index]
        if fn.once
          group.splice(index--, 1)
          j--
        fn.call(@, a, b, c)
        index++
    if @[method = 'on' + type]
      return @[method](a, b, c)

  dispatchEvent: (element, type, data, bubbles, cancelable) ->
    return unless @scope
    detail = {engine: @}
    for prop, value of data
      detail[prop] = value

    element.dispatchEvent new CustomEvent(type, {detail,bubbles,cancelable})

  # Catch-all event listener 
  handleEvent: (e) ->
    @triggerEvent(e.type, e)

  then: (callback) ->
    @once @DONE, callback

class Engine::Identity
  @uid: 0

  excludes: ['$'.charCodeAt(0), ':'.charCodeAt(0), '@'.charCodeAt(0)]

  set: (object, generate) =>
    unless object
      return ''

    if typeof object == 'string'
      if @excludes.indexOf(object.charCodeAt(0)) == -1
        return '$' + object
      return object

    unless id = object._gss_id
      if object == document
        id = "::document"
      else if object == window
        id = "::window"

      unless generate == false
        object._gss_id = id ||= 
          "$" + (object.id || object._gss_uid || ++Identity.uid)
        @[id] = object
    return id
  
  get: (id) ->
    return @[id]

  solve: (id) ->
    return @[id]

  unset: (object) ->
    delete @[object._gss_id]

  # Get id if given object has one
  find: (object) ->
    return @set(object, false)

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
                command.index = command[0].index
              commands.push(command)

      if removes.length
        @solve(removes)
        if @updating.domains[0] == null
          @broadcast(@updating.problems[0])
          @updating.index++
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
    if !engine.domains.length
      engine.variables = {}
      engine.linear.operations = undefined
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