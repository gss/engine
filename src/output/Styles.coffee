class Styles
  @Matrix: require('../../vendor/gl-matrix.js')

  constructor: (@engine) -> 

  # Receive solved styles
  read: (data) ->
    @lastInput = JSON.parse JSON.stringify data

    intrinsic = null

    # Filter out intrinsic properties, ignore their non-intrinsic parts
    for path, value of data
      index = path.indexOf('[intrinsic-')
      if index > -1
        property = path.substring(index + 1, path.length - 1)
        data[prop] = undefined
        (intrinsic ||= {})[path] = value



    # Step 1: Apply changed styles in batch, 
    # leave out positioning properties (Restyle!)
    positioning = {}
    for path, value of data
      @set(path, undefined, value, positioning)

    # Step 2: Position elements in natural order (Restyle contd.)
    @render(positioning)

    # Step 3: Re-measure elements (Reflow!)
    for path, value of intrinsic

    if intrinsic
      for path, value of intrinsic
        @set(path, undefined, value, positioning, true)
        
    
    else
      @engine.triggerEvent('solved', data, intrinsic)

  write: (data) ->
    @engine.merge(data)

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
    element = @references.get(path)
    camel = @camelize(property)
    style = element.style
    value = style[camel]
    if value != undefined
      return value
    @

  set: (path, property, value, positioning, intrinsic) ->
    if property == undefined
      last = path.lastIndexOf('[')
      property = path.substring(last + 1, path.length - 1)
      path = path.substring(0, last)

    return unless element = @engine.references.get(path)
    if this.positioners[prop]
      (positioning[path] ||= {})[property] = value
    else
      if intrinsic
        result = @engine.context['[' + property + ']'](element)
        if result != value

        else



      camel = @camelize(property)
      style = element.style
      if style[camel] != undefined
        if typeof value == 'number' && property != 'zIndex'
          value += 'px'
        style[camel] = value
    @


  render: (positioning, parent, x, y) ->
    parent = @engine.scope unless parent
    if offsets = @position(positioning, parent, x, y)
      x += offsets.x || 0
      y += offsets.y || 0
    for child in @engine.context['>'](parent)
      @render(positioning, child, x, y)

    
  position: (positioning, element, x, y) ->
    if uid = element._gss_id
      if styles = positioning[uid]
        offsets = null
        for property, value of styles
          switch property
            when "x"
              @set(uid, property, value - x)
              (offsets ||= {}).x = value - x
            when "y"
              @set(uid, property, value - y)
              (offsets ||= {}).y = value - y

    return offsets

  matrix: (positioning, element) ->
    
  positioners: ['x', 'y']

    
module.exports = Styles