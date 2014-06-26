# Do your math! Functions that work on fully resolved values

class Measurements

  # Add suggestions before all other commands are sent
  onFlush: (buffer) ->
    debugger
    return buffer unless @computed
    commands = []
    for property, value of @computed
      continue if @engine.values[property] == value
      commands.push ['suggest', property, value, 'required']
    @computed = undefined

    return commands.concat(buffer)

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

  compute: (id, property, continuation, old) ->
    if id.nodeType
      object = id
      id = @engine.identify(object)
    else if property
      object = @engine[id]

    if property.indexOf('intrinsic-') > -1
      path = id + property
      if !@computed || !@computed[path]?
        if value == undefined
          method = @[property] && property || 'getStyle'
          if document.contains(object)
            value = @[method](object, property, continuation)
          else
            value = null
        if value != old
          (@computed ||= {})[path] = value
    else
      return @[property](object, continuation)

  # Generate command to create a variable
  get:
    command: (continuation, object, property) ->
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

      if typeof continuation == 'object'
        continuation = continuation.path
        
      # Compute custom property
      if property.indexOf('intrinsic-') > -1 || @[property]
        computed = @compute(id, property, continuation)
        return computed if typeof computed == 'object' 

      # Return command for solver with path which will be used to clean it
      return ['get', id, property, continuation || '']

module.exports = Measurements