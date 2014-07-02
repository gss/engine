# Buffer up measurements
class Measurements

  # Generate command to create a variable
  get:
    meta: true
    command: (operation, continuation, scope, object, property) ->
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

      if operation
        parent = child = operation
        while parent = parent.parent
          if child.index && parent.def.primitive == child.index
            primitive = true
            break
          child = parent

      # Compute custom property
      if property.indexOf('intrinsic-') > -1 || @properties[id]?[property]? # || @[property]?
        computed = @_compute(id, property, continuation, true)
        console.log(computed, id, property)
        if primitive
          return computed 
      else if primitive
        return @values.watch(id, property, operation, continuation, scope)

      # Return command for solver with path which will be used to clean it
      return ['get', id, property, @getContinuation(continuation || '')]


  # Combine subsequent remove commands
  onBuffer: (buffer, args, batch) ->
    return unless buffer && batch
    if last = buffer[buffer.length - 1]
      if last[0] == args[0]
        if last.indexOf(args[1]) == -1
          last.push.apply(last, args.slice(1))
        return false

  # Add suggestions before all other commands are sent
  # Triggers measure pass if no commands were sent 
  # and something is set for re-measurement
  onFlush: (buffer) ->
    return @_getComputedProperties(!buffer)

  onMeasure: (node, x, y, styles, full) ->
    return unless @intrinsic
    if id = node._gss_id
      if properties = @intrinsic[id]
        for prop in properties
          continue if full && (prop == 'width' || prop == 'height')

          path = id + "[intrinsic-" + prop + "]"
          (@computed ||= {})[path] = 
            if prop == "x" 
              x + node.offsetLeft
            else
              y + node.offsetTop
    return

  # Decide common parent for all mutated nodes
  onResize: (node) ->
    return unless intrinsic = @intrinsic
    reflown = undefined
    while node
      if node == @scope
        if @reflown
          reflown = @_getCommonParent(reflown, @reflown)
        else
          reflown = @scope
        break
      if node == @reflown
        break 
      if id = node._gss_id
        if properties = intrinsic[id]
          reflown = node
      node = node.parentNode
    @reflown = reflown

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

  getStyle: (element, property) ->

  setStyle: (element, property, value) ->
    element.style[property] = value

  set:
    command: (operation, continuation, scope, property, value) ->
      if scope && scope.style[property] != undefined
        console.error('setting', scope, property, value)
        @_setStyle(scope, property, value)
      return true

  deferComputation: {'intrinsic-x', 'intrinsic-y'}

  # Compute value of a property, reads the styles on elements
  compute: (node, property, continuation, old) ->
    if node.nodeType
      id = @identify(node)
    else
      id = node
      node = @elements[id]

    path = @getPath(id, property)
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

  getCommonParent: (a, b) ->
    aps = []
    bps = []
    ap = a
    bp = b
    while ap && bp
      aps.push ap
      bps.push bp
      ap = ap.parentNode
      bp = bp.parentNode
      if bps.indexOf(ap) > -1
        return ap
      if aps.indexOf(bp) > -1
        return bp

  getComputedProperties: (reflow) ->
    suggests = undefined
    if @reflown
      if (reflow)
        @styles.render(@reflown)
      @reflown = undefined
    if @computed
      for property, value of @computed
        if value? && value != @values[property]
          (suggests ||= []).push ['suggest', property, value, 'required']
      @values.merge @computed
      @computed = undefined

    return suggests

  getIntrinsicProperty: (path) ->
    index = path.indexOf('[intrinsic-')
    if index > -1
      return property = path.substring(index + 11, path.length - 1)


module.exports = Measurements