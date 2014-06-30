class Styles
  @Matrix: require('../../vendor/gl-matrix.js')

  constructor: (@engine) -> 

  # Receive solved styles
  pull: (data) ->
    @lastInput = JSON.parse JSON.stringify data

    intrinsic = null
    @engine.start()

    # Filter out measurements 
    for path, value of data
      if property = @engine._getIntrinsicProperty(path)
        data[path] = undefined
        if property != 'intrinsic-x' && property != 'intrinsic-y'
          (intrinsic ||= {})[path] = value

    # Apply changed styles in batch, 
    # leave out positioning properties (Restyle/Reflow)
    positioning = {}
    @engine.queries.disconnect()
    for path, value of data
      unless value == undefined
        @set(path, undefined, value, positioning)
    @engine.queries.connect()

    # Adjust positioning styles to respect 
    # element offsets 
    @render(null, null, null, positioning, null, true)

    #  Set new positions in bulk (Restyle)
    for id, styles of positioning
      for prop, value of styles
        @set id, prop, value

    # Re-measure elements (Reflow)
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
    if suggests = @engine._getComputedProperties()
      @engine.pull(suggests)
    else
      @data = undefined
      @push(data)

  push: (data) ->
    @engine.push(data)

  remove: (id) ->
    delete @[id]

  get: (path, property, value) ->
    element = @engine.get(path)
    camel = (@camelized ||= {})[property] ||= @engine._camelize(property)
    style = element.style
    value = style[camel]
    if value != undefined
      return value
    @

  set: (id, property, value, positioning, intrinsic) ->
    # parse $id[property] as id
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
        measured = @engine._compute(element,  property, undefined, value)
        if measured?
          value = measured
        return value
        
      if positioner
        positioned = positioner(element)
        if typeof positioned == 'string'
          property = positioned
      camel = (@camelized ||= {})[property] ||= @engine._camelize(property)
      style = element.style
      if style[camel] != undefined
        if typeof value == 'number' && property != 'zIndex'
          pixels = value + 'px'
        if (positioner)
          if !style[camel]
            if (style.positioning = (style.positioning || 0) + 1) == 1
              style.position = 'absolute'
          else if !value
            unless --style.positioning 
              style.position = ''
        style[camel] = pixels || value
    @

  # Position 
  render: (parent, x = 0, y = 0, positioning, offsetParent, full) ->
    scope = @engine.scope
    parent ||= scope
    # Calculate new offsets for given element and styles
    if offsets = @placehold(positioning, parent, x, y, full)
      x += offsets.left
      y += offsets.top

    # Select all children
    children = @engine['_>'][1](parent);

    if parent.offsetParent == scope
      x -= scope.offsetLeft
      y -= scope.offsetTop
    else if parent != scope
      # When rendering a positioned element, measure its offsets
      if !offsets && children.length && children[0].offsetParent == parent
        x += parent.offsetLeft + parent.clientLeft
        y += parent.offsetTop + parent.clientTop
        offsetParent = parent


    # Position children
    for child in children
      @render(child, x, y, positioning, offsetParent, full)
    return @

  # Calculate offsets according to new values (but dont set anything)
  placehold: (positioning, element, x, y, full) ->
    if uid = element._gss_id
      if styles = positioning?[uid]
        offsets = {left: 0, top: 0}
        for property, value of styles
          unless value == null
            switch property
              when "x"
                styles.x = value - x
                offsets.left = value - x
              when "y"
                styles.y = value - y
                offsets.top = value - y
      @engine._onMeasure(element, x, y, styles, full)


    return offsets
    
  positioners:
    x: -> 'left'
    y: -> 'top'
    
module.exports = Styles