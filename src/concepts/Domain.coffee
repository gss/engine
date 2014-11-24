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

Trigger = require('./Trigger')

class Domain extends Trigger
  priority: 0
  strategy: undefined

  constructor: (engine, url, values, name) ->
    if !engine || engine instanceof Domain
      @engine       = engine if engine
      @displayName  = name   if name
      @url          = url    if url
      @signatures   = new @Signatures(@)
      @merge(values)         if values
      super

      if @url && @getWorkerURL
        if @url && (@url = @getWorkerURL?(@url))
          if engine != @
            unless @useWorker(@url)
              @url = undefined

      return @
    else
      return @find.apply(@, arguments)

  setup: () ->
    return if @engine == @
      
    unless (@hasOwnProperty('watchers') || @hasOwnProperty('paths'))
      unless @hasOwnProperty('values')
        @values      = {}

      if @MAYBE
        @paths       = {}
        @MAYBE     = undefined
      else
        @watchers    = {}
        @observers   = {}
        @objects     = {} if @structured

  solve: (operation, continuation, scope, ascender, ascending) ->
    transacting = @transact()

    if typeof operation == 'object' && !operation.push
      if @domain == @engine
        result = @assumed.merge operation
      else
        result = @merge operation
    else if strategy = @strategy
      if (object = @[strategy]).solve
        result = object.solve.apply(object, arguments) || {}
      else
        result = @[strategy].apply(@, arguments)
    else
      result = @Command(operation).solve(@, operation, continuation || '', scope || @scope, ascender, ascending)

    if @constrained || @unconstrained
      commands = @Constraint::validate(@)
      @Constraint::reset(@)

      if commands == false
        if transacting
          return @commit()
        return

    unless typeof result == 'object'
      if result = @perform?.apply(@, arguments)
        result = @apply(result)

    if commands
      @engine.yield commands

    if transacting
      commited = @commit()

    return result || commited


  transact: ->
    @setup()
    unless @changes && @hasOwnProperty('changes')
      if @disconnected
        @mutations?.disconnect(true)
      @changes = {}


  commit: ->
    changes = @changes
    @changes = undefined
    if @disconnected
      @mutations?.connect(true)
    return changes

  watch: (object, property, operation, continuation, scope) ->
    @setup()
    path = @getPath(object, property)
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
          @onWatch?(id, prop)

    return @get(path)

  unwatch: (object, property, operation, continuation, scope) ->
    path = @getPath(object, property)
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
          old = obj[prop]
          delete obj[prop]
          if @updating
            @transact()
            @changes[path] = null
            unless @updating.domains.indexOf(@) > @updating.index
              @updating.apply(@changes)
          if @immediate
            @set path, null
          if Object.keys(obj).length == 0
            delete @objects[id]

  get: (object, property) ->
    return @values[@getPath(object, property)]

  merge: (object) ->
    # merge objects/domains
    if object && !object.push
      if object instanceof Domain
        return# object
      if @updating
        return @merger(object)
      else
        return @engine.solve @displayName || 'GSS', @merger, object, @

  merger: (object, domain = @) ->
    transacting = domain.transact()
        
    async = false
    for path, value of object
      domain.set undefined, path, value
    return domain.commit() if transacting

  # Set key-value pair or merge object
  set: (object, property, value) ->
    path = @getPath(object, property)
    old = @values[path]
    return if old == value

    @transact()
    @changes[path] = value ? null


    if value?
      @values[path] = value
    else
      delete @values[path]
    # notify subscribers
    if @updating
      @callback(path, value)
    else
      @engine.solve @displayName || 'GSS', (domain) ->
        domain.callback(path, value)
      , @

    return value


  callback: (path, value) ->

    # Notify watchers
    if watchers = @watchers?[path]
      for watcher, index in watchers by 3
        break unless watcher
        # Propagate updated value
        if value?
          watcher.command.ascend(@, watcher, watchers[index + 1], watchers[index + 2], value, true)
        # Remove propagated value and all around it
        else
          watcher.command.patch(@, watcher, watchers[index + 1], watchers[index + 2])
                  
    return if @immutable

    # Substitute variables
    if variable = @variables[path]
      for constraint in variable.constraints
        for operation in constraint.operations
          if op = operation.variables[path]
            if op.domain && op.domain.displayName != @displayName
              if !watchers || watchers.indexOf(op) == -1

                op.command.patch(op.domain, op, undefined, undefined, @)
                op.command.solve(@, op)
                console.error(123, op, path)

    # Notify workers
    if @workers
      for url, worker of @workers
        if values = worker.values
          if values.hasOwnProperty(path)
            unless value?
              delete worker.values[path]
            @update(worker, [['value', value, path]])

    #while (index = @updating.imports.indexOf(path)) > -1
    #if exports = @updating?.exports?[path]
    #  for domain in exports
    #    @update(domain, [['value', value, path]])
    return

  # Export values in a plain object. Use for tests only
  toObject: ->
    object = {}
    for own property, value of @
      if property != 'engine' && property != 'observers' && property != 'watchers' && property != 'values'
        object[property] = value
    return object



  add: (path, value) ->
    group = (@paths ||= {})[path] ||= []
    group.push(value)
    return

  prepare: (result = {}) ->

    nullified = @nullified
    replaced = @replaced
    if @declared
      for path, variable of @declared
        value = variable.value ? 0
        unless @values[path] == value
          if path.charAt(0) != '%'
            result[path] ?= value
            @values[path] = value
      @declared = undefined
    @replaced = undefined

    if nullified
      for path, variable of nullified
        if path.charAt(0) != '%'
          result[path] = @assumed.values[path] ? @intrinsic?.values[path] ? null
        @nullify variable
      @nullified = undefined

    return result


  apply: (solution) ->
    result = {}
    nullified = @nullified
    replaced = @replaced

    for path, value of solution
      if !nullified?[path] && !replaced?[path] && path.charAt(0) != '%'
        result[path] = value


    @merge(@prepare(result, nullified, replaced, @declared), true)

    if @constraints
      if @constraints?.length == 0
        if (index = @engine.domains.indexOf(@)) > -1
          @engine.domains.splice(index, 1)
      else 
        if @engine.domains.indexOf(@) == -1
          @engine.domains.push(@)

    return result


  remove: ->
    for path in arguments
      if @observers
        for contd in @Continuation.getVariants(path)
          if observer = @observers[contd]
            while observer[0]
              @unwatch(observer[1], undefined, observer[0], contd, observer[2])
      
      if operations = @paths?[path]
        for operation, i in operations by -1
          operation.command.remove(@, operation, path)

    return

  export: (strings) ->
    if @constraints
      operations = []
      for constraint in @constraints
        if ops = constraint.operations
          for operation in ops
            operations.push(operation.parent)
      return operations
      
  # Return a lazy that may later be promoted to a domain 
  maybe: () ->
    unless @Maybe
      Base = ->
      Base.prototype = @
      @Maybe = ->
      @Maybe.prototype = new Base
      @Maybe.prototype.MAYBE = @
      
    return new @Maybe

  getPath: (id, property) ->
    unless property
      property = id
      id = undefined
    if property.indexOf('[') > -1 || !id
      return property
    else
      if typeof id != 'string'
        if id.nodeType
          id = @identity.yield(id)
        else 
          id = id.path
      if id == @engine.scope?._gss_id && property.substring(0, 10) != 'intrinsic-'
        return property
      if id.substring(0, 2) == '$"'
        id = id.substring(1)
      return id + '[' + property + ']'


  # Return domain that should be used to evaluate given variable
  getVariableDomain: (engine, operation, Default) ->
    if operation.domain
      return operation.domain
    path = operation[1]
    if (i = path.indexOf('[')) > -1
      property = path.substring(i + 1, path.length - 1)
    
    if engine.assumed.values.hasOwnProperty(path)
      return engine.assumed
    else if property && (intrinsic = engine.intrinsic?.properties)
      if (intrinsic[path]? || (intrinsic[property] && !intrinsic[property].matcher))
        return engine.intrinsic
    
    if Default
      return Default
      
    if property && (index = property.indexOf('-')) > -1
      prefix = property.substring(0, index)
      if (domain = engine[prefix])
        if domain instanceof engine.Domain
          return domain

    if op = engine.variables[path]?.constraints?[0]?.operations[0]?.domain
      return op

    return @engine.linear.maybe()      

  yield: (solution, value) ->
    @engine.engine.yield solution

  # Make Domain class inherit given engine instance. Crazy huh
  # Overloads parts of the world (methods, variables, observers)
  @compile = (domains, engine) ->
    for own name, domain of domains
      continue if domain.condition?.call(engine) == false
      EngineDomain = engine[name] = (object) ->
        @values = {}
        
        if object
          for property, value of object
            @values = {} unless @hasOwnProperty 'values'
            @values[property] = value
        
        @Property.compile @Properties::, @
        Properties = @Properties
        @properties  = new (Properties || Object)

        return domain::constructor.call(@, engine)
        
      
      EngineDomainWrapper = ->
      EngineDomainWrapper.prototype = engine
      EngineDomain.prototype    = new EngineDomainWrapper
      for property, value of domain::
        EngineDomain::[property] = value
      EngineDomain::solve     ||= Domain::solve unless domain::solve
      EngineDomain::displayName = name
      EngineDomain.displayName  = name
      unless engine.prototype
        engine[name.toLowerCase()] = new engine[name]
    @

  DONE: 'solve'
  
module.exports = Domain

