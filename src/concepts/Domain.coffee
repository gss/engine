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

  constructor: (engine, url, values, name) ->
    if !engine || engine instanceof Domain
      @engine       = engine if engine
      @displayName  = name   if name
      @url          = url    if url
      @values       = {} unless @hasOwnProperty('values')
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

  setup: (hidden = @immutable) ->
    @variables   ||= {}
    @bypassers   ||= {}
    unless @hasOwnProperty('signatures')
      @Operation   = new @Operation.constructor(@) 
      @watchers    = {}
      @observers   = {}
      @paths       = {}
      @objects     = {} if @structured
      @substituted = []
      @constraints = []
      @values       = {} unless @hasOwnProperty('values')
      if !hidden && @domain != @engine
        if @domains.indexOf(@) == -1
          @domains.push(@)
      @MAYBE       = undefined

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
  bypass: (operation) ->
    name = undefined
    for prop, variable of operation.variables
      if variable.domain.displayName == @displayName
        return if name
        name = prop

    primitive = continuation = fallback = undefined
    for arg in operation
      if arg?.push
        if arg[0] == 'get'
          if continuation != undefined
            return
          continuation = arg[3] ? null
        else if arg[0] == 'value'
          fallback ?= arg[2]
          value = arg[1]
      else if typeof arg == 'number'
        primitive ?= arg

    unless value?
      value = primitive

    result = {}
    continuation ?= fallback
    result[name] = value
    
    if !@variables[name] || @variables[name].constraints?.length == 0
      (@bypassers[continuation] ||= []).push operation
      @variables[name] = continuation
    return result
  
  solve: (args) ->
    return unless args

    if @disconnected
      @mutations?.disconnect(true)

    if @MAYBE && arguments.length == 1 && typeof args[0] == 'string'
      if (result = @bypass(args))
        return result
        
    transacting = @transact()

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
    else
      result = @Command(operation).solve(@, operation, continuation, scope, ascending, ascender)

    if @constrained || @unconstrained
      commands = @validate.apply(@, arguments)
      @restruct()

      if commands == false
        if @disconnected
          @mutations?.connect(true)
        return

    if result = @perform?.apply(@, arguments)
      result = @apply(result)

    if commands
      @engine.provide commands

    if @disconnected
      @mutations?.connect(true)

    if transacting
      commited = @commit()

    return result || commited

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

  transact: ->
    @setup()
    unless @changes && @hasOwnProperty('changes')
      @changes = {}

  commit: ->
    changes = @changes
    @changes = undefined
    return changes

  watch: (object, property, operation, continuation, scope) ->
    @setup()
    path = @engine.Variable.getPath(object, property)
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
    path = @engine.Variable.getPath(object, property)
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
    return @values[@engine.Variable.getPath(object, property)]

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
    @setup()

    path = @engine.Variable.getPath(object, property)
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
      @engine.callback(@, path, value)
    else
      @engine.solve @displayName || 'GSS', (domain) ->
        @callback(domain, path, value)
      , @

    return value


  callback: (domain, path, value) ->
    if watchers = domain.watchers?[path]
      for watcher, index in watchers by 3
        break unless watcher
        if watcher.domain != domain || !value?
          # Re-evaluate expression
          if watcher.parent[watcher.index] != watcher
            watcher.parent[watcher.index] = watcher
          root = @Operation.ascend(watcher, domain)
          if root.parent.def?.domain
            @update([@[root.parent.def.domain]], [@Operation.sanitize(root)])
          else if value != undefined
            @update([@Operation.sanitize(root)])
        else
          if watcher.parent.domain == domain
            domain.solve watcher.parent, watchers[index + 1], watchers[index + 2] || undefined || undefined, watcher.index || undefined, value
          else
            @evaluator.ascend watcher, watchers[index + 1], value, watchers[index + 2]
  
    return if domain.immutable

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

    if (variable = @variables[path]) && domain.priority > 0
      frame = undefined
      if variable.constraints
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
              domain.evaluator.ascend op, undefined, value, undefined, undefined, op.index
              op.domain = d
            else
              @update(@Operation.sanitize(@Operation.ascend(op)))

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
        for path in constraint.paths
          if path.constraints
            if !@hasConstraint(path)
              @nullify(path)
    if @constrained
      for constraint in @constrained
        @addConstraint(constraint)
    @constrained = []
    @unconstrained = undefined

  resuggest: (a, b) ->
    if typeof a == 'object'
      return unless typeof b == 'object'
      if a[0] == 'value' && b[0] == 'value'
        return unless a[3] == b[3]
        if @suggest && @solver
          variable = a.parent.suggestions[a.index]
          if variable.suggest != b[1]
            @suggest a.parent.suggestions[a.index], b[1], 'require'
            return true
          else
            return 'skip'
      else
        result = undefined
        for value, index in a
          sub = @resuggest(value, b[index])
          result ||= sub
        return result

  compare: (a, b) ->
    if typeof a == 'object'
      return unless typeof b == 'object'
      if a[0] == 'value' && b[0] == 'value'
        return unless a[3] == b[3]
      else if a[0] == 'value' && b.toString() == a[3]
        return 'similar'
      else if b[0] == 'value' && a.toString() == b[3]
        return 'similar'
      else
        result = undefined
        for value, index in a
          sub = @compare(b[index], value)
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
      if compared != true || !(suggested = @resuggest(other.operation, constraint.operation))
        @unconstrain(other, undefined, 'reset')
        return
      else 
        return suggested != 'skip'
      #index = @constraints.indexOf(other)
      #stack = undefined

      #@resuggest(other)

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
              (constraint.substitutions ||= {})[@Variable.getPath(bits[1], bits[2])] = path[1]
          @substituted.push(constraint)
        else if @isVariable(path)
          if path.suggest != undefined
            suggest = path.suggest
            delete path.suggest
            @suggest path, suggest, 'require'

          length = (path.constraints ||= []).push(constraint)

    if typeof (name = constraint[0]) == 'string'
      @[constraint[0]]?.apply(@, Array.prototype.slice.call(constraint, 1))
      return true
    constraint.domain = @

    @constraints.push(constraint)
    (@constrained ||= []).push(constraint)

    #if stack
    #  @constraints.push.apply @constraints, stack
    #  for constraint in stack
    #    @addConstraint constraint

  hasConstraint: (path) ->
    used = false
    for other in path.constraints
      if @constraints.indexOf(other) > -1
        used = true
        break
    return used


  unconstrain: (constraint, continuation, moving) ->
    @constraints.splice(@constraints.indexOf(constraint), 1)
    
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
          path.suggest = path.value
          @unedit(path)
        index = path.constraints.indexOf(constraint)
        if index > -1
          path.constraints.splice(index, 1)
        if !@hasConstraint(path)
          @undeclare(path, moving)
        if path.operations
          for op, index in path.operations by -1
            while op
              if op == constraint.operation
                path.operations.splice(index, 1)
                break
              op = op.parent

    if (i = @constrained?.indexOf(constraint)) > -1
      @constrained.splice(i, 1)
    else
      (@unconstrained ||= []).push(constraint)


  declare: (name, operation) ->
    if name
      unless variable = @variables[name]
        variable = @variables[name] = @variable(name)
      if @nullified && @nullified[name]
        delete @nullified[name]
      (@added ||= {})[name] = variable
      if operation
        ops = variable.operations ||= []
        if ops.indexOf(operation)
          ops.push(operation)
    else
      variable = @variable('suggested_' + Math.random())
    return variable

  unedit: (variable) ->
    if variable.operation?.parent.suggestions?
      delete variable.operation.parent.suggestions[variable.operation.index]
    delete variable.editing

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
      if !@nullified?[path] && path.substring(0, 9) != 'suggested'
        result[path] = value

    if @added
      for path, variable of @added
        value = variable.value ? 0
        unless @values[path] == value
          result[path] ?= value
          @values[path] = value
      @added = undefined
    if @nullified
      for path, variable of @nullified
        if path.substring(0, 9) != 'suggested'
          result[path] = @assumed.values[path] ? @intrinsic?.values[path] ? null
        @nullify variable

      @nullified = undefined

    @merge result, true

    if @constraints.length == 0
      if (index = @engine.domains.indexOf(@)) > -1
        @engine.domains.splice(index, 1)


    return result


  remove: ->
    for path in arguments
      for contd in @Continuation.getVariants(path)
        if observers = @observers[contd]
          while observers[0]
            @unwatch(observers[1], undefined, observers[0], contd, observers[2])
      
      if constraints = @paths[path]
        for constraint in constraints by -1
          if @isConstraint(constraint)
            @unconstrain(constraint, path)

      if @constrained
        for constraint in @constrained
          if constraint.paths.indexOf(path) > -1
            @unconstrain(constraint)
            break
    return

  export: ->
    for constraint in @constraints when constraint.operation
      constraint.operation
      
  # Return a lazy that may later be promoted to a domain 
  maybe: () ->
    unless @Maybe
      Base = ->
      Base.prototype = @
      @Maybe = ->
      @Maybe.prototype = new Base
      @Maybe.MAYBE = @
      
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
          events = {}
          for property, value of @engine.events
            events[property] = value
          for property, value of @events
            events[property] = value
          @events = events
        
        @Property.compile @Properties::, @
        Properties = @Properties
        @properties  = new (Properties || Object)

        return Domain::constructor.call(@, engine)
        
      
      EngineDomainWrapper = ->
      EngineDomainWrapper.prototype = engine
      EngineDomain.prototype    = new EngineDomainWrapper
      for property, value of domain
        EngineDomain::[property] = value
      EngineDomain::solve     ||= Domain::solve unless domain::solve
      EngineDomain::displayName = name
      EngineDomain.displayName  = name
      unless engine.prototype
        engine[name.toLowerCase()] = new engine[name]
    @

  DONE: 'solve'
  
module.exports = Domain

