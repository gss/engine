# Functions are only called for primitive values
# When it encounters variables, it leaves expression to solver

# Provide some values for solver to crunch
# Simplifies expressions, caches DOM computations

# Measurements happen synchronously,
# re-measurements are deferred to be done in bulk

Numeric   = require('./Numeric')



class Intrinsic extends Numeric
  priority: 100
  immediate: true
  url: null

  Style:        require('../Style')
  Unit:         require('../commands/Unit')
  Getters:      require('../properties/Getters')
  Styles:       require('../properties/Styles')

  Gradient:     require('../types/Gradient')
  Matrix:       require('../types/Matrix')
  Easing:       require('../types/Easing')
  Color:        require('../types/Color')
  URL:          require('../types/URL')

  @Primitive:   require('../types/Primitive')
  Number:       @Primitive.Number
  Integer:      @Primitive.Integer
  String:       @Primitive.String
  Strings:      @Primitive.Strings
  Size:         @Primitive.Size
  Position:     @Primitive.Position

  Properties: do ->
    Properties = (engine) ->
      if engine
        @engine = engine
      return
    Properties.prototype = new Intrinsic::Styles
    Properties.prototype = new Properties
    for property, value of Intrinsic::Getters::
      Properties::[property] = value
    Properties

  events:
    write: (solution) ->
      if solution# && Object.keys(solution).length
        @intrinsic.assign(solution)

    remove: (path) ->
      @intrinsic.remove(path)

    validate: (solution, update) ->
      if @intrinsic.subscribers && update.domains.indexOf(@intrinsic, update.index + 1) == -1
        
        @intrinsic.verify('::window', 'width')
        @intrinsic.verify('::window', 'height')
        @intrinsic.verify(@scope, 'width')
        @intrinsic.verify(@scope, 'height')
        
        if measured = @intrinsic.solve()
          if true#Object.keys(measured).length
            update.apply measured
            @solved.merge measured



  getComputedStyle: (element, force) ->
    unless (old = element.currentStyle)?
      computed = (@computed ||= {})
      id = @identify(element)
      old = computed[id]
      if force || !old?
        return computed[id] = window.getComputedStyle(element)
    return old

  restyle: (element, property, value = '', continuation, operation) -> 
    switch property
      when "x"
        property = "left"
      when "y"
        property = "top"

    return unless (prop = @properties[property])?.matcher
    camel = @camelize property
    if typeof value != 'string'
      value = prop.format(value)

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

    if parent = operation
      while parent.parent
        parent = parent.parent
        if parent.command.type == 'Condition' && !parent.command.global
          break

      if parent.command.parse
        if parent.command.set @, operation, @Command::delimit(continuation), element, property, value
          return
    path = @getPath(element, 'intrinsic-' + property)
    if @watchers?[path]
      return


    element.style[camel] = value
    return



  perform: ->
    if arguments.length < 4 && @subscribers
      @console.start('Measure', @values)
      @each @scope, 'measure'
      @console.end(@changes)
    return @commit()

  get: (object, property) ->
    path = @getPath(object, property)

    unless (value = Numeric::get.call(@, null, path))?
      if (value = @fetch(path))?
        @set(null, path, value)
    return value# || 0

  fetch: (path) ->
    if (prop = @properties[path])?
      if typeof prop == 'function'
        return prop.call(@, object)
      else
        return prop
      return value
    else 
      if (j = path.indexOf('[')) > -1
        id = path.substring(0, j)
        property = path.substring(j + 1, path.length - 1)
        object = @identity.solve(path.substring(0, j))

        if (prop = @properties[property])?
          if prop.axiom
            return prop.call(@, object)
          else if typeof prop != 'function'
            return prop
          else if !prop.matcher && property.indexOf('intrinsic') == -1
            return prop.call(@, object)

  check: (id, property) ->
    if @properties[property]? || property.indexOf('intrinsic-') == 0 || property.indexOf('computed-') == 0
      return true
    if @properties[id._gss_id || id]
      if @properties[(id._gss_id || id) + '[' + property + ']']?
        return true


  verify: (object, property) ->
    path = @getPath(object, property)
    if @values.hasOwnProperty(path)
      @set(null, path, @fetch(path))


  # Iterate elements and measure intrinsic offsets
  each: (parent, callback, x = 0,y = 0, a,r,g,s) ->
    scope = @engine.scope
    
    if (parent ||= scope).nodeType == 9
      @verify(parent, 'width')
      @verify(parent, 'height')
      parent = parent.body

    # Calculate new offsets for given element and styles
    if offsets = @[callback](parent, x, y, a,r,g,s)
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

    while child
      if child.nodeType == 1
        if child.style.position == 'relative'
          @each(child, callback, 0, 0, a,r,g,s)
        else
          if measure && child.offsetParent == parent
            x += parent.offsetLeft + parent.clientLeft
            y += parent.offsetTop + parent.clientTop
            measure = false
          @each(child, callback, x, y, a,r,g,s)
        
      child = child.nextSibling
    return a

  getStyle: (node, property) ->
    value = node.style[property] || @getComputedStyle(node)[property]
    if value
      num = parseFloat(value)
      if String(num) == String(value) || (num + 'px') == value
        return num
    return value
    
  # Reset intrinsic style when observed initially
  subscribe: (id, property) ->
    if (node = @identity.solve(id)) && node.nodeType == 1
      property = property.replace(/^intrinsic-/, '')
      path = @getPath(id, property)
      if @engine.values.hasOwnProperty(path) || @engine.updating.solution?.hasOwnProperty(path)
        node.style[property] = ''

  unsubscribe: (id, property, path) ->
    @solved.set path, null
    @set path, null

  measure: (node, x, y, full) ->
    if id = node._gss_id
      if properties = @subscribers[id]
        for prop of properties
          switch prop
            when "x", "intrinsic-x", "computed-x"
              @set id, prop, x + node.offsetLeft
            when "y", "intrinsic-y", "computed-y"
              @set id, prop, y + node.offsetTop
            when "width", "intrinsic-width", "computed-width"
              @set id, prop, node.offsetWidth
            when "height", "intrinsic-height", "computed-height"
              @set id, prop, node.offsetHeight
            else
              style = prop.replace(/^(?:computed|intrinsic)-/, '')
              if @properties[style]?.matcher
                @set id, prop, @getStyle(node, style)
              else
                @set id, prop, @get(node, style)

    return

  camelize: (string) ->
    return string.toLowerCase().replace /-([a-z])/gi, (match) ->
      return match[1].toUpperCase()

  dasherize: (string) ->
    return string.replace /[A-Z]/g, (match) ->
      return '-' + match[0].toLowerCase()
      
  @condition: ->
    @scope?


  ### 
  Applies style changes in bulk, separates reflows & positions.
  It recursively offsets global coordinates to respect offset parent, 
  then sets new positions
  ###

  assign: (data, node) ->
    node ||= @engine.scope

    # Apply changed styles in batch, 
    # leave out positioning properties (Restyle/Reflow)
    positioning = {}
    if data
      for path, value of data
        unless value == undefined
          @write null, path, value, positioning

    # Adjust positioning styles to respect element offsets 
    @each(node, 'placehold', null, null, positioning, !!data)

    # Set new positions in bulk (Reflow)
    positions = {}
    for id, styles of positioning
      for prop, value of styles
        positions[@getPath(id, prop)] = value

    @engine.fireEvent('positions', positions)

    for prop, value of positions
      @write null, prop, value

    return data

  write: (id, property, value, positioning) ->
    # parse $id[property] as [id, property]
    unless id?
      path = property
      last = path.lastIndexOf('[')
      return if last == -1
      property = path.substring(last + 1, path.length - 1)
      id = path.substring(0, last)

    return unless id.charAt(0) != ':'
    unless element = @engine.identity[id]
      return if id.indexOf('"') > -1
      return unless element = document.getElementById(id.substring(1))
    
    if positioning && (property == 'x' || property == 'y')
      (positioning[id] ||= {})[property] = value
    else
      @restyle(element, property, value)

  # Calculate offsets according to new values (but dont set anything)
  placehold: (element, x, y, positioning, full) ->
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
      # @engine.intrinsic.update(element, x, y, full)


    return offsets
module.exports = Intrinsic