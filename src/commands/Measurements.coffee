# Provide some values for solver to crunch

# Measurements happen synchronously,
# re-measurements are deferred to be done in bulk

class Measurements
  # Generate command to create a variable
  get:
    command: (operation, continuation, scope, meta, object, property, primitive) ->
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

      # TODO: Compute statically
      if operation && !primitive
        parent = child = operation
        while parent = parent.parent
          if child.index
            if parent.def.primitive == child.index
              primitive = true
              break

          child = parent

      # Compute custom property, canonicalize path
      if ((property.indexOf('intrinsic-') > -1) || @properties[id]?[property]?)
        path = @measure(id, property, continuation, true, true, primitive)
        if typeof path == 'string' && (index = path.indexOf('[')) > -1
          id = path.substring(0, index)
          property = path.substring(index + 1, path.length - 1)

      # Expand properties like [center-y]
      else
        if id && (prop = @properties[property])
          if typeof prop == 'function' && prop.initial == undefined
            return prop.call(@, id, continuation)

      # Do not create solver variable, return value
      if primitive# && path != undefined
        return @values.watch(id, property, operation, continuation, scope)

      # Return command for solver together with tracking label for removal
      return ['get', id, property, @getContinuation(continuation || '')]


  # Special case: Raw suggests as commands
  # Add continuation to suggest command, because suggest creates a variable
  # if its undefined. It will ensure the solver will be able to clean up
  suggest:
    command: (operation, continuation, scope, meta, variable, value, strength, weight, contd) ->
      contd ||= @getContinuation(continuation) if continuation
      return ['suggest', variable, value, strength ? null, weight ? null, contd ? null]

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
    return @getSuggestions(!buffer)

  # Callback triggered for each element during reflow
  # Allows intrinsic to be re-measured without causing restyle
  onMeasure: (node, x, y, styles, full) ->
    return unless @intrinsic
    if id = node._gss_id
      if properties = @intrinsic[id]
        for prop in properties
          continue if full && (prop == 'width' || prop == 'height')

          path = id + "[intrinsic-" + prop + "]"
        
          switch prop
            when "x"
              (@measured ||= {})[path] = x + node.offsetLeft
            when "y"
              (@measured ||= {})[path] = y + node.offsetTop
            when "width"
              (@measured ||= {})[path] = node.offsetWidth
            when "height"
              (@measured ||= {})[path] = node.offsetHeight
            else
              @values.set null, path, @getStyle(node, prop)
    return

  # Triggered on possibly resized element by mutation observer
  # If an element is known to listen for its intrinsic properties
  # schedule a reflow on that element. If another element is already
  # scheduled for reflow, reflow shared parent element of both elements 
  onResize: (node) ->
    return unless intrinsic = @intrinsic
    reflown = undefined
    while node
      if node == @scope
        if @reflown
          reflown = @getCommonParent(reflown, @reflown)
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

  # Triggered whenever solution or outside value is set in document engine
  # Register intrinsic values assigned to engine
  onChange: (path, value, old) ->
    unless old? == value? 
      if prop = @getIntrinsicProperty(path)
        id = path.substring(0, path.length - prop.length - 10 - 2)
        if value?
          ((@intrinsic ||= {})[id] ||= []).push(prop)
        else
          group = @intrinsic[id] 
          group.splice group.indexOf(path), 1
          delete @intrinsic[id] unless group.length

  # Cache computed styles for given element
  getComputedStyle: (element, force) ->
    unless (old = element.currentStyle)?
      computed = (@computed ||= {})
      id = @identify(element)
      old = computed[id]
      if force || !old?
        return computed[id] = window.getComputedStyle(element)
    return old

  # Retrieve assigned or computed style for an element
  getStyle: (element, property) ->
    prop = @camelize(property)
    value = element.style[property]
    if value == ''
      value = @getComputedStyle(element)[prop]
    value = @toPrimitive(value, null, null, null, element, prop)
    if value.push && typeof value[0] == 'object'
      return @properties[property].apply(@, value)
    else
      return @properties[property].call(@, value)

  # Substitute variables and simplify expressions
  toPrimitive: (object, operation, continuation, scope, element, prop) ->
    if typeof object == 'string' 
      object = @parse(object)
    if typeof object == 'object'
      if object[0] == 'get' && @getIntrinsicProperty(object[2])
        value = @get.command.call(this, operation, continuation, scope, 'return', object[1], object[2], true)
        if value?
          if typeof (object = value) != 'object'
            return object
        else
          return object
      if !continuation? && element
        continuation = @getPath(element, prop)

      return @capture('toPrimitive(' + continuation + ')', object, continuation, scope, 'return')
    return object

  # Parse value, normalize static units to pixels
  _staticUnit: /^(-?\d+)(px|pt|cm|mm|in)$/i

  # Parse value
  parse: (value) ->
    unless (old = (@parsed ||= {})[value])?
      if typeof value == 'string'
        if match = value.match(@_staticUnit)
          return @parsed[value] = @[match[2]](parseFloat(match[1]))
        else
          value = 'a: == ' + value + ';'
          return @parsed[value] = GSS.Parser.parse(value).commands[0][2]
      else return value
    return old

  setStyle: (element, property, value) ->
    #if (value.test(@_simpleValueRegExp))
    element.style[property] = value
    #else
    #  #FIXME
    #  value = property + ': == ' + value
    #  operation = GSS.Parser.parse(value).commands[0][2]


  set:
    command: (operation, continuation, scope, meta, property, value) ->
      prop = @camelize(property)
      if scope && scope.style[prop] != undefined
        @setStyle(scope, prop, value)
      return 

  # Compute value of a property, reads the styles on elements
  measure: (node, property, continuation, old, returnPath, primitive) ->
    if node == window
      id = '::window'
    else if node.nodeType
      id = @identify(node)
    else
      id = node
      node = @elements[id]

    path = @getPath(id, property)

    unless (value = @measured?[path])?
      # property on specific element (e.g. ::window[height])
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
      # dommeasurement
      else if intrinsic = @getIntrinsicProperty(property)
        if document.body.contains(node)
          if prop ||= @properties[property]
            value = prop.call(@, node, property, continuation)
          else
            value = @getStyle(node, intrinsic)
        else
          value = null
      #else if GSS.dummy.style.hasOwnProperty(property) || (property == 'x' || property == 'y')
      #  if @properties.intrinsic[property]
      #    val = @properties.intrinsic[property].call(@, node, continuation)
      #    console.error('precalc', node, property, value)
      #    (@computed ||= {})[path] = val
      else if @[property]
        value = @[property](node, continuation)
      else return
    if primitive
      return @values.set(id, property, value)
    else
      if value != undefined
        (@measured ||= {})[path] = value
    return if returnPath then path else value

  # Decide common parent for all mutated nodes
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

  # Trigger scheduled reflow and suggest updated measurements
  getSuggestions: (reflow) ->
    suggestions = undefined
    if (reflow)
      @restyles.render(null, @reflown)
    @reflown = undefined

    if @measured
      for property, value of @measured
        if value? && value != @values[property]
          (suggestions ||= []).push ['suggest', property, value, 'required']
      @values.merge @measured
      @measured = undefined

    return suggestions


module.exports = Measurements