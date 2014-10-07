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
  Update:      require('./concepts/Update')
  
  Properties:  require('./properties/Axioms')

  Methods:     Native::mixin new Native,
               require('./methods/Conventions')
  Domains: 
    Abstract:  require('./domains/Abstract')
    Document:  require('./domains/Document')
    Intrinsic: require('./domains/Intrinsic')
    Numeric:   require('./domains/Numeric')
    Linear:    require('./domains/Linear')
    Finite:    require('./domains/Finite')
    Boolean:   require('./domains/Boolean')


  constructor: () -> #(scope, url, data)
    for argument, index in arguments
      continue unless argument
      switch typeof argument
        when 'object'
          if argument.nodeType
            if @Expressions
              Engine[Engine.identity.provide(argument)] = @
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
    unless @Expressions
      return new Engine(arguments[0], arguments[1], arguments[2])

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
    @solved.eager = true
    @solved.setup()

    @values = @solved.values


    unless window?
      @strategy = 'substitute'
    else if @scope
      @strategy = 'document'
    else
      @strategy = 'abstract'

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

      @provide e.data

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
    unless old = @updating
      @engine.updating = new @update

    if @providing == undefined
      @providing = null
      providing = true
    if typeof args[0] == 'function'
      solution = args.shift().apply(@, args) 
    else
      solution = Domain::solve.apply(@, args)


    @queries?.onBeforeSolve()
    @pairs?.onBeforeSolve()


    if providing
      while provided = @providing
        @providing = null
        if args[0]?.index
          provided.index ?= args[0].index
          provided.parent ?= args[0].parent
        @update(provided)
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
        delete @updating
      return

    if @intrinsic# && (restyled || (solution && Object.keys(solution).length))
      @intrinsic.changes = {}
      scope = @updating.reflown || @scope
      @updating.reflown = undefined
      @intrinsic?.each(scope, @intrinsic.update)
      @updating.apply @intrinsic.changes
      @intrinsic.changes = undefined

    @solved.merge solution

    @pairs?.onBeforeSolve()
    @updating.reset()

    # Launch another pass here if solutions caused effects
    # Effects are processed separately, then merged with found solution
    effects = {}
    effects = @updating.each(@resolve, @, effects)
    if @updating.busy?.length
      return effects
      
    #return if @requesting

    if effects && Object.keys(effects).length
      return @onSolve(effects)


    # Fire up solved event if we've had remove commands that 
    # didnt cause any reactions
    if (!solution || @updating.problems[@updating.index + 1]) &&
        (@updating.problems.length != 1 || @updating.domains[0] != null) &&
        !@engine.restyled
      return 

    if !@updating.problems.length && @updated?.problems.length
      @updating = undefined
      return
    else
      @updated = @updating
      @updating = undefined

    @console.info('Solution\t   ', @updated, solution, @solved.values)

    # Trigger events on engine and scope node
    @triggerEvent('solve', @updated.solution, @updated)
    if @scope
      @dispatchEvent(@scope, 'solve', @updated.solution, @updated)

    # Legacy events
    @triggerEvent('solved', @updated.solution, @updated)
    if @scope
      @dispatchEvent(@scope, 'solved', @updated.solution, @updated)

    return @updated.solution

  # Accept solution from a solver and resolve it to verify
  provide: (solution) ->
    if solution.operation
      return @engine.updating.provide solution
    if !solution.push
      return @updating?.each(@resolve, @, solution) || @onSolve()

    if @providing != undefined
      unless @hasOwnProperty('providing')
        @engine.providing ||= []

      (@providing ||= []).push(Array.prototype.slice.call(arguments, 0))
      return
    else
      return @update.apply(@, arguments)

  resolve: (domain, problems, index, workflow) ->
    if domain && !domain.solve && domain.postMessage
      workflow.postMessage domain, problems
      workflow.await(domain.url)
      return domain
    if (index = workflow.imports?.indexOf(domain)) > -1
      finish = index
      imports = []
      while property = workflow.imports[++finish]
        break unless typeof property == 'string'
        if imports.indexOf(property) == -1
          imports.push(property)
      workflow.imports.splice(index, finish - index)

      for property in imports
        if @intrinsic.values.hasOwnProperty(property)
          value = @intrinsic.values[property]
        else if workflow.solution?.hasOwnProperty(property)
          value = workflow.solution[property]
        else
          value = @solution?[property]

        if value?
          problems.push ['value', value, property]

    for problem, index in problems
      if problem instanceof Array && problem.length == 1 && problem[0] instanceof Array
        problem = problems[index] = problem[0]
    if problems instanceof Array && problems.length == 1 && problem instanceof Array
      problems = problem
    if domain
      if @providing == undefined
        @providing = null
        providing = true
      @console.start(problems, domain.displayName)
      result = domain.solve(problems) || undefined
      if result && result.postMessage
        workflow.await(result.url)
      else
        if providing && @providing
          workflow.push(@update(@frame || true, @providing))
          workflow.optimize()

        if result?.length == 1
          result = result[0]
      if providing
        @providing = undefined
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
            else if other.observers[path]
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
    @update = Engine::Update.compile(@)
    @mutations?.connect()

    if location.search.indexOf('export=') > -1
      @preexport()

  preexport: ->
    # Let every element get an ID
    for element in @scope.getElementsByTagName('*')
      @identity.provide(element)
    if window.Sizes
      @sizes = []
      for pairs in window.Sizes
        for width in pairs[0]
          for height in pairs[1]
            @sizes.push(width + 'x' + height)
    if match = location.search.match(/export=([a-z0-9]+)/)?[1]
      if match.indexOf('x') > -1
        [width, height] = match.split('x')
        baseline = 72
        width = parseInt(width) * baseline
        height = parseInt(height) * baseline
        window.addEventListener 'load', =>
          localStorage[match] = JSON.stringify(@export())
          @postexport()

        document.body.style.width = width + 'px'
        @intrinsic.properties['::window[height]'] = ->
          return height
        @intrinsic.properties['::window[width]'] = ->
          return width

      else 
        if match == 'true'
          localStorage.clear()
        @postexport()

  postexport: ->
    debugger
    for size in @sizes
      unless localStorage[size]
        location.search = location.search.replace(/[&?]export=([a-z0-9])+/, '') + '?export=' + size
        return
    result = {}
    for property, value of localStorage
      if property.match(/^\d+x\d+$/)
        result[property] = JSON.parse(value)
    document.write(JSON.stringify(result))

  export: ->
    values = {}
    for path, value of @values
      if (index = path.indexOf('[')) > -1 && path.indexOf('"') == -1
        property = @camelize(path.substring(index + 1, path.length - 1))
        id = path.substring(0, index)
        if property == 'x' || property == 'y' || document.body.style.hasOwnProperty(property)
          unless @values[id + '[intrinsic-' + property + ']']?
            values[path] = Math.ceil(value)
    values.stylesheets = @stylesheets.export() 
    return values

  generate: ->


  # Comile user provided features specific to this engine
  compile: (state) ->
    methods    = @methods    || @Methods::
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
    changes = engine.assumed.changes = {}
    solution = engine.solve(e.data) || {}
    engine.assumed.changes = undefined
    for property, value of changes
      solution[property] = value
    postMessage(solution)
module.exports = @GSS = Engine