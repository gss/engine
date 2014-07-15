# Buffer up measurements
class Measurements

  # Add continuation to suggest command, because suggest creates a variable
  # if its undefined. It will ensure the solver will be able to clean up
  suggest:
    command: (operation, continuation, scope, meta, variable, value, strength, weight, contd) ->
      contd ||= @getContinuation(continuation) if continuation
      return ['suggest', variable, value, strength ? null, weight ? null, contd ? null]

  # Generate command to create a variable
  get:
    command: (operation, continuation, scope, meta, object, property) ->
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
        path = @_compute(id, property, continuation, true)
        if (index = path.indexOf('[')) > -1
          id = path.substring(0, index)
          property = path.substring(index + 1, path.length - 1)
        if primitive
          return @values.watch(id, property, operation, @getContinuation(continuation || '')  , scope)
        #return @computed?[path] 
        console.info(id, property, path)
      # Expand properties like ::window[center-y]
      else if @properties[id] && @properties[property]
        return @properties[property].call(@, id, continuation)
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
    return @_getSuggestions(!buffer)

  onMeasure: (node, x, y, styles, full) ->
    return unless @intrinsic
    if id = node._gss_id
      if properties = @intrinsic[id]
        for prop in properties
          continue if full && (prop == 'width' || prop == 'height')

          path = id + "[intrinsic-" + prop + "]"
          (@computed ||= {})[path] = 
            switch prop
              when "x"
                x + node.offsetLeft
              when "y"
                y + node.offsetTop
              when "width"
                node.offsetWidth
              when "height"
                node.offsetHeight
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
    command: (operation, continuation, scope, meta, property, value) ->
      if scope && scope.style[property] != undefined
        @_setStyle(scope, property, value)
      return 

  # Compute value of a property, reads the styles on elements
  compute: (node, property, continuation, old) ->
    if node == window
      id = '::window'
    else if node.nodeType
      id = @identify(node)
    else
      id = node
      node = @elements[id]

    path = @getPath(id, property)

    return path if @computed?[path]?
    if (prop = @properties[id]?[property])? 
      current = @values[path]
      if current == undefined || old == false
        switch typeof prop
          when 'function'
            value = prop.call(@, node, continuation)
          when 'string'
            path = prop
            value = @properties[prop].call(@, node, continuation)
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

    (@computed ||= {})[path] = value
    return path

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

  getSuggestions: (reflow) ->
    suggestions = undefined
    if (reflow)
      @styles.render(null, @reflown)
    @reflown = undefined
    if @computed
      for property, value of @computed
        if value? && value != @values[property]
          (suggestions ||= []).push ['suggest', property, value, 'required']
      @values.merge @computed
      @computed = undefined

    return suggestions

  getIntrinsicProperty: (path) ->
    index = path.indexOf('[intrinsic-')
    if index > -1
      return property = path.substring(index + 11, path.length - 1)


module.exports = Measurements