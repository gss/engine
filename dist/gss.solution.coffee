class Identity
  @uid: 0
  
  # Get or generate uid for a given object.
  provide: (object, generate) ->
    if typeof object == 'string'
      if object.charAt(0) != '$'
        return '$' + object
      else
        return object
    unless id = object._gss_id
      if object == document
        id = "::document"
      else if object == window
        id = "::window"

      unless generate == false
        object._gss_id = id ||=
          "$" + (object._gss_uid || object.id || ++Identity.uid)
        @[id] = object
    return id

class Solution

  constructor: (values, scope = document) ->
    if !@preimport
      return new Solution(values, scope)
    @scope = scope
    @identity = new Identity
    @preimport()
    @apply(values, @scope)

  preimport: ->
    @identity.provide(document.body)
    @all = document.body.getElementsByTagName('*')
    for element in @all
      @identity.provide element

  # Iterate elements and measure intrinsic offsets
  each: (parent, callback, x = 0,y = 0, offsetParent, a,r,g,s) ->
    scope = @scope
    parent ||= scope

    # Calculate new offsets for given element and styles
    if offsets = callback.call(@, parent, x, y, a,r,g,s)
      x += offsets.x || 0
      y += offsets.y || 0

    if parent.offsetParent == scope
      x -= scope.offsetLeft
      y -= scope.offsetTop
    else if parent != scope
      if !offsets
        measure = true

    # Recurse to children
    if parent == document
      parent = document.body
    child = parent.firstChild
    index = 0
    while child
      if child.nodeType == 1
        if measure && index == 0 && child.offsetParent == parent
          x += parent.offsetLeft + parent.clientLeft
          y += parent.offsetTop + parent.clientTop
          offsetParent = parent
        if child.style.position == 'relative'
          @each(child, callback, 0, 0, offsetParent, a,r,g,s)
        else
          @each(child, callback, x, y, offsetParent, a,r,g,s)
        
        index++

      child = child.nextSibling
    return a

  getPath: (id, property) ->
    return id + '[' + property + ']'

  provide: (id, property, value, positioning) ->
    # parse $id[property] as [id, property]
    unless id?
      path = property
      last = path.lastIndexOf('[')
      return if last == -1
      property = path.substring(last + 1, path.length - 1)
      id = path.substring(0, last)
    else
      path = @getPath(id, property)

    return unless id.charAt(0) != ':'
    unless element = @identity[id]
      return if id.indexOf('"') > -1
      return unless element = @scope.getElementById(id.substring(1))
    
    if positioning && (property == 'x' || property == 'y')
      (positioning[id] ||= {})[property] = value
    else
      @restyle(element, property, value)

  camelize: (string) ->
    return string.toLowerCase().replace /-([a-z])/gi, (match) ->
      return match[1].toUpperCase()

  restyle: (element, property, value = '', continuation, operation) ->
    switch property
      when "x"
        property = "left"
      when "y"
        property = "top"

    camel = @camelize property
    if typeof value != 'string'
      if property != 'z-index' && property != 'opacity'
        value = value + 'px'

    if property == 'left' || property == 'top'
      position = element.style.position
      if element.positioned == undefined
        element.positioned = + !!position
      if position && position != 'absolute'
        return
      if element.style[camel] == ''
        if value? && value != ''
          element.positioned = (element.positioned || 0) + 1
      else
        if !value? || value == ''
          element.positioned = (element.positioned || 0) - 1
      if element.positioned == 1
        element.style.position = 'absolute'
      else if element.positioned == 0
        element.style.position = ''

    element.style[camel] = value

  apply: (object, node) ->
    data = {}
    for property, value of object
      data[property] = value;

    if data.stylesheets
      unless @sheet
        @sheet = document.createElement('style')
        document.body.appendChild(@sheet)
      @sheet.textContent = @sheet.innerText = data.stylesheets
      delete data.stylesheets
    if @values
      for property, value of @values
        unless data[property]?
          data[property] = null
    # Apply changed styles in batch,
    # leave out positioning properties (Restyle/Reflow)
    positioning = {}
    if data
      for path, value of data
        unless value == undefined
          @provide null, path, value, positioning

    # Adjust positioning styles to respect element offsets
    @each(node, @placehold, null, null, null, positioning, !!data)

    # Set new positions in bulk (Reflow)
    for id, styles of positioning
      for prop, value of styles
        @provide id, prop, value
        
    for property, value of data
      delete data[property] unless value?
    unless @values
      document.body.parentNode.className += ' gss-ready'
    @values = data
        
# Calculate offsets according to new values (but dont set anything)
  placehold: (element, x, y, positioning, full) ->
    offsets = undefined
    if uid = element._gss_id
      # Adjust newly set positions to respect parent offsets
      styles = positioning?[uid]
      if values = @values
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


    return offsets

class Negotiator
  constructor: (sizes, storage, baseline = 72, callback, offset, prefix) ->
    if !@match
      return Negotiator.instance ||= new Negotiator(sizes, storage, baseline, callback, offset, prefix)
    @sizes = []
    @callback = callback
    if prefix
      @prefix = prefix + ' '
    else
      @prefix = ''
    @storage = storage || localStorage
    @offset = offset || 0
    for group in sizes
      for width in group[0]
        for height in group[1]
          @sizes.push(width + 'x' + height)
    @widths = []
    @heights = []
    for size in @sizes
      continue unless @storage[@prefix + size]
      [width, height] = size.split('x')
      @widths.push parseInt(width) * baseline
      @heights.push parseInt(height) * baseline
    window.addEventListener 'resize', =>
      @match()
    window.addEventListener 'orientationchange', =>
      setTimeout =>
        @match()
      , 50
    @match()

  match: (width = window.innerWidth + @offset, height = window.innerHeight) ->
    x = y = 0

    for w, i in @widths
      if @storage[@prefix + @sizes[i]]
        if (width - w) > 0 && (width - w) < (width - x)
          x = w

    for h, i in @heights
      if @storage[@prefix + @sizes[i]]
        if @widths[i] == x
          if !y || (Math.abs(height - h) < Math.abs(height - y))
            y = h

    return if (!y || !h)

    values = @storage[@prefix + x / 72 + 'x' + y / 72]
    if typeof values == 'string'
      values = JSON.parse(values)
    if @solution
      @solution.apply(values)
    else
      @solution = Solution(values)

    @callback(x, y, values)