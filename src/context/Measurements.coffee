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

  "[left]": (scope) ->
    return @get("[offsets]", scope).left

  "[top]": (scope) ->
    return @get("[offsets]", scope).top

  "[offsets]": (scope) ->
    offsets = {left: 0, top: 0}
    while scope
      offsets.left += element.offsetLeft + element.clientLeft# - element.scrollLeft
      offsets.top  += element.offsetTop + element.clientTop# - element.scrollTop
      scope = scope.offsetParent
    return offsets


  # Global getters



  # Generate command to create a variable
  'get':
    prefix: '['
    suffix: ']'
    command: (path, object, property) ->

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
      return ['get', id, property, path]

module.exports = Measurements