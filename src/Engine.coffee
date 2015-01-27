### Base class: Engine

Engine is a base class for scripting environment.
It initializes and orchestrates all moving parts.

It operates over workers and domains. Workers are
separate engines running in web worker thread. 
Domains are either independent constraint graphs or
pseudo-solvers like DOM measurements. ###
  
class Engine

  Command:   require('./engine/Command')
  Domain:    require('./engine/Domain')
  Update:    require('./engine/Update')
  Query:     require('./engine/Query')
  
  Solver:    require('./engine/domains/Linear')
  Input:     require('./engine/domains/Input')
  Data:      require('./engine/domains/Data')
  Output:    require('./engine/domains/Output')
    
  Console:   require('./engine/utilities/Console')
  Inspector: require('./engine/utilities/Inspector')
  Exporter:  require('./engine/utilities/Exporter')

  constructor: (data, url) -> #(scope, url, data)
    @engine = @

    # Attempt to initialize worker
    if url? && Worker?
      @url = @getWorkerURL(url)
    
    # Assign and manage event handlers
    @eventHandler = @handleEvent.bind(@)
    @listeners = {}
    for events in [@events, @$events, @$$events]
      @addListeners(events)

    # Manage and observe queries
    @observers = {}
    @queries   = {}

    # Register pairing selectors
    @lefts = []
    @pairs = {}

    # Track variables and dependency graphs
    @variables    = {}
    @domains      = []

    # Bookkeep parsed stylesheets
    @stylesheets  = []
    @imported     = {}

    # Initialize utilities
    @inspector    = new @Inspector(@)
    @exporter     = new @Exporter(@)

    # Subclass Update and Domains to point to this engine
    @update = @Update.compile(@)
    @Domain.compile(@)
    
    # Find and register commands in I/O domains
    @data.setup()
    @output.setup()

    # Link solved values and use given data
    @values = @output.values
    if data
      for property, value of data
        @data.values[property] = @values[property] = value

    # Bypass input domain for worker solver
    unless window?
      @strategy = 'update'

    # Listen for errors to flush buffered console
    self.addEventListener 'error', @eventHandler

    return @

  # engine.solve({}) - solve with given data
  # engine.solve([]) - evaluate commands
  # engine.solve(function(){}) - buffer and solve changes of state within callback
  solve: () ->

    unless @transacting
      @transacting = transacting = true

    args = @transact.apply(@, arguments)

    if typeof args[0] == 'function'
      if result = args.shift().apply(@, args) 
        @updating.apply result
        apply = false
    else if args[0]?
      strategy = @[@strategy || 'input']
        
      if strategy.solve
        @console.start(strategy.displayName, args)
        result = strategy.solve.apply(strategy, args)
        @console.end(result)
      else
        result = strategy.apply(@, args)

    if transacting
      @transacting = undefined
      
      return @commit(result, undefined, apply)

  # Figure out arguments and prepare to solve given operations
  transact: ->
    if typeof arguments[0] == 'string'
      reason = arguments[0]
      if typeof arguments[1] == 'string'
        arg = arguments[1]

    args = Array.prototype.slice.call(arguments, +reason? + +arg?)

    unless @updating
      @console.start(reason || (@updated && 'Update' || 'Initialize'), arg || args)
      @updating = new @update
      @updating.start()

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

  # Start a solving tick, may cause others
  commit: (solution, update = @updating, apply) ->
    return if update.blocking
    
    # Start with given solution
    if solution && Object.keys(solution).length
      @triggerEvent('resume', solution, update)
        
    until update.isDone() && !update.isDirty()
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

      # Apply values to elements
      if apply == false && !update.domains.length
        @triggerEvent('flush', update.solution, update)
      else
        @console.start('Apply', update.solution)
        @triggerEvent('apply', update.solution, update)
        @triggerEvent('write', update.solution, update)
        @triggerEvent('flush', update.solution, update)
        @console.end(@values)

        # Re-measure values
        if update.solved || update.isDone()
          @triggerEvent('validate', update.solution, update)
      
      update.commit()

    # Discard update if it did nothing 
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
   
    for other, i in [@data, @output].concat(@domains)
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


  # Compile all static definitions in the engine
  compile: () ->
    for name, domain of @
      if domain != @ && domain.engine
        domain.compile?(@)
    @running = true
    @triggerEvent('compile', @)

  # Trigger event on engine and its scope element
  fireEvent: (name, data, object) ->
    @triggerEvent(name, data, object)
    if @scope
      @dispatchEvent(@scope, name, data, object)
      
  # Builtin event handlers
  $events:

    # Perform pending query operations
    commit: ->
      @Query::commit(@)
      @Query::repair(@)
      @Query::branch(@)
      
      if values = @data.commit()
        @updating.apply(values)
    
      return

    # Merge results into a solved domain (updates engine.values)
    flush: (solution) ->
      @output.merge solution

    # Apply given values to current update object and solved domain
    resume: (solution, update) ->
      if update.solution != solution
        update.apply(solution)
      @output.merge(solution)

    # Dispatch remove command
    remove: (path) ->
      @output.remove(path)
      @updating?.remove(path)

    # Unsubscribe from worker and forget the engine
    destroy: (e) ->
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

    # Re-raise worker exception
    error: (e) ->
      @updating = undefined
      
      if window? && e.target != window
        throw new Error "#{e.message} (#{e.filename}:#{e.lineno})"
      

  # Figure out worker url automatically
  getWorkerURL: do ->
    if document?
      # Check if last script has gss substring in it
      scripts = document.getElementsByTagName('script')
      src = scripts[scripts.length - 1].src
      unless src.match(/gss/i)
        # Select a script from document that has gss in its src
        scripts = document.querySelectorAll('script[src*=gss]')[0]
        if scripts.length
          src = scripts[0].src
    return (url) ->
      unless typeof url == 'string'
        url = src

      unless url
        throw new Error """
          Can not detect GSS source file to set up worker.

          - You can rename the gss file to contain "gss" in it:
            `<script src="my-custom-path/my-gss.js"></script>`

          - or provide worker path explicitly: 
            `GSS(<scope>, "http://absolute.path/to/worker")`
        """

      return url

  # Initialize new worker and subscribe engine to listen for message
  useWorker: (url) ->
    # Don't use worker if path was not resolved properly
    return unless typeof url == 'string'

    # if environment doesn't support it
    return unless Worker?

    # or if it uses file protocol
    return if !url.match(/^http:/i) && location.protocol.match(/^file:/i)

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

  # Try to apply conventional wisdom to dispatch variable
  getVariableDomainByConvention: (operation, Default) ->
    if operation.domain
      return operation.domain
    path = operation[1]
    if (i = path.indexOf('[')) > -1
      property = path.substring(i + 1, path.length - 1)
    
    if @data.values.hasOwnProperty(path)
      return @data
    else if property
      if props = @data.properties
        if (props[path]? || (props[property] && !props[property].matcher))
          return @data
      if property.indexOf('computed-') == 0 || property.indexOf('intrinsic-') == 0
        return @data

  # Produce string representation of id-property pair
  getPath: (id, property) ->
    unless property
      property = id
      id = undefined
    if property.indexOf('[') > -1 || !id
      return property
    else
      if typeof id != 'string'
        id = @identify(id)

      if id == @scope?._gss_id && !@data.check(id, property)
        return property
      if id.substring(0, 2) == '$"'
        id = id.substring(1)
      return id + '[' + property + ']'

  
  url: false
  
  # Return domain that should be used to evaluate given variable
  # For unknown variables, it creates a domain instance 
  # that will hold all dependent constraints and variables.
  getVariableDomain: (operation, Default) ->
    if domain = @getVariableDomainByConvention(operation)
      return domain

    if Default
      return Default

    if op = @variables[operation[1]]?.constraints?[0]?.operations[0]?.domain
      return op

    if @solver.url
      return @solver
    else
      return @solver.maybe()

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

    try
      event = new window.CustomEvent(type, {detail,bubbles,cancelable})
    catch e
      window.CustomEvent = (event, params) ->
        params = params or
          bubbles: false
          cancelable: false
          detail: undefined

        evt = document.createEvent "CustomEvent"
        evt.initCustomEvent event, params.bubbles, params.cancelable, params.detail
        evt
      window.CustomEvent:: = window.Event::
      event = new window.CustomEvent(type, {detail,bubbles,cancelable})

    element.dispatchEvent event

  # Catch-all event listener 
  handleEvent: (e) ->
    @triggerEvent(e.type, e)

  then: (callback) ->
    @once 'solve', callback

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
      engine = Engine.messenger = new Engine()
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
        @data.merge(values)
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
      engine.solver.operations = undefined
    postMessage(result)

# Identity and console modules are shared between engines
Engine::console  = new Engine::Console
Engine::identity = new Engine::Identity
Engine::identify =     Engine::identity.set

# Slice arrays recursively to remove the meta data
Engine::clone    = (object) -> 
  if object && object.map
    return object.map @clone, @
  return object

module.exports = Engine
