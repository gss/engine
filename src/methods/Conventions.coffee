# Objects dont need to reference to other objects physically
# because the link can be inferred from conventions and structure.

# Dynamic systems need to be able to clean  side effects.
# Instead of remembering effects explicitly, we generate 
# unique tracking labels with special delimeters.

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
    

  getAscendingContinuation: (continuation, item) ->
    return @engine.getContinuation(continuation, item, @engine.ASCEND)

  getDescendingContinuation: (operation, continuation, ascender) ->
    if ascender?
      mark = operation.def.rule && ascender == 1 && @engine.DESCEND || @engine.PAIR
      if mark
        return @engine.getContinuation(continuation, null, mark)
      else
        return continuation


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



  # auto-worker url, only works with sync scripts!
  getWorkerURL: do ->
    if document?
      scripts = document.getElementsByTagName('script')
      src = scripts[scripts.length - 1].src
      if location.search?.indexOf('log=0') > -1
        src += ((src.indexOf('?') > -1) && '&' || '?') + 'log=0'
    return (url) ->
      return typeof url == 'string' && url || src




# Little shim for require.js so we dont have to carry it around
@require ||= (string) ->
  if string == 'cassowary'
    return c
  bits = string.replace('', '').split('/')
  return this[bits[bits.length - 1]]
@module ||= {}

module.exports = Conventions