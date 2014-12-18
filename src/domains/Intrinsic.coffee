# Functions are only called for primitive values
# When it encounters variables, it leaves expression to solver

# Provide some values for solver to crunch
# Simplifies expressions, caches DOM computations

# Measurements happen synchronously,
# re-measurements are deferred to be done in bulk

Numeric    = require('./Numeric')


class Intrinsic extends Numeric
  priority: 100
  subscribing: true
  immediate: true
  url: null
  
  Style:          require('../Style')

  Styles:         require('../properties/Styles')
  Units:          require('../properties/Units')
  Types:          require('../properties/Types')
  Transformation: require('../properties/Transformations')
  Dimensions:     require('../properties/Dimensions')

  Properties: do ->
    Properties = ->
    Properties.prototype = new Intrinsic::Styles
    Properties.prototype = new Properties
    for property, value of Intrinsic::Dimensions::
      Properties::[property] = value
    Properties::Units = Intrinsic::Units
    Properties::Types = Intrinsic::Types
    Properties

  events:
    write: (solution) ->
      @Selector?.disconnect(@, true)
      @intrinsic.assign(solution)
      @Selector?.connect(@, true)

    validate: (solution, update) ->
      if @intrinsic?.objects && update.domains.indexOf(@intrinsic, update.index + 1) == -1
        measured = @intrinsic.solve()
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

    if continuation
      bits = continuation.split(@Command::DESCEND)
      first = bits.shift()
      if (j = first.lastIndexOf('$')) > -1
        id = first.substring(j)
        if command = (stylesheet = @identity[id])?.command
          parent = operation
          while parent = parent.parent
            if parent[0] == 'rule'
              break
            if parent[0] == 'if' && !parent.command.global
              shared = false
              break
          if shared != false
            if command.set @, operation, @Command::delimit(continuation), stylesheet, element, property, value
              return

    path = @getPath(element, 'intrinsic-' + property)
    if @watchers?[path]
      return
    element.style[camel] = value
    return



  perform: ->
    if arguments.length < 4
      @each @scope, @measure
      @console.row('Intrinsic', @changes)
      return @changes
    return

  everything: {
    'intrinsic-width', 'intrinsic-height', 'intrinsic-x', 'intrinsic-y'
  }

  get: (object, property, continuation) ->
    path = @getPath(object, property)

    if (prop = @properties[path])?
      if typeof prop == 'function'
        value = prop.call(@, object, continuation)
      else
        value = prop
      @set null, path, value
      return value
    else 
      if (j = path.indexOf('[')) > -1
        id = path.substring(0, j)
        property = path.substring(j + 1, path.length - 1)
        object = @identity.solve(path.substring(0, j))

        if (prop = @properties[property])?
          if prop.axiom
            return prop.call(@, object, continuation)
          else if typeof prop != 'function'
            return prop
          else if !prop.matcher && property.indexOf('intrinsic') == -1
            return prop.call(@, object, continuation)
    return Numeric::get.call(@, null, path, continuation)


  # Triggered on possibly resized element by mutation observer
  # If an element is known to listen for its intrinsic properties
  # schedule a reflow on that element. If another element is already
  # scheduled for reflow, reflow shared parent element of both elements 
  validate: (node) ->
    return unless subscribers = @objects

    @engine.updating.reflown = @scope

  verify: (object, property, continuation) ->
    path = @getPath(object, property)
    if @values.hasOwnProperty(path)
      @set(null, path, @get(null, path, continuation))


  # Iterate elements and measure intrinsic offsets
  each: (parent, callback, x = 0,y = 0, offsetParent, a,r,g,s) ->
    scope = @engine.scope
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

  getStyle: (node, property) ->
    value = node.style[property] || @getComputedStyle(node)[property]
    if value
      num = parseFloat(value)
      if String(num) == String(value) || (num + 'px') == value
        return num
    return value
    
  # Reset intrinsic style when observed initially
  onWatch: (id, property) ->
    if (node = @identity.solve(id)) && node.nodeType == 1
      if property.indexOf('intrinsic-') > -1
        property = property.substring(10)
      if @engine.values[@getPath(id, property)] != undefined
        node.style[property] = ''

  measure: (node, x, y, full) ->
    return unless @objects
    if id = node._gss_id
      if properties = @objects[id]
        for prop of properties
          continue if full && (prop == 'width' || prop == 'height')
        
          switch prop
            when "x", "intrinsic-x"
              @set id, prop, x + node.offsetLeft
            when "y", "intrinsic-y"
              @set id, prop, y + node.offsetTop
            when "width", "intrinsic-width"
              @set id, prop, node.offsetWidth
            when "height", "intrinsic-height"
              @set id, prop, node.offsetHeight
            else
              style = @getIntrinsicProperty(prop) || prop
              if @properties[style]?.matcher
                @set id, prop, @getStyle(node, style)
              else
                @set id, prop, @get(node, prop)

    return

  # Return name of intrinsic property used in property path 
  getIntrinsicProperty: (path) ->
    index = path.indexOf('intrinsic-')
    if index > -1
      if (last = path.indexOf(']', index)) == -1
        last = undefined
      return property = path.substring(index + 10, last)
 
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
    node ||= @reflown || @engine.scope

    # Apply changed styles in batch, 
    # leave out positioning properties (Restyle/Reflow)
    positioning = {}
    if data
      for path, value of data
        unless value == undefined
          @write null, path, value, positioning

    # Adjust positioning styles to respect element offsets 
    @each(node, @placehold, null, null, null, positioning, !!data)

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