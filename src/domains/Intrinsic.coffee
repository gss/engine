# Functions are only called for primitive values
# When it encounters variables, it leaves expression to solver

# Provide some values for solver to crunch
# Simplifies expressions, caches DOM computations

# Measurements happen synchronously,
# re-measurements are deferred to be done in bulk

Numeric    = require('./Numeric')
Dimensions = require('../properties/Dimensions')
Styles     = require('../properties/Styles')

class Intrinsic extends Numeric
  priority: 100
  subscribing: true
  immediate: true
  
  Unit:           require('../commands/Unit')
  Style:          require('../commands/Style')
  Type:           require('../commands/Type')
  Transformation: require('../commands/Transformation')

  Properties: do ->
    Properties = ->
    for property, value of Styles::
      Properties::[property] = value
    for property, value of Dimensions::
      Properties::[property] = value
    Properties

  constructor: ->
    @types = new @Type(@)
    super

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
      bits = continuation.split(@queries.DESCEND)
      first = bits.shift()
      if (j = first.lastIndexOf('$')) > -1
        id = first.substring(j)
        if command = (stylesheet = @identity[id])?.command
          parent = operation
          while parent = parent.parent
            if parent[0] == 'if'# && parent[1].marked
              shared = false
              break
          if shared != false
            if command.set @, operation, @queries.delimit(continuation), stylesheet, element, property, value
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

  
  url: null

module.exports = Intrinsic