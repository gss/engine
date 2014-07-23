class Conventions
  # Return concatenated path for a given object and prefix
  getContinuation: (path, value, suffix = '') ->
    if path
      path = path.replace(/[→↓↑]$/, '')
    #return path unless value?
    return value if typeof value == 'string'
    return path + (value && @identify(value) || '') + suffix

  # When cleaning a path, also clean forks, rules and pairs
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

  # Check if selector is bound to current scope's element
  getContext: (args, operation, scope, node) ->
    index = args[0].def && 4 || 0
    if (args.length != index && (args[index]?.nodeType))
      return args[index]
    if !operation.bound
      return @scope
    return scope;

  getIntrinsicProperty: (path) ->
    index = path.indexOf('[intrinsic-')
    if index > -1
      return property = path.substring(index + 11, path.length - 1)
    

  # Execution has forked (found many elements, trying brute force to complete selector)
  UP:    '↑'
  # One selector was resolved, expecting another selector to pair up
  RIGHT: '→'
  # Execution goes depth first (inside stylesheet or css rule)
  DOWN:  '↓'

module.exports = Conventions
