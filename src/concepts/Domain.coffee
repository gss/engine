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
  priority: -Infinity

  constructor: (engine, values, name) ->
    if !engine || engine instanceof Domain
      @variables   = @engine && new (Native::mixin(@engine.variables)) || {}
      @watchers    = @engine && new (Native::mixin(@engine.watchers )) || {}
      @observers   = @engine && new (Native::mixin(@engine.observers)) || {}
      @engine      = engine  if engine
      @displayName = name    if name
      @merge(values)         if values

      return @
    else
      if engine.push
        if engine.domain
          return engine.domain
        [cmd, scope, property] = variable = engine
      else
        [scope, property] = arguments

      path = @getPath(scope, property)
      if declaration = @variables[path]
        domain = declaration.domain
      else 
        if (index = property.indexOf('-')) > -1
          prefix = property.substring(0, index)
          if (domain = @[prefix])
            unless domain instanceof Domain
              domain = undefined
        unless domain
          if @assumed.hasOwnProperty path
            domain = @assumed
          else
            domain = @linear
      if variable
        variable.domain = domain
      return domain

  strategy: 'substitute'

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

  substitute: (expression, parent) ->
    substituted = expression
    for exp, index in expression
      if exp.push
        replaced = @substitute(exp, parent)
        unless replaced == exp
          if substituted == expression
            substituted = expression.slice(0)
            if expression.domain
              substituted.domain = expression.domain
          substituted[index] = replaced

    if substituted[0] == 'get' && substituted.domain == @
      path = @engine.getPath(substituted[1], substituted[2])
      @engine.console.row('vary', path, @[path])
      substituted = ['vary', @[path]]
      substituted.domain = expression.domain
      substituted.domain.watch null, path,  substituted

    return substituted

  provide: (solution, value) ->
    if solution instanceof Domain
      return @merge solution
    else
      if @domain
        return @engine.provide.call @, solution
      else
        return @engine.provide(solution)
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
        return object

      @engine.solve @displayName, (domain) ->
        for path, value of object
          domain.set undefined, path, value
      , @

    return

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
          @provide watcher.parent, watchers[index + 1], watchers[index + 2], meta, watcher.index, value
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

  constrain: (constraint) ->
    if constraint.paths
      for path in constraint.paths
        if typeof path == 'string'
          (@variables[path] ||= []).push(constraint)
        else
          path.counter = (path.counter || 0) + 1
          if path.counter == 1
            if @nullified && @nullified[path.name]
              delete @nullified[path.name]
            else
              (@added ||= {})[path.name] = 0

    if typeof (name = constraint[0]) == 'string'
      @[constraint[0]]?.apply(@, Array.prototype.slice.call(constraint, 1))
      return true

  unconstrain: (constraint, continuation) ->
    for path in constraint.paths
      if typeof path == 'string'
        if group = @variables[path]
          if (index = group.indexOf(constraint)) > -1
            group.splice(index, 1)
          unless group.length
            delete @variables[path]
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
      EngineDomain = engine[name] = () ->
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
      EngineDomain.prototype    = new EngineDomainWrapper(engine)
      EngineDomain.displayName  = name
      EngineDomain::displayName = name
      unless engine.prototype
        engine[name.toLowerCase()] = new engine[name]
    @

module.exports = Domain

