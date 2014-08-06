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

  constructor: (engine, values, name) ->
    if !engine || engine instanceof Domain
      @variables    = @engine && new (Native::mixin(@engine.variables)) || {}
      @watchers     = @engine && new (Native::mixin(@engine.watchers )) || {}
      @observers    = @engine && new (Native::mixin(@engine.observers)) || {}
      @subsolutions = {}
      @engine       = engine  if engine
      @displayName  = name    if name
      @merge(values)          if values

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
    return @[@engine.getPath(object, property)]

  merge: (object) ->
    # merge objects/domains
    if object && !object.push
      if object instanceof Domain
        return# object

      @engine.solve @displayName, (domain) ->
        for path, value of object
          domain.set undefined, path, value
        return
      , @


  # Set key-value pair or merge object
  set: (object, property, value, meta) ->
    path = @engine.getPath(object, property)
    old = @[path]
    return if old == value

    if value?
      @[path] = value
    else
      delete @[path]

    # notify subscribers
    if watchers = @watchers?[path]
      @engine.solve @displayName, path, ->
        for watcher, index in watchers by 3
          break unless watcher
          @solve watcher.parent, watchers[index + 1], watchers[index + 2] || null, meta || null, watcher.index || null, value
        @
    return value

  # Export values in a plain object. Use for tests only
  toObject: ->
    object = {}
    for own property, value of @
      if property != 'engine' && property != 'observers' && property != 'watchers'
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

  getRootOperation: (operation) ->
    parent = operation
    while parent.parent && parent.parent.def && !parent.parent.def.noop
      parent = parent.parent
      break unless parent.domain == operation.domain
    return parent

  compare: (a, b) ->
    if typeof a == 'object'
      return unless typeof b == 'object'
      if a[0] == 'value' && b[0] == 'value'
        return unless a[3] == b[3]
      for value, index in a
        return unless @compare(b[index], value)
      return unless b[a.length] == a[a.length]
    else
      return if typeof b == 'object'
      return unless a == b
    return true

  constrain: (constraint) ->
    if constraint.paths
      root = other = undefined
      for path in constraint.paths
        if path[0] == 'value'
          subsolutions = @subsolutions[path[3]] ||= []
          debugger
          for sub in subsolutions
            subop = undefined
            for p in sub.paths
              if p[0] == 'value'
                subop = p
                break
            if subop
              root ?= @getRootOperation(path)
              other = @getRootOperation(subop)
              if @compare(root, other)
                console.info('updating constraint', subop, '->', path)
                debugger
                @unconstrain(sub)
                break
          subsolutions.push(constraint)


      for path in constraint.paths
        if typeof path == 'string'
          (@variables[path] ||= []).push(constraint)
        else if path.name
          path.counter = (path.counter || 0) + 1
          if path.counter == 1
            if @nullified && @nullified[path.name]
              delete @nullified[path.name]
            else
              (@added ||= {})[path.name] = 0

    if typeof (name = constraint[0]) == 'string'
      @[constraint[0]]?.apply(@, Array.prototype.slice.call(constraint, 1))
      return true

    @constrained = true
    return

  unconstrain: (constraint, continuation) ->
    for path in constraint.paths
      if typeof path == 'string'
        if group = @variables[path]
          if (index = group.indexOf(constraint)) > -1
            group.splice(index, 1)
          unless group.length
            delete @variables[path]
      else if path[0] == 'value'
        if subsolutions = @subsolutions[path[3]]
          subsolutions.splice(subsolutions.indexOf(constraint), 1)
          unless subsolutions.length
            delete @subsolutions[path[3]]
      else
        unless --path.counter
          @undeclare(path)

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

  # Make Domain class inherit given engine instance. Crazy huh
  # Overloads parts of the world (methods, variables, observers)
  @compile = (domains, engine) ->
    for own name, domain of domains
      EngineDomain = engine[name] = (object) ->
        if object
          for property, value of object
            @[property] = value
        @domain      = @
        #@variables   = Native::mixin(@engine.variables)
        #@observers   = Native::mixin(@engine.observers)
        #@watchers    = Native::mixin(@engine.watchers) 

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

module.exports = Domain

