### Domain: Observed values
Acts as input values for equations.

Interface:

  - (un)watch() - (un)subscribe expression to property updates
  - set()       - dispatches updates to subscribed expressions
  - get()       - retrieve value
  - clean()     - detach observes by continuation


State:
  - @watchers[key] - List of oservers of specific properties
                      as [operation, continuation, scope] triplets

  - @observers[continuation] - List of observers by continuation
                                as [operation, key, scope] triplets

###

Native = require('../methods/Native')

class Domain
  priority: 0  

  constructor: (engine, url, values, name) ->
    if !engine || engine instanceof Domain
      @variables    = {} unless @hasOwnProperty('variables')
      @watchers     = {} unless @hasOwnProperty('watchers')
      @observers    = {} unless @hasOwnProperty('observers')
      @paths        = {} unless @hasOwnProperty('paths')
      @values       = {} unless @hasOwnProperty('values')
      @substituted  = []
      @constraints  = []
      @engine       = engine if engine
      @displayName  = name   if name
      @url          = url    if url
      @merge(values)         if values

      if @url && @getWorkerURL
        if @url = @getWorkerURL(@url)
          if engine != @
            @useWorker(@url)

      return @
    else
      return @find.apply(@, arguments)

  solve: (args) ->
    return unless args

    if typeof args == 'object' && !args.push
      if @domain == @engine
        @assumed.merge args
      else
        @merge args
    else if strategy = @strategy
      if (object = @[strategy]).solve
        result = object.solve.apply(object, arguments)
      else
        result = @[strategy].apply(@, arguments)
      #if result?
      #  @provide result
      return result

  provide: (solution, value) ->
    if solution instanceof Domain
      return @merge solution
    else if @domain
      return @engine.engine.provide solution
    else
      return @engine.provide solution
    # for property, value of solution
    #   @verify(null, property, value)
    return true

  verify: (scope, property, value) ->
    property = @engine.getPath(scope, property)
    scope = null
    return  @invalidate(scope, property, value) || 
                 @merge(scope, property, value) ||
                @import(scope, property, value)

# Domain::verify  = Invalidate / Merge / Subscribe,   Solver
# Domain::provide = Return     / Set   / Suggest
# Domain::solve   = Compute 

  watch: (object, property, operation, continuation, scope) ->
    path = @engine.getPath(object, property)
    if @engine.indexOfTriplet(@watchers[path], operation, continuation, scope) == -1
      observers = @observers[continuation] ||= []
      observers.push(operation, path, scope)

      watchers = @watchers[path] ||= []
      watchers.push(operation, continuation, scope)
    return @get(path)

  unwatch: (object, property, operation, continuation, scope) ->
    path = @engine.getPath(object, property)
    observers = @observers[continuation]
    index = @engine.indexOfTriplet observers, operation, path, scope
    observers.splice index, 3
    delete @observers[continuation] unless observers.length

    watchers = @watchers[path]
    index = @engine.indexOfTriplet watchers, operation, continuation, scope
    watchers.splice index, 3
    delete @watchers[path] unless watchers.length

  get: (object, property) ->
    return @values[@engine.getPath(object, property)]

  merge: (object, meta) ->
    # merge objects/domains
    if object && !object.push
      if object instanceof Domain
        return# object
      return @engine.solve @displayName || 'GSS', (domain) ->
        async = false
        for path, value of object
          domain.set undefined, path, value, meta, true
          if watchers = domain.watchers?[path]
            if !@callback(domain, watchers, value, meta)?
              async = true
        return true unless async
      , @


  # Set key-value pair or merge object
  set: (object, property, value, meta, silent) ->
    path = @engine.getPath(object, property)
    old = @values[path]
    return if old == value

    if value?
      @values[path] = value
    else
      delete @values[path]
    # notify subscribers
    unless silent
      async = false
      if watchers = @watchers?[path]
        @engine.solve @displayName || 'GSS', (domain) ->
          return @callback(domain, watchers, value, meta)
        , @

    return value

  sanitize: (exps, parent = exps.parent, index = exps.index) ->
    if exps[0] == 'value' && exps.operation
      return parent[index] = @sanitize exps.operation, parent, index
    for own prop, value of exps
      unless isFinite(parseInt(prop))
        delete exps[prop]
    for exp, i in exps
      if exp.push
        @sanitize exp, exps, i
    exps.parent = parent
    exps.index  = index
    exps

  callback: (domain, watchers, value, meta) ->
    for watcher, index in watchers by 3
      break unless watcher
      if watcher.domain != domain || !value?
        # Re-evaluate expression
        @Workflow(@sanitize(@getRootOperation(watcher)))
      else
        domain.solve watcher.parent, watchers[index + 1], watchers[index + 2] || undefined, meta || undefined, watcher.index || undefined, value
    @

  # Export values in a plain object. Use for tests only
  toObject: ->
    object = {}
    for own property, value of @
      if property != 'engine' && property != 'observers' && property != 'watchers' && property != 'values'
        object[property] = value
    return object

  invalidate: (scope, property, value) ->
    path = @engine.getPath(scope, property)
    return unless @variables[path]
    if (@invalid ||= []).indexOf(path) == -1
      @invalid.push path


  import: (scope, property, value) ->
    unless target
      for domain in @domains
        if @domain.import(scope, property, target)
          return true
      return false
    path = @engine.getPath(scope, property)
    if @variables[path]
      return false

  compare: (a, b) ->
    if typeof a == 'object'
      return unless typeof b == 'object'
      if a[0] == 'value' && b[0] == 'value'
        return unless a[3] == b[3]
      if a[0] == 'value'
        return a[3] == b.toString()
      if b[0] == 'value'
        return b[3] == a.toString()
      for value, index in a
        return unless @compare(b[index], value)
      return unless b[a.length] == a[a.length]
    else
      return if typeof b == 'object'
      return unless a == b
    return true

  constrain: (constraint) ->
    if constraint.paths
      matched = undefined
      for path in constraint.paths
        if path[0] == 'value' && !matched
          matched = true
          for other in @constraints
            if @compare(other.operation, constraint.operation)
              console.info('updating constraint', other.operation, '->', constraint.operation)
                
              @unconstrain(other)
      matched = undefined
      for other in @substituted by -1
        if @compare(other.operation, constraint.operation)
          console.info('updating constraint', other.operation, '->', constraint.operation)
          @unconstrain(other)

      for path in constraint.paths
        if typeof path == 'string'
          (@paths[path] ||= []).push(constraint)
        else if path[0] == 'value'
          @substituted.push(constraint)
        else if path.name
          length = (path.constraints ||= []).push(constraint)
          if length == 1
            if @nullified && @nullified[path.name]
              delete @nullified[path.name]
            else
              (@added ||= {})[path.name] = 0

    if typeof (name = constraint[0]) == 'string'
      @[constraint[0]]?.apply(@, Array.prototype.slice.call(constraint, 1))
      return true

    @constraints.push(constraint)
    @constrained = true
    return

  unconstrain: (constraint, continuation) ->
    for path in constraint.paths
      if typeof path == 'string'
        if group = @paths[path]
          if (index = group.indexOf(constraint)) > -1
            group.splice(index, 1)
          unless group.length
            delete @paths[path]
      else if path[0] == 'value'
        @substituted.splice(@substituted.indexOf(constraint))
      else
        index = path.constraints.indexOf(constraint)
        if index > -1
          path.constraints.splice(index, 1)
          unless path.constraints.length
            @undeclare(path)

    @constraints.splice(@constraints.indexOf(constraint), 1)

  declare: (name, value) ->
    return @variables[name] ||= value ? @variable(name)

  undeclare: (variable) ->
    delete @variables[variable.name]

  remove: ->
    for path in arguments
      for contd in @getPossibleContinuations(continuation)
        if observers = @observers[contd]
          while observers[0]
            @unwatch(observers[1], undefined, observers[0], contd, observers[2])
      
      if constraints = @variables[path]
        for constrain in constraints by -1
          if @isConstraint(constraint)
            @unconstraint(constraint, path)
          else if @isVariable(constraint)
            @undeclare(constraint)
    return

  # Schedule execution of expressions to the next tick, buffer input
  defer: (reason) ->
    if @solve.apply(@, arguments)
      @deferred ?= Native::setImmediate( =>
        @deferred = undefined
        @flush()
      , 0)

  maybe: () ->
    @Maybe ||= Native::mixin(@, MAYBE: @)
    return new @Maybe

  # Make Domain class inherit given engine instance. Crazy huh
  # Overloads parts of the world (methods, variables, observers)
  @compile = (domains, engine) ->
    for own name, domain of domains
      continue if domain.condition?() == false
      EngineDomain = engine[name] = (object) ->
        if object
          for property, value of object
            @values = [] unless @hasOwnProperty 'values'
            @values[property] = value

        @domain      = @
        @variables   = new (Native::mixin(@engine.variables))

        unless @events == engine.events
          @addListeners(@events)
          @events    = new (Native::mixin(@engine.events))

        unless @Methods == engine.Methods
          @Wrapper.compile @Methods::, @ if @Wrapper
          @Method.compile  @Methods::, @
          Methods    = @Methods
        @methods     = new (Native::mixin(@engine.methods, Methods))

        unless @Properties == engine.Properties
          @Property.compile @Properties::, @
          Properties = @Properties
        @properties  = new (Native::mixin(@engine.properties, Properties))

        @expressions = new @Expressions(@) 

        return Domain::constructor.call(@, engine)

      EngineDomainWrapper       = engine.mixin(engine, domain)
      EngineDomain.prototype    = new EngineDomainWrapper
      EngineDomain::solve       ||= Domain::solve unless domain::solve
      EngineDomain::strategy    = 'expressions'
      EngineDomain::displayName = name
      EngineDomain.displayName  = name
      unless engine.prototype
        engine[name.toLowerCase()] = new engine[name]
    @

  DONE: 'solve'

module.exports = Domain

