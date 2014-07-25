### 

# # Conventions
# 
# Okay what's the deal with those → ↓ ↑ arrows? 
# Open your mind and think beyond this Unicode madness. 
# 
# Dynamic systems need to be able to clean up side effects
# Instead of linking things together, we are use a tracking system
# that generates determenistic unique string keys
# that are used for multiple purposes.

↑  Caching, e.g. to jump to results of dom query,
   or to figure out which element in that collection 
   called this function (↑)

→  Linking, that allows lazy evaluation, by making arguments
   depend on previously resolved arguments,
   e.g. for plural binding or to generate unique argument signature

↓  Nesting, as a way for expressions to own side effects,
   e.g. to remove stylesheet, css rule or conditional branch

# These arrows are delimeters that combined together 
# enable bottom-up evaluation and continuations
# without leaving any state behind. 
# Continuations without explicit state.
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

    style$my-stylesheet   # my stylesheet
               ↓ h1$h1    # found heading
               ↑ !+img    # preceeded by image
               → #header  # bound to header element

    <style id="my-stylesheet">
      (h1 !+ img)[width] == #header[width]
    </style>
    <header id="header">
      <img>
      <h1 id="h1"></h1>
    </header>

.

###


# Little shim for require.js so we dont have to carry it around
@require ||= (string) ->
  if string == 'cassowary'
    return c
  bits = string.replace('', '').split('/')
  return this[bits[bits.length - 1]]
@module ||= {}


class Conventions
  # Return concatenated path for a given object and prefix
  # Removes trailing delimeter.
  getContinuation: (path, value, suffix = '') ->
    if path
      path = path.replace(/[→↓↑]$/, '')
    #return path unless value?
    return value if typeof value == 'string'
    return path + (value && @identify(value) || '') + suffix

  # When cleaning a path, also clean forks, rules and pairs
  # This is a little bit of necessary evil in 
  getPossibleContinuations: (path) ->
    [path, path + @UP, path + @RIGHT, path + @DOWN]

  getPath: (id, property) ->
    unless property
      property = id
      id = undefined
    if property.indexOf('[') > -1 || !id
      return property
    else
      return id + '[' + property + ']'

  # Hook: Should interpreter iterate returned object?
  isCollection: (object) ->
    # (yes, if it's a collection of objects or empty array)
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
        return @identify(continuation) + ' ' + operation.path
      else
        return continuation + operation.key
    else
      return operation.key


  forkMarkRegExp: /\$[^↑]+(?:↑|$)/g

  # Remove all fork marks from a path. 
  # Allows multiple selector paths have shared destination 
  getCanonicalPath: (continuation, compact) ->
    bits = @getContinuation(continuation).split(@DOWN);
    last = bits[bits.length - 1]
    last = bits[bits.length - 1] = last.split(@RIGHT).pop().replace(@forkMarkRegExp, '')
    return last if compact
    return bits.join(@DOWN)

  # Get path of a parent
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

  # Check if selector is bound to current scope's element
  getContext: (args, operation, scope, node) ->
    index = args[0].def && 4 || 0
    if (args.length != index && (args[index]?.nodeType))
      return args[index]
    if !operation.bound
      return @scope
    return scope;

  getIntrinsicProperty: (path) ->
    index = path.indexOf('intrinsic-')
    if index > -1
      if (last = path.indexOf(']', index)) == -1
        last = undefined
      return property = path.substring(index + 10, last)

  isPrimitive: (object) ->
    # Objects are allowed only if they define custom valueOf function
    if typeof object == 'object'
      return object.valueOf != Object.prototype.valueOf
    return true
    

  # Execution has forked (found many elements, trying brute force to complete selector)
  UP:    '↑'
  # One selector was resolved, expecting another selector to pair up
  RIGHT: '→'
  # Execution goes depth first (inside stylesheet or css rule)
  DOWN:  '↓'

module.exports = Conventions
