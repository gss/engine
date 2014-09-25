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
        if @url && (@url = @getWorkerURL?(@url))
          if engine != @
            @useWorker(@url)

      return @
    else
      return @find.apply(@, arguments)

  setup: (hidden = @immutable) ->
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
      if !hidden && @domain != @engine
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
        result = object.solve.apply(object, arguments) || {}
      else
        result = @[strategy].apply(@, arguments)

    return result

  provide: (solution, value) ->
    if solution instanceof Domain
      return @merge solution
    else if @domain
      @engine.engine.provide solution
      return 
    else
      @engine.provide solution
      return 
    return true


  watch: (object, property, operation, continuation, scope) ->
    @setup()
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
          @set path, null
          if Object.keys(obj).length == 0
            delete @objects[id]

  get: (object, property) ->
    return @values[@engine.getPath(object, property)]

  merge: (object, meta) ->
    # merge objects/domains
    if object && !object.push
      if object instanceof Domain
        return# object
      if @updating
        return @merger(object, meta)
      else
        return @engine.solve @displayName || 'GSS', @merger, object, meta, @

  merger: (object, meta, domain = @) ->
    async = false
    for path, value of object
      domain.set undefined, path, value, meta
    return

  # Set key-value pair or merge object
  set: (object, property, value, meta) ->
    @setup()

    path = @engine.getPath(object, property)
    old = @values[path]
    return if old == value
    if @changes
      @changes[path] = value ? null
    else if @immediate
      @solved.set null, path, value


    if value?
      @values[path] = value
    else
      delete @values[path]
    # notify subscribers
    if @updating
      @engine.callback(@, path, value, meta)
    else
      @engine.solve @displayName || 'GSS', (domain) ->
        @callback(domain, path, value, meta)
      , @

    return value

  sanitize: (exps, soft, parent = exps.parent, index = exps.index) ->
    if exps[0] == 'value' && exps.operation
      return parent[index] = @sanitize exps.operation, soft, parent, index
    for own prop, value of exps
      unless isFinite(parseInt(prop))
        delete exps[prop]
    for exp, i in exps
      if exp?.push
        @sanitize exp, soft, exps, i
    exps.parent = parent
    exps.index  = index
    exps

  orphanize: (operation) ->
    if operation.domain
      delete operation.domain
    for arg in operation
      if arg?.push
        @orphanize arg
    operation

  callback: (domain, path, value, meta) ->
    unless meta == true
      if watchers = domain.watchers?[path]
        for watcher, index in watchers by 3
          break unless watcher
          if watcher.domain != domain || !value?
            # Re-evaluate expression
            @update([@sanitize(@getRootOperation(watcher, domain))])
          else
            if watcher.parent.domain == domain
              domain.solve watcher.parent, watchers[index + 1], watchers[index + 2] || undefined, meta || undefined, watcher.index || undefined, value
            else
              @expressions.ascend watcher, watchers[index + 1], value, watchers[index + 2], meta
    
    return if domain.immutable

    if @workers
      for url, worker of @workers
        if values = worker.values
          if values.hasOwnProperty(path)
            @update(worker, [['value', value, path]])

    #while (index = @updating.imports.indexOf(path)) > -1
    #if exports = @updating?.exports?[path]
    #  for domain in exports
    #    @update(domain, [['value', value, path]])

    if variable = @variables[path]
      frame = undefined
      for constraint in variable.constraints
        if frame = constraint.domain.frame
          break
      for op in variable.operations
        if !watchers || watchers.indexOf(op) == -1
          if value == null
            while op.domain == domain
              op = op.parent
          if op && op.domain != domain
            if frame
              d = op.domain
              op.domain = domain
              domain.expressions.ascend op, undefined, value, undefined, undefined, op.index
              op.domain = d
            else
              @update(@sanitize(@getRootOperation(op)))

    return

  # Export values in a plain object. Use for tests only
  toObject: ->
    object = {}
    for own property, value of @
      if property != 'engine' && property != 'observers' && property != 'watchers' && property != 'values'
        object[property] = value
    return object

  compare: (a, b, mutation) ->
    #if a != b
    if typeof a == 'object'
      return unless typeof b == 'object'
      if a[0] == 'value' && b[0] == 'value'
        return unless a[3] == b[3]
        if mutation && @suggest && @solver
          @suggest a.parent.suggestions[a.index], b[1], 'require'

          return true
      else if a[0] == 'value'
        return 'similar' if a[3] == b.toString()
        return false
      else if b[0] == 'value'
        return 'similar' if b[3] == a.toString()
        return false
      else 
        result = undefined
        for value, index in a
          sub = @compare(b[index], value, mutation)
          if sub != true || !result? || result == true
            result = sub ? false
          else
            result = false
        return unless b[a.length] == a[a.length]
        return result
    else
      return if typeof b == 'object'
      return a == b
    return true

  reconstrain: (other, constraint) ->
    return unless other.operation && constraint.operation
    if compared = @compare(other.operation, constraint.operation)
      if compared == true
        @compare(other.operation, constraint.operation, true)
      else
        @unconstrain(other)

      #index = @constraints.indexOf(other)
      #stack = undefined

      #@resuggest(other)

      return true

      #stack = @constraints.splice(index)
      #if stack.length
      #  for constraint in stack
      #    @removeConstraint constraint
      #  return stack


  constrain: (constraint) ->
    if constraint.paths
      stack = undefined
      for path in constraint.paths
        if path[0] == 'value'
          for other, i in @constraints by -1
            unless other == constraint
              if stack = @reconstrain other, constraint
                break

      unless stack?
        for other, i in @substituted by -1
          unless other == constraint
            if stack = @reconstrain other, constraint
              break

      return if stack

      for path in constraint.paths
        if typeof path == 'string'
          (@paths[path] ||= []).push(constraint)
        else if path[0] == 'value'
          if path[3]
            bits = path[3].split(',')
            if bits[0] == 'get'
              (constraint.substitutions ||= {})[@getPath(bits[1], bits[2])] = path[1]
          @substituted.push(constraint)
        else if @isVariable(path)
          if path.suggest != undefined
            suggest = path.suggest
            delete path.suggest
            @suggest path, suggest, 'require'
          if @nullified
            delete @nullified[path.name]
          length = (path.constraints ||= []).push(constraint)

    if typeof (name = constraint[0]) == 'string'
      @[constraint[0]]?.apply(@, Array.prototype.slice.call(constraint, 1))
      return true
    constraint.domain = @
    @constraints.push(constraint)
    @constrained = true
    
    @addConstraint(constraint)

    #if stack
    #  @constraints.push.apply @constraints, stack
    #  for constraint in stack
    #    @addConstraint constraint

  unconstrain: (constraint, continuation) ->
    for path in constraint.paths
      if typeof path == 'string'
        if group = @paths[path]
          for other, index in group by -1
            if other == constraint
              group.splice(index, 1)
          unless group.length
            delete @paths[path]
      else if path[0] == 'value'
        @substituted.splice(@substituted.indexOf(constraint))
      else
        if path.editing
          path.editing.removed = true
          delete path.editing
        index = path.constraints.indexOf(constraint)
        if index > -1
          path.constraints.splice(index, 1)
          unless path.constraints.length
            @undeclare(path)
        if path.operations
          for op, index in path.operations by -1
            while op
              if op == constraint.operation
                path.operations.splice(index, 1)
                break
              op = op.parent

    @constrained = true
    @constraints.splice(@constraints.indexOf(constraint), 1)
    unless constraint.removed
      @removeConstraint(constraint)


  declare: (name, operation) ->
    if name
      unless variable = @variables[name]
        variable = @variables[name] = @variable(name)

      if @nullified && @nullified[name]
        delete @nullified[name]
      (@added ||= {})[name] = variable
    else
      variable = @variable('suggested_' + Math.random())
    if operation
      ops = variable.operations ||= []
      if ops.indexOf(operation)
        ops.push(operation)
    return variable

  undeclare: (variable) ->
    (@nullified ||= {})[variable.name] = variable

  reach: (constraints, groups) ->
    groups ||= []
    for constraint in constraints
      groupped = undefined
      if constraint.paths
        for group in groups by -1
          for other in group
            if other.paths
              for variable in other.paths
                if typeof variable != 'string'
                  if constraint.paths.indexOf(variable) > -1
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

  nullify: ->


  apply: (solution) ->
    if @constrained
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
            @unconstrain constraint
            if constraint.operation
              ops.push constraint.operation
          if ops.length
            commands.push ops



      if @constraints.length == 0
        if (index = @engine.domains.indexOf(@)) > -1
          
          @engine.domains.splice(index, 1)


    @constrained = undefined
    result = {}
    for path, value of solution
      if !@nullified?[path] && path.substring(0, 9) != 'suggested'
        result[path] = value

    @merge result, true

    if @nullified
      for path, variable of @nullified
        if path.substring(0, 9) != 'suggested'
          result[path] = @assumed.values[path] ? @intrinsic?.values[path] ? null
        if @values.hasOwnProperty(path)
          delete @values[path]
        @nullify(variable)
        delete @variables[path]


      @nullified = undefined
    if @added
      for path, variable of @added
        value = variable.value ? 0
        unless @values[path] == value
          result[path] ?= value
          @values[path] = value
      @added = undefined
    if commands?.length
      if commands.length == 1
        commands = commands[0]
      @engine.provide @orphanize commands
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
    return

  # Schedule execution of expressions to the next tick, buffer input
  defer: (reason) ->
    if @solve.apply(@, arguments)
      @deferred ?= Native::setImmediate( =>
        @deferred = undefined
        @flush()
      , 0)


  export: ->
    for constraint in @constraints when constraint.operation
      constraint.operation



  maybe: () ->
    @Maybe ||= Native::mixin(@, MAYBE: @)
    return new @Maybe

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
          @addListeners(@events)
          @events    = new (Native::mixin(@engine.events))

        @Wrapper.compile @Methods::, @ if @Wrapper

        @Method.compile  @Methods::, @
        Methods = @Methods
        @methods = new Methods

        @Property.compile @Properties::, @
        Properties = @Properties
        @properties  = new (Properties || Object)

        return Domain::constructor.call(@, engine)

      EngineDomainWrapper       = engine.mixin(engine, domain)
      EngineDomain.prototype    = new EngineDomainWrapper
      EngineDomain::solve     ||= Domain::solve unless domain::solve
      EngineDomain::strategy    = 'expressions'
      EngineDomain::displayName = name
      EngineDomain.displayName  = name
      unless engine.prototype
        engine[name.toLowerCase()] = new engine[name]
    @

  DONE: 'solve'

class Domain::Methods
  value: 
    command: (operation, continuation, scope, meta, value, contd, hash, exported, scoped) ->
      if @suggest && @solver
        variable = (operation.parent.suggestions ||= {})[operation.index]
        unless variable
          Domain::Methods.uids ||= 0
          uid = ++Domain::Methods.uids
          variable = operation.parent.suggestions[operation.index] ||= @declare(null, operation)
        #if variable.value != value
        variable.suggest = value
        return variable

      if !continuation && contd
        return @expressions.solve operation.parent, contd, @identity.solve(scoped), meta, operation.index, value
      return value

  framed: (value) ->
    return value

  
module.exports = Domain

