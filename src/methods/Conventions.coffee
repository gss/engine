# Objects dont need to reference to other objects physically
# because the link can be inferred from conventions and structure.

# Dynamic systems need to be able to clean  side effects.
# Instead of remembering effects explicitly, we generate 
# unique tracking labels with special delimeters.
# Uniquely structured cache key enables bottom-up evaluation 
# and stateless continuations. 

# Most of the nasty stuff is in this file, and waiting to move out

class Conventions

# ### Delimeters

# **↑ Referencing**, e.g. to jump to results of dom query,
# or to figure out which element in that collection 
# called this function
  ASCEND: String.fromCharCode(8593)

# **→ Linking**, to pair up elements in arguments
  PAIR: String.fromCharCode(8594)

# **↓ Nesting**, as a way for expressions to own side effects,
# e.g. to remove stylesheet, css rule or conditional branch
  DESCEND: String.fromCharCode(8595)

# ### Example 
# 
# It's a lot easier to clean up stateless systems. 
# Whenever a string key is set to be cleaned up,
# it broadcasts that intent to all subsystems, 
# like constraint solver, dom observer, etc.
# So they can clean up things related to that key
# by triggering more remove commands for known sub-keys.
# 
# This removal cascade allows components to have strict
# and arbitarily deep hierarchy, without knowing of it.
  ### 
    <!-- Example of document -->
    <style id="my-stylesheet">
      (h1 !+ img)[width] == #header[width]
    </style>
    <header id="header">
      <img>
      <h1 id="h1"></h1>
    </header>

    <!-- Generated constraint key -->
    style$my-stylesheet   # my stylesheet
               ↓ h1$h1    # found heading
               ↑ !+img    # preceeded by image
               → #header  # bound to header element###
  # ### Methods

  # Return concatenated path for a given object and prefix
  # Removes trailing delimeter.
  getContinuation: (path, value, suffix = '') ->
    if path
      path = path.replace(@TrimContinuationRegExp, '')
    return '' if !path && !value
    return path + (value && @identity.provide(value) || '') + suffix

  TrimContinuationRegExp: new RegExp("[" + 
    Conventions::ASCEND + 
    Conventions::DESCEND +
    Conventions::PAIR +
  "]$")

  # When cleaning a path, also clean forks, rules and pairs
  # This is a little bit of necessary evil.
  getPossibleContinuations: (path) ->
    [path, path + @ASCEND, path + @PAIR, path + @DESCEND]

  # Return computed path for id and property e.g. $id[property]
  getPath: (id, property) ->
    unless property
      property = id
      id = undefined
    if property.indexOf('[') > -1 || !id
      return property
    else
      if typeof id != 'string'
        if id.nodeType
          id = @identity.provide(id)
        else 
          id = id.path
      return id + '[' + property + ']'

  # Hook: Should interpreter iterate returned object?
  # (yes, if it's a collection of objects or empty array)
  isCollection: (object) ->
    if object && object.length != undefined && !object.substring && !object.nodeType
      return true if object.isCollection
      switch typeof object[0]
        when "object"
          return object[0].nodeType
        when "undefined"
          return object.length == 0

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

  getOperationSelectors: (operation) ->
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
              results[index] = result.substring(0, 11) + parent.uid + @DESCEND + result.substring(11)
      
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
              update.push result.substring(0, 11) + selectors + @DESCEND + result.substring(11)
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

  CleanupSelectorRegExp: new RegExp(Conventions::DESCEND + '::this', 'g')

  getCustomSelector: (selector) ->
    return '[matches~="' + selector.replace(@CustomizeRegExp, @DESCEND) + '"]'

  CustomizeRegExp: /\s+/g





  # Remove all fork marks from a path. 
  # Allows multiple selector paths have shared destination 
  getCanonicalPath: (continuation, compact) ->
    bits = @getContinuation(continuation).split(@DESCEND)
    last = bits[bits.length - 1]
    last = bits[bits.length - 1] = last.replace(@CanonicalizeRegExp, '$1')
    return last if compact
    return bits.join(@DESCEND)
  CanonicalizeRegExp: new RegExp("" +
    "([^" + Conventions::PAIR + "])" +
    "\\$[^" + Conventions::ASCEND + "]+" +
    "(?:" + Conventions::ASCEND + "|$)", "g")


  getCanonicalSelector: (selector) ->
    selector = selector.trim()
    selector = selector.
      replace(@CanonicalizeSelectorRegExp, ' ').
      replace(/\s+/g, @engine.DESCEND).
      replace(@CleanupSelectorRegExp, '')
    return selector
  CanonicalizeSelectorRegExp: new RegExp("" +
    "[$][a-z0-9]+[" + Conventions::DESCEND + "]\s*", "gi")

  # Get path for the scope that triggered the script 
  # (e.g. el matched by css rule)
  getScopePath: (scope, continuation) ->
    return '' unless continuation
    bits = continuation.split(@DESCEND)
    if scope && @scope != scope
      id = @identity.provide(scope)
      prev = bits[bits.length - 2]
      # Ugh
      if prev && prev.substring(prev.length - id.length) != id
        last = bits[bits.length - 1]
        if (index = last.indexOf(id + @ASCEND)) > -1
          bits.splice(bits.length - 1, 0, last.substring(0, index + id.length))
    bits[bits.length - 1] = ""
    path = bits.join(@DESCEND)
    if continuation.charAt(0) == @PAIR
      path = @PAIR + path
    return path
    

  getOperationSolution: (operation, continuation, scope) ->
    if operation.def.serialized && (!operation.def.hidden || operation.parent.def.serialized)
      return @pairs.getSolution(operation, continuation, scope)

  getAscendingContinuation: (continuation, item) ->
    return @engine.getContinuation(continuation, item, @engine.ASCEND)

  getDescendingContinuation: (operation, continuation, ascender) ->
    if ascender?
      mark = operation.def.rule && ascender == 1 && @engine.DESCEND || @engine.PAIR
      if mark
        return @engine.getContinuation(continuation, null, mark)
      else
        return continuation

  # Return path for given operation
  getOperationPath: (operation, continuation, scope) ->
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

  # Return element that is used as a context for given DOM operation
  getContext: (args, operation, scope, node) ->
    index = args[0].def && 4 || 0
    if (args.length != index && (args[index]?.nodeType))
      return args[index]
    if !operation.bound
      if (operation.def.serialized && operation[1].def && args[index]?)
        return args[index]
      return @scope
    return scope

  # Return name of intrinsic property used in property path 
  getIntrinsicProperty: (path) ->
    index = path.indexOf('intrinsic-')
    if index > -1
      if (last = path.indexOf(']', index)) == -1
        last = undefined
      return property = path.substring(index + 10, last)

  # Is the value numerical? Helps us to deal with detecting non-linear exps
  # Objects are allowed only if they define custom valueOf function
  isPrimitive: (object) ->
    if typeof object == 'object'
      return object.valueOf != Object.prototype.valueOf
    return true

  getOperationDomain: (operation, domain) ->
    if typeof operation[0] == 'string'
      if !domain.methods[operation[0]]
        return @linear.maybe()
      for arg in operation
        if arg.domain && arg.domain.priority > domain.priority && arg.domain < 0
          return arg.domain
    return domain

  # Return domain that should be used to evaluate given variable
  getVariableDomain: (operation, force, quick) ->
    if operation.domain && !force
      return operation.domain
    [cmd, scope, property] = variable = operation
    path = @getPath(scope, property)
    if (scope || path.indexOf('[') > -1) && property && @intrinsic?.properties[path]?
      domain = @intrinsic
    else if scope && property && @intrinsic?.properties[property] && !@intrinsic.properties[property].matcher
      domain = @intrinsic
    else
      for d in @domains
        if d.values.hasOwnProperty(path) && (d.priority >= 0 || d.variables[path])
          domain = d
          break
        if d.substituted
          for constraint in d.substituted
            if constraint.substitutions?[path]
              domain = d
              break
    unless domain
      if property && (index = property.indexOf('-')) > -1
        prefix = property.substring(0, index)
        if (domain = @[prefix])
          unless domain instanceof @Domain
            domain = undefined

      unless domain
        #if scope && property && @intrinsic?.properties[property]
        #  domain = @intrinsic.maybe()
        #else
        if !quick
          domain = @linear.maybe()
    if variable && !force
      variable.domain = domain
    return domain

  # auto-worker url, only works with sync scripts!
  getWorkerURL: do ->
    if document?
      scripts = document.getElementsByTagName('script')
      src = scripts[scripts.length - 1].src
      if location.search?.indexOf('log=0') > -1
        src += ((src.indexOf('?') > -1) && '&' || '?') + 'log=0'
    return (url) ->
      return typeof url == 'string' && url || src

  # get topmost meaniningful function call with matching domain
  getRootOperation: (operation, domain = operation.domain) ->
    parent = operation
    while parent.parent &&  typeof parent.parent[0] == 'string' && 
          (!parent.parent.def || 
                              (!parent.parent.def.noop && 
                              parent.domain == domain))
      parent = parent.parent
    while parent.parent?.domain == parent.domain
      parent = parent.parent
    return parent



# Little shim for require.js so we dont have to carry it around
@require ||= (string) ->
  if string == 'cassowary'
    return c
  bits = string.replace('', '').split('/')
  return this[bits[bits.length - 1]]
@module ||= {}

module.exports = Conventions