class Styles
  @Matrix: require('../../vendor/gl-matrix.js')

  constructor: (@engine) -> 

  # Receive solved styles
  pull: (data) ->
    @lastInput = JSON.parse JSON.stringify data

    intrinsic = null

    # Filter out measurements 
    for path, value of data
      if property = @engine._getIntrinsicProperty(path)
        data[path] = undefined
        if property != 'intrinsic-x' && property != 'intrinsic-y'
          (intrinsic ||= {})[path] = value


    positioning = @render(data)
    
    # Re-measure elements
    if intrinsic
      for path, value of intrinsic
        data[path] = @set(path, undefined, value, positioning, true)

    # Merge data from previous pass
    if @data
      for path, value of @data
        if data[path] == undefined && value != undefined
          data[path] = value
      @data = undefined

    # Launch 2nd pass for changed intrinsics if any (Resolve, Restyle, Reflow) 
    @data = data
    if suggestions = @engine._getSuggestions()
      capture = @engine.expressions.capture(suggestions.length + ' intrinsics')
      @engine.pull(suggestions)
      @engine.expressions.release() if capture
    else
      @data = undefined
      @push(data)

  push: (data) ->
    @engine.push(data)

  remove: (id) ->
    delete @[id]

  get: (path, property, value) ->
    element = @engine[path]
    camel = (@camelized ||= {})[property] ||= @engine._camelize(property)
    style = element.style
    value = style[camel]
    if value != undefined
      return value
    @

  set: (id, property, value, positioning, intrinsic) ->
    # parse $id[property] as [id, property]
    if property == undefined
      path = id
      last = id.lastIndexOf('[')
      property = path.substring(last + 1, id.length - 1)
      id = id.substring(0, last)

    return unless id.charAt(0) != ':'
    unless element = @engine.elements[id]
      return unless element = @engine._getElementById(@engine.scope, id.substring(1))
    positioner = this.positioners[property]
    if positioning && positioner
      (positioning[id] ||= {})[property] = value
    else
      # Re-measure and re-suggest intrinsics if necessary
      if intrinsic
        path = @engine._compute(element,  property, undefined, value)
        if (val = @engine.computed[path])?
          value = val
        return value
        
      if positioner
        positioned = positioner(element)
        if typeof positioned == 'string'
          property = positioned
      camel = (@camelized ||= {})[property] ||= @engine._camelize(property)
      style = element.style
      if style[camel] != undefined
        if typeof value == 'number' && (camel != 'zIndex' && camel != 'opacity')
          pixels = Math.round(value) + 'px'
        if (positioner)
          if !style[camel]
            if (style.positioning = (style.positioning || 0) + 1) == 1
              style.position = 'absolute'
          else unless value?
            unless --style.positioning 
              style.position = ''
        style[camel] = pixels ? value
    value

  render: (data, node) ->
    @engine.queries.disconnect()

    # Apply changed styles in batch, 
    # leave out positioning properties (Restyle/Reflow)
    positioning = {}
    if data
      for path, value of data
        unless value == undefined
          @set(path, undefined, value, positioning)

    # Adjust positioning styles to respect element offsets 
    @adjust(node, null, null, positioning, null, !!data)

    #  Set new positions in bulk (Reflow)
    for id, styles of positioning
      for prop, value of styles
        @set id, prop, value
        
    queries = @engine.queries.connect()
    return positioning

  # Position things
  adjust: (parent, x = 0, y = 0, positioning, offsetParent, full) ->
    scope = @engine.scope
    parent ||= scope
    # Calculate new offsets for given element and styles
    if offsets = @placehold(positioning, parent, x, y, full)
      x += offsets.x || 0
      y += offsets.y || 0

    # Select all children
    if parent == document
      parent = document.body
    children = @engine.commands['$>'][1](parent);

    if parent.offsetParent == scope
      x -= scope.offsetLeft
      y -= scope.offsetTop
    else if parent != scope
      # When rendering a positioned element, measure its offsets
      if !offsets && children?.length && children[0].offsetParent == parent
        x += parent.offsetLeft + parent.clientLeft
        y += parent.offsetTop + parent.clientTop
        offsetParent = parent

    # Position children
    if children
      for child in children
        @adjust(child, x, y, positioning, offsetParent, full)
    return positioning

  # Calculate offsets according to new values (but dont set anything)
  placehold: (positioning, element, x, y, full) ->
    offsets = undefined
    if uid = element._gss_id
      # Adjust newly set positions to respect parent offsets
      styles = positioning?[uid]
      if values = @engine.values
        if styles?.x == undefined
          if (left = values[uid + '[x]'])?
            (styles ||= (positioning[uid] ||= {})).x = left
        if styles?.y == undefined
          if (top = values[uid + '[y]'])?
            (styles ||= (positioning[uid] ||= {})).y = top

      if styles
        for property, value of styles
          unless value == null
            switch property
              when "x"
                styles.x = value - x
                (offsets ||= {}).x = value - x
              when "y"
                styles.y = value - y
                (offsets ||= {}).y = value - y

      # Let other measurements hook up into this batch
      @engine._onMeasure(element, x, y, styles, full)


    return offsets
    
  positioners:
    x: -> 'left'
    y: -> 'top'
    
module.exports = Styles