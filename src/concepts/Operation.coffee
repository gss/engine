
class Operation
  constructor: (engine) ->
    unless engine
      return Array.prototype.slice.call(arguments)
    @engine = engine
    @CleanupSelectorRegExp = new RegExp(@engine.DESCEND + '::this', 'g')

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


  getDomain: (operation, domain) ->
    if typeof operation[0] == 'string'
      if !domain.methods[operation[0]]
        return @engine.linear.maybe()
      for arg in operation
        if arg.domain && arg.domain.priority > domain.priority && arg.domain < 0
          return arg.domain
    return domain

  # get topmost meaniningful function call with matching domain
  getRoot: (operation, domain = operation.domain) ->
    parent = operation
    while parent.parent &&  typeof parent.parent[0] == 'string' && 
          (!parent.parent.def || 
                              (!parent.parent.def.noop && 
                              parent.domain == domain))
      parent = parent.parent
    while parent.parent?.domain == parent.domain
      parent = parent.parent
    return parent

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
        return @identity.provide(continuation) + ' ' + operation.path
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
                results[index] = result.substring(0, 11) + parent.uid + @engine.DESCEND + result.substring(11)
        
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
                update.push result.substring(0, 11) + selectors + @engine.DESCEND + result.substring(11)
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
    return '[matches~="' + selector.replace(/\s+/, @engine.DESCEND) + '"]'

module.exports = Operation