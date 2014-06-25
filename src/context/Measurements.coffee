# Do your math! Functions that work on fully resolved values

class Measurements

  # Math ops compatible with constraints API

  plus: (a, b) ->
    return a + b

  minus: (a, b) ->
    return a - b

  multiply: (a, b) ->
    return a * b

  divide: (a, b) ->
    return a / b


  "[intrinsic-height]": (scope) ->
    return scope.offsetHeight

  "[intrinsic-width]": (scope) ->
    return scope.offsetWidth

  "[scroll-left]": (scope) ->
    return scope.scrollLeft

  "[scroll-top]": (scope) ->
    return scope.scrollTop


  # Global getters



  # Generate command to create a variable
  'get':
    command: (path, object, property) ->
      console.log('get', [path, object, property])
      if property
        # Get document property
        if object.absolute is 'window' || object == document
          id = '::window'
        # Get element property
        else if object.nodeType
          id = @engine.identify(object)
      else
        # Get global property
        id = '::global'
        property = object
        object = undefined
        
      # Get custom property
      if typeof @[property] == 'function'
        return @[property](object)

      # Return command with path which will be used to undo it
      if typeof path == 'object'
        path = path.path
      return ['get', id, property, path || '']

module.exports = Measurements