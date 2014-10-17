# Operation is a command represented with a plain array
# Can be either variable, a list of tokens, or function call


class Operation
  constructor: (engine) ->
    unless engine
      return Array.prototype.slice.call(arguments)
    else if @engine
      return new Operation(engine)
    @engine = engine
    @CleanupSelectorRegExp = new RegExp(@engine.Continuation.DESCEND + '::this', 'g')

  sanitize: (exps, soft, parent = exps.parent, index = exps.index) ->
    if exps[0] == 'value' && exps.operation
      return parent[index] = @sanitize exps.operation, soft, parent, index
    for own prop, value of exps
      unless isFinite(parseInt(prop))
        unless prop == 'variables'
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


  # Return element that is used as a context for given DOM operation
  getContext: (operation, args, scope, node) ->
    index = args[0].def && 4 || 0
    if (args.length != index && (args[index]?.nodeType))
      return args[index]
    if !operation.bound
      if (operation.def.serialized && operation[1].def && args[index]?)
        return args[index]
      return @engine.scope
    return scope

  getDomain: (operation, domain) ->
    if typeof operation[0] == 'string'
      if !domain.methods[operation[0]]
        return @engine.linear.maybe()
      for arg in operation
        if arg.domain && arg.domain.priority > domain.priority && arg.domain < 0
          return arg.domain
    return domain

  # get topmost meaniningful function call with matching domain
  ascend: (operation, domain = operation.domain) ->
    parent = operation
    while parent.parent &&  typeof parent.parent[0] == 'string' && 
          (!parent.parent.def || 
                              (!parent.parent.def.noop && 
                              parent.domain == domain))
      parent = parent.parent
    while parent.parent?.domain == parent.domain
      parent = parent.parent
    return parent


  getRoot: (operation) ->
    while !operation.def.noop
      operation = operation.parent
    return operation

  # Return path for given operation
  getPath: (operation, continuation, scope) ->
    if continuation?
      if operation.def.serialized && !operation.def.hidden
        if operation.marked && operation.arity == 2
          path = continuation + operation.path
        else
          path = continuation + (operation.key || operation.path)
      else
        path = continuation
    else
      path = operation.path
    return path


  # Return shared absolute path of a dom query ($id selector) 
  getQueryPath: (operation, continuation) ->
    if continuation
      if continuation.nodeType
        return @engine.identity.provide(continuation) + ' ' + operation.path
      else if operation.marked && operation.arity == 2
        return continuation + operation.path
      else
        return continuation + (operation.key || operation.path)
    else
      return operation.key



  getSolution: (operation, continuation, scope) ->
    if operation.def.serialized && (!operation.def.hidden || operation.parent.def.serialized)
      return @engine.pairs.getSolution(operation, continuation, scope)

  getSelectors: (operation) ->
      parent = operation
      results = wrapped = custom = undefined

      # Iterate rules
      while parent

        # Append condition id to path
        if parent.name == 'if'
          if parent.uid
            if results
              for result, index in results
                if result.substring(0, 11) != '[matches~="'
                  result = @getCustomSelector(result)
                results[index] = result.substring(0, 11) + parent.uid + @engine.Continuation.DESCEND + result.substring(11)
        
        # Add rule selector to path
        else if parent.name == 'rule'
          selectors = parent[1].path

          if parent[1][0] == ','
            paths = parent[1].slice(1).map (item) -> 
              return !item.marked && item.groupped || item.path
          else
            paths = [parent[1].path]

          groups = parent[1].groupped && parent[1].groupped.split(',') ? paths

          # Prepend selectors with selectors of a parent rule
          if results?.length
            bits = selectors.split(',')

            update = []
            for result in results
              if result.substring(0, 11) == '[matches~="'
                update.push result.substring(0, 11) + selectors + @engine.Continuation.DESCEND + result.substring(11)
              else
                for bit, index in bits
                  if groups[index] != bit && '::this' + groups[index] != paths[index] 
                    if result.substring(0, 6) == '::this'
                      update.push @getCustomSelector(selectors) + result.substring(6)
                    else
                      update.push @getCustomSelector(selectors) + ' ' + result
                  else 
                    if result.substring(0, 6) == '::this'
                      update.push bit + result.substring(6)
                    else
                      update.push bit + ' ' + result

            results = update
          # Return all selectors
          else 

            results = selectors.split(',').map (path, index) =>
              if path != groups[index] && '::this' + groups[index] != paths[index]
                @getCustomSelector(selectors)
              else
                path
        parent = parent.parent

      for result, index in results
        if result.substring(0, 6) == '::this'
          results[index] = result.substring(6)
        results[index] = results[index].replace(@CleanupSelectorRegExp, '')
      return results

  getCustomSelector: (selector) ->
    return '[matches~="' + selector.replace(/\s+/, @engine.Continuation.DESCEND) + '"]'


  # Process and pollute a single AST node with meta data.
  analyze: (operation, parent) ->
    Operation.analyzed ||= 0
    Operation.analyzed++
    operation.name = operation[0] if typeof operation[0] == 'string'
    def = @engine.methods[operation.name]
        
    if parent
      operation.parent ?= parent
      operation.index ?= parent.indexOf(operation)
      if parent.bound || parent.def?.bound == operation.index
        operation.bound = parent

    # Handle commands that refer other commands (e.g. [$combinator, node, >])
    operation.arity = operation.length - 1
    if def && def.lookup
      if operation.arity > 1
        operation.arity-- 
        operation.skip = operation.length - operation.arity
      else
        operation.skip = 1
      operation.name = (def.prefix || '') + operation[operation.skip] + (def.suffix || '')
      otherdef = def
      switch typeof def.lookup
        when 'function'
          def = def.lookup.call(@, operation)
        when 'string'
          def = @engine.methods[def.lookup + operation.name]
        else
          def = @engine.methods[operation.name]
      
    operation.def = def ||= {noop: true}
    operation.domain = @engine
    def.onAnalyze?(operation)

    for child, index in operation
      if child instanceof Array
        @analyze(child, operation)

    if parent
      if mark = operation.def.mark || operation.marked
        if parent && !parent.def.capture# && !parent.def.noop
          parent.marked = mark

    return if def.noop

    if def.serialized
      # String representation of operation without complex arguments
      operation.key  = @serialize(operation, otherdef, false)
      # String representation of operation with all types of arguments
      operation.path = @serialize(operation, otherdef)

      if def.group
        # String representation of operation with arguments filtered by type
        operation.groupped = @serialize(operation, otherdef, def.group)

    if def.init
      @engine[def.init](operation, false)

    # Try predefined command if can't dispatch by number of arguments
    if typeof def == 'function'
      func = def
      operation.offset = 1
    else if func = def[operation.arity]
      operation.offset = 1
    else
      func = def.command
    operation.offset ?= def.offset if def.offset



    # Command may resolve to method, which will be called on the first argument
    if typeof func == 'string'
      operation.method = func
    else
      operation.func = func

    return operation

  toExpressionString: (operation) ->
    if operation?.push
      if operation[0] == 'get'
        path = @engine.Variable.getPath(operation[1], operation[2])
        if @engine.values[path.replace('[', '[intrinsic-')]?
          klass = 'intrinsic'
        else if path.indexOf('"') > -1
          klass = 'virtual'
        else if operation[2] && operation[1]
          if operation[2] == 'x' || operation[2] == 'y'
            klass = 'position'
          else if !(@engine.intrinsic.properties[operation[2]]?.matcher)
            klass = 'local'
        return '<strong class="' + (klass || 'variable') + '" for="' + path + '">' + path + '</strong>'
      else if operation[0] == 'value'
        return '<em>' + operation[1] + '</em>'
      return @toExpressionString(operation[1]) + ' <b>' + operation[0] + '</b> ' + @toExpressionString(operation[2])
    else
      return operation ? ''

  # Serialize operation to a string with arguments, but without context
  serialize: (operation, otherdef, group) ->
    def = operation.def
    prefix = def.prefix || otherdef?.prefix || (operation.def.noop && operation.name) || ''
    suffix = def.suffix || otherdef?.suffix || ''
    if separator = operation.def.separator
      if group
        for index in [1 ... operation.length]
          if op = operation[index]
            if op.path != op.groupped
              return
    after = before = ''
    for index in [1 ... operation.length]
      if op = operation[index]
        if typeof op != 'object'
          if operation.def.binary && after && !binary
            after = op + after
            binary = true
          else if binary
            if operation.def.quote
              after += '"' + op + '"' #todo escape
          else
            after += op
        else if op.key && group != false
          if (group && (groupper = @engine.methods[group]))
            if (op.def.group == group)
              following = index
              next = undefined
              while next = operation[++following]
                if next.def && (next.def.group != group || next.marked != op.marked)
                  group = false
                  break
              unless next
                if tail = op.tail ||= (groupper.condition(op) && op)
                  operation.groupped = groupper.promise(op, operation)
                  tail.head = operation
                  operation.tail = tail
                  before += (before && separator || '') + op.groupped || op.key
                else continue
            else
              group = false 
              continue

          else if separator
            before += (before && separator || '') + op.path
          else
            before += op.path
    return before + prefix + after + suffix
    
module.exports = Operation