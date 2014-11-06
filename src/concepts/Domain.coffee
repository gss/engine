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
      unless @hasOwnProperty('values')
        @values       = {}
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
    unless (@hasOwnProperty('watchers') || @hasOwnProperty('paths'))
      unless @hasOwnProperty('values')
        @values      = {}
        
      if @MAYBE
        @paths       = {}
        @domains.push(@)
        @MAYBE     = undefined
      else
        @watchers    = {}
        @observers   = {}
        @objects     = {} if @structured

  unbypass: (path, result) ->
    if bypassers = @bypassers[path]
      for bypasser in bypassers
        for key of bypasser.variables
          delete @variables[key]
          if @updating.index > -1
            (result = @updating.effects ||= {})[key] = null
          else
            result = {}
            result[key] = null
            @updating.apply result
          break
      delete @bypassers[path]
    return result

  # Dont solve system with a single variable+constant constraint 
  bypass: (name, operation, continuation, scope) ->
    variable = operation.variables[name]
    parent = variable
    while parent != operation[1]
      break unless parent
      parent = parent.parent
    value = parent == operation[1] && operation[2] || operation[1]
    if typeof value != 'number'
      value = value.command.solve @, value, continuation, scope
      if typeof value != 'number'
        return
    result = {}
    result[name] = value
    
    if !@variables[name] || @variables[name].constraints?.length == 0
      (@bypassers[scope.key] ||= []).push operation
      @variables[name] = scope.key
    return result
  
  solve: (operation, continuation, scope, ascender, ascending) ->
    transacting = @transact()

    if typeof operation == 'object' && !operation.push
      if @domain == @engine
        @assumed.merge operation
      else
        @merge operation
    else if strategy = @strategy
      if (object = @[strategy]).solve
        result = object.solve.apply(object, arguments) || {}
      else
        result = @[strategy].apply(@, arguments)
    else
      result = @Command(operation).solve(@, operation, continuation || '', scope || @scope, ascender, ascending)

    if @constrained || @unconstrained
      commands = @validate.apply(@, arguments)
      @restruct()

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

  yield: (solution, value) ->
    if solution instanceof Domain
      return @merge solution
    else if @domain
      @engine.engine.yield solution
      return 
    else
      @engine.yield solution
      return 
    return true

  transact: ->
    @setup()
    unless @changes && @hasOwnProperty('changes')
      @changes = {}
      if @disconnected
        @mutations?.disconnect(true)

    

  commit: ->
    changes = @changes
    @changes = undefined
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
    if @updating
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
    if watchers = @watchers?[path]
      for watcher, index in watchers by 3
        break unless watcher
        if value?
          watcher.command.ascend(@, watcher, watchers[index + 1], watchers[index + 2], value, true)
        else
          watcher.command.patch(@, watcher, watchers[index + 1], watchers[index + 2])
                  
    return if @immutable

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


  restruct: () ->
    if @unconstrained
      for constraint in @unconstrained
        @removeConstraint(constraint)
        for path of constraint.operation.variables
          if variable = @variables[path]
            if !@hasConstraint(variable)
              @nullify(variable)
    if @constrained
      for constraint in @constrained
        @addConstraint(constraint)
    @constrained = []
    @unconstrained = undefined

  constrain: (constraint, operation, meta) ->

    if other = operation.command.fetch(@, operation)
      if other == constraint
        return

    constraint.operation = operation
    constraint.path = meta.key
    (@paths[constraint.path] ||= []).push(constraint)


    for path, op of operation.variables
      if variable = op.command
        if variable.suggest != undefined
          suggest = variable.suggest
          delete variable.suggest
          @suggest variable, suggest, 'require'
      if definition = @variables[path]
        (definition.constraints ||= []).push(constraint)
        
    (@constraints ||= []).push(constraint)
    (@constrained ||= []).push(constraint)
    if other
      @unconstrain(other)
  hasConstraint: (variable) ->
    for other in variable.constraints
      if @constraints.indexOf(other) > -1
        return true
    return


  unconstrain: (constraint, continuation, moving) ->
    index = @constraints.indexOf(constraint)
    @constraints.splice(index, 1)
    group = @paths[constraint.path]
    group.splice(group.indexOf(constraint, 1))
    if group.length == 0
      delete @paths[constraint.path]

    for path, op of constraint.operation.variables
      if object = @variables[path]
        if (i = object.constraints?.indexOf(constraint)) > -1
          object.constraints.splice(i, 1)

          if !@hasConstraint(object)
            @undeclare(object, moving)
            
              
    if (i = @constrained?.indexOf(constraint)) > -1
      @constrained.splice(i, 1)
    else
      (@unconstrained ||= []).push(constraint)


  declare: (name) ->
    unless variable = @variables[name]
      variable = @variables[name] = @variable(name)
    if @nullified && @nullified[name]
      delete @nullified[name]
    (@added ||= {})[name] = variable
    return variable

  undeclare: (variable, moving) ->
    if moving != 'reset'
      (@nullified ||= {})[variable.name] = variable
      if @added?[variable.name]
        delete @added[variable.name]
    if !moving && @values[variable.name] != undefined
      delete @variables[variable.name]

    delete @values[variable.name]
    @nullify(variable)
    @unedit(variable)



  reach: (constraints, groups) ->
    groups ||= []
    for constraint in constraints
      groupped = undefined
      vars = constraint.operation.variables
      
      for group in groups by -1
        for other in group
          others = other.operation.variables
          for path of vars
            if others[path]
              if groupped && groupped != group
                groupped.push.apply(groupped, group)
                groups.splice(groups.indexOf(group), 1)
              else
                groupped = group
              break
          if groups.indexOf(group) == -1
            break
      unless groupped
        groups.push(groupped = [])
      groupped.push(constraint)
    return groups

  validate: () ->
    if @constrained || @unconstrained
      groups = @reach(@constraints).sort (a, b) ->
        al = a.length
        bl = b.length
        return bl - al

      separated = groups.splice(1)
      commands = []
      if separated.length
        shift = 0
        for group, index in separated
          ops = []
          for constraint, index in group
            @unconstrain constraint, undefined, true
            if constraint.operation
              ops.push constraint.operation
          if ops.length
            commands.push ops

      if commands?.length
        if commands.length == 1
          commands = commands[0]
        args = arguments
        if args.length == 1
          args = args[0]
        if commands.length == args.length
          equal = true
          for arg, i in args
            if commands.indexOf(arg) == -1
              equal = false
              break
          if equal
            throw new Error 'Trying to separate what was just added. Means loop. '
        return @Operation.orphanize commands
        
  apply: (solution) ->
    result = {}
    for path, value of solution
      if !@nullified?[path] && path.charAt(0) != '%'
        result[path] = value

    if @added
      for path, variable of @added
        value = variable.value ? 0
        unless @values[path] == value
          if path.charAt(0) != '%'
            result[path] ?= value
            @values[path] = value
      @added = undefined
    if @nullified
      for path, variable of @nullified
        if path.charAt(0) != '%'
          result[path] = @assumed.values[path] ? @intrinsic?.values[path] ? null
        @nullify variable

      @nullified = undefined

    @merge result, true

    if @constraints?.length == 0
      if (index = @engine.domains.indexOf(@)) > -1
        @engine.domains.splice(index, 1)


    return result


  remove: ->
    for path in arguments
      if @observers
        for contd in @Continuation.getVariants(path)
          if observer = @observers[contd]
            while observer[0]
              @unwatch(observer[1], undefined, observer[0], contd, observer[2])
      
      if constraints = @paths?[path]
        for constraint in constraints by -1
          @unconstrain(constraint, path)

      if @constrained
        for constraint in @constrained
          if constraint.path == path
            @unconstrain(constraint)
            break
    return

  export: ->
    if @constraints
      for constraint in @constraints when constraint.operation
        constraint.operation
      
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
      return id + '[' + property + ']'


  # Return domain that should be used to evaluate given variable
  getVariableDomain: (engine, operation) ->
    if operation.domain
      return operation.domain
    path = operation[1]
    if (i = path.indexOf('[')) > -1
      property = path.substring(i + 1, path.length - 1)
    
    intrinsic = engine.intrinsic
    if property && intrinsic?.properties[path]?
      domain = intrinsic
    else if property && intrinsic?.properties[property] && !intrinsic.properties[property].matcher
      domain = intrinsic
    else if engine.assumed.values.hasOwnProperty(path)
      domain = engine.assumed
    else if op = engine.variables[path]?.constraints?[0]?.operation
      domain = op.domain
    unless domain
      if property && (index = property.indexOf('-')) > -1
        prefix = property.substring(0, index)
        if (domain = engine[prefix])
          unless domain instanceof engine.Domain
            domain = undefined

      unless domain
        domain = @engine.linear.maybe()
    return domain
      

  # Make Domain class inherit given engine instance. Crazy huh
  # Overloads parts of the world (methods, variables, observers)
  @compile = (domains, engine) ->
    for own name, domain of domains
      continue if domain.condition?.call(engine) == false
      EngineDomain = engine[name] = (object) ->
        if object
          for property, value of object
            @values = {} unless @hasOwnProperty 'values'
            @values[property] = value

        @domain      = @

        unless @events == engine.events
          events = {}
          for property, value of @engine.events
            events[property] = value
          for property, value of @events
            events[property] = value
          @events = events
        
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

