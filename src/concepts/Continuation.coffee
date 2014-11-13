# Objects dont need to reference to other objects physically
# because the link can be inferred from conventions and structure.

# Dynamic systems need to be able to clean  side effects.
# Instead of remembering effects explicitly, we generate 
# unique tracking labels with special delimeters.

class Continuation
    

  @new: (engine) ->
    Kontinuation = (path, value, suffix = '') ->
      if path
        path = path.replace(Kontinuation.TrimContinuationRegExp, '')
      return '' if !path && !value
      return path + (value && engine.identity.yield(value) || '') + suffix

    Kontinuation.engine = engine
    Kontinuation.get = Kontinuation

    for property, value of @prototype
      Kontinuation[property] = value

    return Kontinuation

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

  # When cleaning a path, also clean forks, rules and pairs
  # This is a little bit of necessary evil.
  getVariants: (path) ->
    [path, path + @ASCEND, path + @PAIR, path + @DESCEND]

  # Remove all fork marks from a path. 
  # Allows multiple selector paths have shared destination 
  getCanonicalPath: (continuation, compact) ->
    bits = @get(continuation).split(@DESCEND)
    last = bits[bits.length - 1]
    last = bits[bits.length - 1] = last.replace(@CanonicalizeRegExp, '$1')
    return last if compact
    return bits.join(@DESCEND)
  CanonicalizeRegExp: new RegExp("" +
    "([^" + Continuation::PAIR + "])" +
    "\\$[^" + Continuation::ASCEND + "]+" +
    "(?:" + Continuation::ASCEND + "|$)", "g")


  getCanonicalSelector: (selector) ->
    selector = selector.trim()
    selector = selector.
      replace(@CanonicalizeSelectorRegExp, ' ').
      replace(/\s+/g, @DESCEND).
      replace(@engine.Operation.CleanupSelectorRegExp, '')
    return selector
  CanonicalizeSelectorRegExp: new RegExp("" +
    "[$][a-z0-9]+[" + Continuation::DESCEND + "]\s*", "gi")

  # Get path for the scope that triggered the script 
  # (e.g. el matched by css rule)
  getScopePath: (scope, continuation) ->
    return '' unless continuation
    bits = continuation.split(@DESCEND)
    if scope && @engine.scope != scope
      id = @engine.identity.yield(scope)
      prev = bits[bits.length - 2]
      # Ugh #1
      if prev && prev.substring(prev.length - id.length) != id
        last = bits[bits.length - 1]
        if (index = last.indexOf(id + @ASCEND)) > -1
          bits.splice(bits.length - 1, 0, last.substring(0, index + id.length))
    bits[bits.length - 1] = ""
    path = bits.join(@DESCEND)
    if continuation.charAt(0) == @PAIR
      path = @PAIR + path
    return path

  getParentScope: (scope, continuation) ->
    return scope._gss_id unless continuation
    
    bits = continuation.split(@DESCEND)

    until last = bits[bits.length - 1]
      bits.pop()

    if scope && @engine.scope != scope
      id = @engine.identity.yield(scope)
      # Ugh #1
      if last.substring(last.length - id.length) == id
        bits.pop()
        last = bits[bits.length - 1]
    
    unless last?
      return @engine.scope

    if matched = last.match(@engine.pairs.TrailingIDRegExp)
      if matched[1].indexOf('"') > -1
        return matched[1]
      return @engine.identity[matched[1]]
      
    return @engine.queries[bits.join(@DESCEND)]




  # Return path for given operation
  concat: (continuation, command, scope) ->
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

  TrimContinuationRegExp: new RegExp("[" + 
    Continuation::ASCEND + 
    Continuation::DESCEND +
    Continuation::PAIR +
  "]$")


for property, value of Continuation::
  Continuation[property] = value

module.exports = Continuation 