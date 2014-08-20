# Objects dont need to reference to other objects physically
# because the link can be inferred from conventions and structure.

# Dynamic systems need to be able to clean up side effects.
# Instead of remembering effects explicitly, we generate 
# unique tracking labels with special delimeters.
# Uniquely structured cache key enables bottom-up evaluation 
# and stateless continuations. 

class Conventions

# ### Delimeters

# **↑ Referencing**, e.g. to jump to results of dom query,
# or to figure out which element in that collection 
# called this function
  UP:    '↑'

# **→ Linking**, that allows lazy evaluation, by making arguments
# depend on previously resolved arguments,
# e.g. for plural binding or to generate unique argument signature
  RIGHT: '→'

# **↓ Nesting**, as a way for expressions to own side effects,
# e.g. to remove stylesheet, css rule or conditional branch
  DOWN:  '↓'

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
      path = path.replace(/[→↓↑]$/, '')
    return '' if !path && !value
    return value if typeof value == 'string'
    return path + (value && @identity.provide(value) || '') + suffix

  # When cleaning a path, also clean forks, rules and pairs
  # This is a little bit of necessary evil.
  getPossibleContinuations: (path) ->
    [path, path + @UP, path + @RIGHT, path + @DOWN]

  # Return computed path for id and property e.g. $id[property]
  getPath: (id, property) ->
    unless property
      property = id
      id = undefined
    if property.indexOf('[') > -1 || !id
      return property
    else
      return id + '[' + property + ']'

  # Hook: Should interpreter iterate returned object?
  # (yes, if it's a collection of objects or empty array)
  isCollection: (object) ->
    if object && object.length != undefined && !object.substring && !object.nodeType
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
      else
        return continuation + operation.key
    else
      return operation.key

  # Remove all fork marks from a path. 
  # Allows multiple selector paths have shared destination 
  getCanonicalPath: (continuation, compact) ->
    bits = @getContinuation(continuation).split(@DOWN);
    last = bits[bits.length - 1]
    last = bits[bits.length - 1] = last.split(@RIGHT).pop().replace(@CanonicalizeRegExp, '')
    return last if compact
    return bits.join(@DOWN)
  CanonicalizeRegExp: /\$[^↑]+(?:↑|$)/g

  # Get path for the scope that triggered the script 
  # (e.g. el matched by css rule)
  getScopePath: (continuation) ->
    bits = continuation.split(@DOWN)
    bits[bits.length - 1] = ""
    return bits.join(@DOWN)

  # Return path for given operation
  getOperationPath: (operation, continuation) ->
    if continuation?
      if operation.def.serialized && !operation.def.hidden
        return continuation + (operation.key || operation.path)
      return continuation
    else
      return operation.path

  # Return element that is used as a context for given DOM operation
  getContext: (args, operation, scope, node) ->
    index = args[0].def && 4 || 0
    if (args.length != index && (args[index]?.nodeType))
      return args[index]
    if !operation.bound
      return @scope
    return scope;

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
  getVariableDomain: (operation) ->
    if operation.domain
      return operation.domain
    [cmd, scope, property] = variable = operation

    path = @getPath(scope, property)
    if scope && property && @intrinsic?.properties[path]?
      domain = @intrinsic
    else
      for d in @domains
        if d.values.hasOwnProperty(path)
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
        if scope && property && @intrinsic?.properties[property]
          domain = @intrinsic.maybe()
        else
          domain = @linear.maybe()
    if variable
      variable.domain = domain
    return domain

  # auto-worker url, only works with sync scripts!
  getWorkerURL: do ->
    if document?
      scripts = document.getElementsByTagName('script')
      src = scripts[scripts.length - 1].src
    return (url) ->
      return typeof url == 'string' && url || src

  # get topmost meaniningful function call with matching domain
  getRootOperation: (operation) ->
    parent = operation
    while parent.parent &&  typeof parent.parent[0] == 'string' && 
          (!parent.parent.def || 
                              (!parent.parent.def.noop && 
                              parent.domain == operation.domain))
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