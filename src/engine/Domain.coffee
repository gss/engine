### Domain: Observable object. 

Has 3 use cases:

1) Base  

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


class Domain
  strategy: undefined

  constructor: (values) ->
    @signatures = {}
    @merge(values) if values

    if @url
      @useWorker(@url)

    if @events != @engine.events
      @addListeners(@events)

    if @Properties
      @properties  = new @Properties(@)
      @Property.compile @properties, @
    else
      @properties = {}
    return @

  # Sub-constructor for graph wrappers
  setup: () ->
    unless @hasOwnProperty('values')
      @values = {}
      @construct()      

  construct: ->
    @watchers = {}
    @watched  = {}

  # Main method to execute any kind of operations in the domain
  solve: (operation, continuation, scope, ascender, ascending) ->
    transacting = @transact()
    if typeof operation == 'object'
      # Dispatch and solve operation
      if operation instanceof Array
        result = @Command(operation).solve(@, operation, continuation || '', scope || @scope, ascender, ascending)
      
      # Suggested solution is dispatched through data domain
      else
        result = @data.merge operation
   
    if @constrained || @unconstrained
      # Find constraints that are independent from the graph
      commands = @Constraint::split(@)

      # Apply and remove constraints
      @Constraint::reset(@)

    # Perform optional step to produce solution out of commands
    unless typeof result == 'object'
      if result = @perform?.apply(@, arguments)
        result = @apply(result)

    # Add separated commands back to queue
    if commands
      @update commands

    # Finish process
    if transacting
      commited = @commit()


    return result || commited

  # Listen to value changes
  watch: (object, property, operation, continuation, scope) ->
    @setup()
    path = @getPath(object, property)
    value =  @get(path)
    if @indexOfTriplet(@watchers[path], operation, continuation, scope) == -1
      observers = @watched[continuation] ||= []
      observers.push(operation, path, scope)

      watchers = @watchers[path] ||= []
      watchers.push(operation, continuation, scope)

      
      # Register props by id for quick lookup
      if @subscribe && watchers.length == 3
        if (j = path.indexOf('[')) > -1
          id = path.substring(0, j)
          obj = (@subscribers ||= {})[id] ||= {}
          prop = path.substring(j + 1, path.length - 1)
          obj[prop] = true
          @subscribe(id, prop, path)

    return value
    
  unwatch: (object, property, operation, continuation, scope) ->
    path = @getPath(object, property)
    observers = @watched[continuation]
    index = @indexOfTriplet observers, operation, path, scope
    observers.splice index, 3
    delete @watched[continuation] unless observers.length

    watchers = @watchers[path]
    index = @indexOfTriplet watchers, operation, continuation, scope
    watchers.splice index, 3
    unless watchers.length
      delete @watchers[path]
      if @subscribe
        if (j = path.indexOf('[')) > -1
          id = path.substring(0, j)
          obj = @subscribers[id] ||= {}
          prop = path.substring(j + 1, path.length - 1)
          old = obj[prop]
          delete obj[prop]
          if @updating
            @transact()
            @changes[path] = null
            unless @updating.domains.indexOf(@) > @updating.index
              @updating.apply(@changes)
          @unsubscribe(id, prop, path)
          unless Object.keys(obj).length
            delete @subscribers[id]
            unless Object.keys(@subscribers).length
              @subscribers = undefined

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
        command = watcher.command
        if command.deferred
          @Query::defer(@, watcher, watchers[index + 1], watchers[index + 2])
        else if value?
          watcher.command.solve(@, watcher, watchers[index + 1], watchers[index + 2], true)
        # Remove propagated value and re-match expressions around it
        else
          watcher.command.patch(@, watcher, watchers[index + 1], watchers[index + 2])
                  
    return if @immutable

    # Suggest or remove suggestions for previously added constraints
    if !(@ instanceof @Solver) && variable = @variables[path]
      for constraint in variable.constraints
        for operation in constraint.operations
          if op = operation.variables[path]
            if op.domain && op.domain.displayName != @displayName
              if !watchers || watchers.indexOf(op) == -1
                op.command.patch(op.domain, op, undefined, undefined, @)
                op.command.solve(@, op)

    # Suggest value to workers
    if workers = @workers
      for url, worker of workers
        if values = worker.values
          if values.hasOwnProperty(path)
            @updating.push([['value', path, value ? null]], worker)

    return

  # Export values in a plain object. Use for tests only
  toObject: ->
    object = {}
    for own property, value of @
      if property != 'engine' && property != 'observers' && property != 'watchers' && property != 'values'
        object[property] = value
    return object

  # Generate signature lookup tables for commands provided by domain
  compile: ->
    @Command.compile @

  # Observe path so when it's cleaned, command's remove method is invoked
  add: (path, value) ->
    group = (@paths ||= {})[path] ||= []
    group.push(value)
    return

  # Transform solution values to reflect reconfigured constraints
  transform: (result = {}) ->
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
          result[path] = @data.values[path] ? null
        @nullify variable
      @nullified = undefined

    return result

  # Merge solution and trigger callbacks
  apply: (solution) ->
    result = {}
    nullified = @nullified
    replaced = @replaced

    for path, value of solution
      if !nullified?[path] && !replaced?[path] && path.charAt(0) != '%'
        result[path] = value

    result = @transform(result)
    @merge(result, true)

    return result

  register: (constraints = @constraints) ->
    domains = @engine.domains
    if constraints?.length
      if domains.indexOf(@) == -1
        domains.push(@)
    else
      if (index = domains.indexOf(@)) > -1
        domains.splice(index, 1)


  # Remove watchers and registered operations by path
  remove: ->
    for path in arguments
      if @watched
        for contd in @Query::getVariants(path) || [path]
          if observer = @watched[contd]
            while observer[0]
              @unwatch(observer[1], undefined, observer[0], contd, observer[2])
      
      if operations = @paths?[path]
        for operation, i in operations by -1
          operation.command.remove(@, operation, path)

    return

  # Return an array of operations that makes the constraint set
  export: (constraints) ->
    if constraints ||= @constraints
      operations = []
      for constraint in constraints
        if ops = constraint.operations
          for operation in ops
            operations.push(operation.parent)
      return operations
  
  # Prepare domain to be consumed by another  
  transfer: (update, parent) ->
    # Apply removes from parent update
    if parent
      parent.perform(@)
    if update
      update.perform(@)
            
    # Apply removes from global update
    @updating.perform(@)

    # Reconfigure solver to release removed constraints
    if @unconstrained
      @Constraint::reset(@)
      @register()

    if @nullified
      solution = {}
      for prop of @nullified
        (solution ||= {})[prop] = null
      @updating.apply solution 

  # Return a lazy that may later be promoted to a domain 
  maybe: () ->
    unless @Maybe
      Base = ->
      Base.prototype = @
      @Maybe = ->
      @Maybe.prototype = new Base
      
    return new @Maybe

  # Set a flag to record all changed values
  transact: ->
    unless @changes
      @setup()
      return @changes = {}

  # Unset transaction flag and return changes
  commit: ->
    if changes = @changes
      if @ instanceof @Solver
        @register()
      @changes = undefined
      for prop of changes
        return changes
      return

  # Make Domain class inherit given engine instance
  # Allows domain to overload engine methods and modules
  @compile: (engine) ->
    for name, domain of engine
      if domain.prototype && domain.prototype instanceof Domain
        EngineDomain = engine[name] = (values) ->
          return domain::constructor.call(@, undefined, undefined, values)
      
        EngineDomainWrapper = ->
        EngineDomainWrapper.prototype = engine
        EngineDomain.prototype        = new EngineDomainWrapper
        EngineDomain::engine = engine
        EngineDomain::displayName = name
        for property, value of domain::
          EngineDomain::[property] = value
        engine[name.toLowerCase()] = new EngineDomain()
    @

  # Create flat dictionary of property handlers from nested objects
  # or generates css-like property families from array definitions
  Property: (property, reference, properties) ->
    if typeof property == 'object'
      if property.push
        return properties[reference] = @Style(property, reference, properties)
      else
        for key, value of property
          if (index = reference.indexOf('[')) > -1
            path = reference.replace(']', '-' + key + ']')
            left = reference.substring(0, index)
            right = path.substring(index + 1, path.length - 1)
            properties[left][right] ||= @Property(value, path, properties)
          else if reference.match(/^[a-z]/i) 
            path = reference + '-' + key
          else
            path = reference + '[' + key + ']'
          properties[path] = @Property(value, path, properties)
    return property

  # Compile own properties
  Domain::Property.compile = (properties, engine) ->
    for key, property of properties
      continue if key == 'engine'
      @call(engine, property, key, properties)
    return properties
  
module.exports = Domain

