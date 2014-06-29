# Do your math! Functions that work on fully resolved values

class Measurements

  # Combine subsequent remove commands
  onBuffer: (buffer, args, batch) ->
    return unless buffer && batch
    if last = buffer[buffer.length - 1]
      if last[0] == args[0]
        if last.indexOf(args[1]) == -1
          last.push.apply(last, args.slice(1))
        return false

  # Add suggestions before all other commands are sent
  onFlush: (buffer) ->
    return @_getComputedProperties()

  onMeasure: (node, id) ->
    


  onResize: (node) ->
    return unless intrinsic = @intrinsic
    while node 
      if id = node._gss_id
        if properties = intrinsic[id]
          for prop in properties
            switch prop
              when "height", "width"         
                @_compute id, 'intrinsic-' + prop
                
      node = node.parent

  # Register intrinsic values assigned to engine
  onChange: (path, value, old) ->
    unless old? == value? 
      if prop = @_getIntrinsicProperty(path)
        id = path.substring(0, path.length - prop.length - 10 - 2)
        if value?
          ((@intrinsic ||= {})[id] ||= []).push(prop)
        else
          group = @intrinsic[id] 
          group.splice group.indexOf(path), 1
          delete @intrinsic[id] unless group.length

  # Math ops compatible with constraints API
  plus: (a, b) ->
    return NaN if typeof a == 'object' 
    return a + b

  minus: (a, b) ->
    return a - b

  multiply: (a, b) ->
    return a * b

  divide: (a, b) ->
    return a / b

  getStyle: (element, property) ->

  setStyle: (element, property, value) ->
    element.style[property] = value


  deferComputation: {'intrinsic-x', 'intrinsic-y'}

  # Compute value of a property, reads the styles on elements
  compute: (node, property, continuation, old) ->
    if node.nodeType
      id = @identify(node)
    else
      id = node
      node = @elements[id]

    path = property.indexOf('[') > -1 && property || id + '[' + property + ']'
    debugger if path.indexOf('window') > -1
    return if @computed?[path]?
    if (prop = @properties[id]?[property])? 
      current = @values[path]
      if current == undefined || old == true
        if typeof prop == 'function'
          value = prop.call(@, node, continuation)
        else
          value = prop
    else if property.indexOf('intrinsic-') > -1
      if document.body.contains(node)
        if prop = @properties[property]
          value = prop.call(@, node, property, continuation)
        else
          value = @_getStyle(node, property, continuation)
      else
        value = null
    else
      value = @[property](node, continuation)
    return (@computed ||= {})[path] = value

  getComputedProperties: () ->
    return unless @computed
    suggests = undefined
    for property, value of @computed
      unless value == @values[property]
        (suggests ||= []).push ['suggest', property, value, 'required']

    @computed = undefined
    return suggests

  # Generate command to create a variable
  get:
    command: (continuation, object, property) ->
      if property
        if typeof object == 'string'
          id = object

        # Get document property
        else if object.absolute is 'window' || object == document
          id = '::window'

        # Get element property
        else if object.nodeType
          id = @identify(object)
      else
        # Get global variable
        id = ''
        property = object
        object = undefined

      if typeof continuation == 'object'
        continuation = continuation.path

      # Compute custom property
      if property.indexOf('intrinsic-') > -1 || @properties[id]?[property]? # || @[property]?
        computed = @_compute(id, property, continuation, true)
        if typeof computed == 'object'
          return computed

      # Return command for solver with path which will be used to clean it
      return ['get', id, property, continuation || '']

  getIntrinsicProperty: (path) ->
    index = path.indexOf('[intrinsic-')
    if index > -1
      return property = path.substring(index + 11, path.length - 1)


module.exports = Measurements