class Styles
  @Matrix: require('../../vendor/gl-matrix.js')

  constructor: (@engine) -> 

  # Receive solved styles
  pull: (data) ->
    @lastInput = JSON.parse JSON.stringify data

    intrinsic = null

    # Filter out measurements 
    for path, value of data
      if @engine.context.getIntrinsicProperty(path)
        data[path] = undefined
        (intrinsic ||= {})[path] = value

    # Apply changed styles in batch, 
    # leave out positioning properties (Restyle/Reflow)
    positioning = {}
    for path, value of data
      @set(path, undefined, value, positioning)

    # Adjust positioning styles to respect 
    # element offsets 
    @render(positioning)

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
    if @resuggest(data)
      @data = data
    else
      @push(data)

  resuggest: (data) ->
    if @engine.computed
      suggests = []
      for property, value of @engine.computed
        if value != @engine.values[property]
          suggests.push ['suggest', property, value, 'required']
      @engine.computed = undefined
      if suggests.length
        @engine.pull suggests
        return suggests

  push: (data) ->
    @engine.push(data)

  remove: (id) ->
    delete @[id]

  camelize: (string) ->
    return (@camelized ||= {})[string] ||= 
      string.toLowerCase().replace /-([a-z])/i, (match) ->
        return match[1].toUpperCase()

  dasherize: (string) ->
    return (@dasherized ||= {})[string] ||= 
      string.replace /[A-Z]/, (match) ->
        return '-' + match[0].toLowerCase()

  get: (path, property, value) ->
    element = @engine.get(path)
    camel = @camelize(property)
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

    return unless id.charAt(0) != ':' && element = @engine[id]
    positioner = this.positioners[property]
    if positioning && positioner
      (positioning[id] ||= {})[property] = value
    else
      # Re-measure and re-suggest intrinsics if necessary
      if intrinsic
        measured = @engine.context.compute(element,  '[' + property + ']', undefined, value)
        if measured?
          value = measured
        return value
        
      if positioner
        positioned = positioner(element)
        if typeof positioned == 'string'
          property = positioned
      camel = @camelize(property)
      style = element.style
      if style[camel] != undefined
        if typeof value == 'number' && property != 'zIndex'
          pixels = value + 'px'
        style[camel] = pixels || value
    @

  # Position 
  render: (positioning, parent, x, y, offsetParent) ->
    parent = @engine.scope unless parent
    # Calculate new offsets for given element and styles
    if offsets = @preposition(positioning, parent, x, y)
      x += offsets.left
      y += offsets.top

    # Select all children
    children = @engine.context['>'][1](parent);

    # When rendering a positioned element, measure its offsets
    if offsetParent && !offsets && children.length && children[0].parentOffset == parent
      x += parent.offsetLeft
      y += parent.offsetTop
      offsetParent = parent

    # Position children
    for child in children
      @render(positioning, child, x, y, offsetParent)

  # Calculate offsets according to new values (but dont set anything)
  preposition: (positioning, element, x, y) ->
    if uid = element._gss_id
      if styles = positioning[uid]
        offsets = {left: 0, top: 0}
        for property, value of styles
          unless value == null
            switch property
              when "x"
                styles.x = value - (x || 0)
                offsets.left = value - (x || 0)
              when "y"
                styles.y = value - (y || 0)
                offsets.top = value - (y || 0)

    return offsets
    
  positioners:
    x: -> 'left'
    y: -> 'top'
    
module.exports = Styles