### Domain: Observed values
Acts as input values for equations.

Interface:

  - (un)watch() - (un)subscribe expression to property updates
  - set()       - dispatches updates to subscribed expressions
  - get()       - retrieve value
  - remove()    - detach observes by continuation


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
      @engine       = engine if engine
      @displayName  = name   if name
      @url          = url    if url
      @values       = {} unless @hasOwnProperty('values')
      @merge(values)         if values

      if @url && @getWorkerURL
        if @url = @getWorkerURL(@url)
          if engine != @
            @useWorker(@url)

      return @
    else
      return @find.apply(@, arguments)

  setup: ->
    @variables   ||= {}
    unless @hasOwnProperty('watchers')
      @expressions = new @Expressions(@) 
      @watchers    = {}
      @observers   = {}
      @paths       = {}
      @objects     = {} if @structured
      @substituted = []
      @constraints = []
      @values       = {} unless @hasOwnProperty('values')
      @engine.domains ||= []
      unless @domain == @engine
        @domains.push(@)
      @MAYBE       = undefined



  solve: (args) ->
    return unless args


    @setup()

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

    return result

  provide: (solution, value) ->
    if solution instanceof Domain
      return @merge solution
    else if @domain
      return @engine.engine.provide solution
    else
      return @engine.provide solution
    return true


  watch: (object, property, operation, continuation, scope) ->
    path = @engine.getPath(object, property)
    if @engine.indexOfTriplet(@watchers[path], operation, continuation, scope) == -1
      observers = @observers[continuation] ||= []
      observers.push(operation, path, scope)

      watchers = @watchers[path] ||= []
      watchers.push(operation, continuation, scope)

      # Register props by id for quick lookup
      if @structured && watchers.length == 3
        if (j = path.indexOf('[')) > -1
          id = path.substring(0, j)
          obj = @objects[id] ||= {}
          prop = path.substring(j + 1, path.length - 1)
          obj[prop] = true
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
    unless watchers.length
      delete @watchers[path]
      if @structured
        if (j = path.indexOf('[')) > -1
          id = path.substring(0, j)
          obj = @objects[id] ||= {}
          prop = path.substring(j + 1, path.length - 1)
          delete obj[prop]

  get: (object, property) ->
    return @values[@engine.getPath(object, property)]

  merge: (object, meta) ->
    # merge objects/domains
    if object && !object.push
      if object instanceof Domain
        return# object
      if @workflow
        return @merger(object, meta)
      else
        return @engine.solve @displayName || 'GSS', @merger, object, meta, @

  merger: (object, meta, domain = @) ->
    async = false
    for path, value of object
      domain.set undefined, path, value, meta

  # Set key-value pair or merge object
  set: (object, property, value, meta) ->
    @setup()

    path = @engine.getPath(object, property)
    old = @values[path]
    return if old == value

    if value?
      @values[path] = value
    else
      delete @values[path]
    # notify subscribers
    if @workflow
      @engine.callback(@, path, value, meta)
    else
      @engine.solve @displayName || 'GSS', (domain) ->
        @callback(domain, path, value, meta)
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

  orphanize: (operation) ->
    if operation.domain
      delete operation.domain
    for arg in operation
      if arg.push
        @orphanize arg
    operation

  callback: (domain, path, value, meta) ->
    if watchers = domain.watchers?[path]
      for watcher, index in watchers by 3
        break unless watcher
        if watcher.domain != domain || !value?
          # Re-evaluate expression
          @Workflow(@sanitize(@getRootOperation(watcher)))
        else
          if watcher.parent.domain == domain
            domain.solve watcher.parent, watchers[index + 1], watchers[index + 2] || undefined, meta || undefined, watcher.index || undefined, value
          else
            @expressions.ascend watcher, watchers[index + 1], value, watchers[index + 2], meta
          
    if @workers
      for url, worker of @workers
        if values = worker.values
          if values.hasOwnProperty(path)
            @Workflow(worker, [['value', value, path]])
            console.error(path, @workflow)
    if exports = @workflow?.exports?[path]
      for domain in exports
        @Workflow(domain, [['value', value, path]])
    if variable = @variables[path]
      for op in variable.operations
        if !watchers || watchers.indexOf(op) == -1
          if value == null
            while op.domain == @
              op = op.parent
          @Workflow(@sanitize(@getRootOperation(op)))

    return

  # Export values in a plain object. Use for tests only
  toObject: ->
    object = {}
    for own property, value of @
      if property != 'engine' && property != 'observers' && property != 'watchers' && property != 'values'
        object[property] = value
    return object

  compare: (a, b, mutate) ->
    if a != b
      if typeof a == 'object'
        return unless typeof b == 'object'
        if a[0] == 'value' && b[0] == 'value'
          return unless a[3] == b[3]
        else if a[0] == 'value'
          return a[3] == b.toString()
        else if b[0] == 'value'
          return b[3] == a.toString()
        else 
          for value, index in a
            return unless @compare(b[index], value)
          return unless b[a.length] == a[a.length]
      else
        return if typeof b == 'object'
    return true

  reconstrain: (other, constraint) ->
    if @compare(other.operation, constraint.operation)
      console.info('updating constraint', other.operation, '->', constraint.operation)
      @unconstrain(other)


  constrain: (constraint) ->
    console.info(constraint, JSON.stringify(constraint.operation), @constraints, constraint.paths, @substituted)
    if constraint.paths
      for path in constraint.paths
        if path[0] == 'value'
          for other in @constraints by -1
            @reconstrain other, constraint
      for other in @substituted by -1
        @reconstrain other, constraint

      for path in constraint.paths
        if typeof path == 'string'
          (@paths[path] ||= []).push(constraint)
        else if path[0] == 'value'
          if path[3]
            bits = path[3].split(',')
            if bits[0] == 'get'
              (constraint.substitutions ||= {})[@getPath(bits[1], bits[2])] = path[1]
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

    @constrained = true
    @constraints.splice(@constraints.indexOf(constraint), 1)
    return

  declare: (name, operation) ->
    variable = @variables[name] ||= value ? @variable(name)
    if operation
      ops = variable.operations ||= []
      if ops.indexOf(operation)
        ops.push(operation)
    return variable

  undeclare: (variable) ->
    delete @variables[variable.name]
    (@nullified ||= {})[variable.name] = true
    return

  reach: (constraints, groups) ->
    groups ||= []
    for constraint in constraints
      groupped = undefined
      if constraint.paths
        for group in groups by -1
          for other in group
            for variable in other.paths
              if typeof variable != 'string'
                if constraint.paths.indexOf(variable) > -1
                  if groupped && groupped != group
                    groupped.push.apply(groupped, group)
                    groups.splice(group.indexOf(group), 1)
                  else
                    groupped = group
                  break
            if groups.indexOf(group) == -1
              break
      unless groupped
        groups.push(groupped = [])
      groupped.push(constraint)
    return groups


  apply: (solution) ->
    if @constrained
      groups = @reach(@constraints).sort (a, b) ->
        return a.length - b.length
      separated = groups.splice(1)
      if separated.length
        for group in separated
          for constraint, index in group
            @unconstrain constraint
            group[index] = constraint.operation



      if @constraints.length == 0
        if (index = @engine.domains.indexOf(@)) > -1
          @engine.domains.splice(index, 1)

          
    @constrained = undefined

    result = {}
    console.log(@constrained, @nullified, @added)
    for path, value of solution
      unless @nullified?[path]
        result[path] = value
        @values[path] = value
    if @nullified
      for path of @nullified
        result[path] = @assumed.values[path] ? @intrinsic?.values[path] ? null
        if @values.hasOwnProperty(path)
          delete @values[path]
      @nullified = undefined
    if @added
      for path of @added
        result[path] ?= 0
        @values[path] ?= 0
      @added = undefined
    if separated?.length
      if separated.length == 1
        separated = separated[0]
      @engine.provide @orphanize separated
    console.log 'provide', result
    return result


  remove: ->
    for path in arguments
      for contd in @getPossibleContinuations(path)
        if observers = @observers[contd]
          while observers[0]
            @unwatch(observers[1], undefined, observers[0], contd, observers[2])
      
      if constraints = @paths[path]
        for constraint in constraints by -1
          if @isConstraint(constraint)
            @unconstrain(constraint, path)
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


  export: ->
    debugger
    for constraint in @constraints
      constraint.operation



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
            @values = {} unless @hasOwnProperty 'values'
            @values[property] = value

        @domain      = @

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

class Domain::Methods
  value: (value) ->
    return value

  framed: (value) ->
    return value

  
module.exports = Domain

