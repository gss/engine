# Functions are only called for primitive values
# When it encounters variables, it leaves expression to solver

# Provide some values for solver to crunch
# Simplifies expressions, caches DOM computations

# Measurements happen synchronously,
# re-measurements are deferred to be done in bulk

Numeric = require('./Numeric')
Native = require('../methods/Native')
class Intrinsic extends Numeric
  priority: 100
  structured: true
  
  Types:       require('../methods/Types')
  Units:       require('../methods/Units')
  Style:       require('../concepts/Style')

  Methods:     Native::mixin((new Numeric::Methods),
               require('../methods/Types'),
               require('../methods/Units'),
               require('../methods/Transformations'))

  Properties:  Native::mixin {},
               require('../properties/Dimensions'),
               require('../properties/Styles')

  constructor: ->
    @types = new @Types(@)
    @units = new @Units(@)

  getComputedStyle: (element, force) ->
    unless (old = element.currentStyle)?
      computed = (@computed ||= {})
      id = @identity.provide(element)
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

    return unless prop = @properties[property]
    camel = @camelize property
    if typeof value != 'string'
      value = prop.toString(value)

    if property == 'left' || property == 'top'

      if element.style[camel] == ''
        if value?
          element.style.positioned = (element.style.positioned || 0) + 1
      else 
        if !value?
          element.style.positioned = (element.style.positioned || 0) - 1
      if element.style.positioned == 1
        element.style.position = 'absolute'
      else if element.style.positioned == 0
        element.style.position = ''

    if continuation
      bits = continuation.split(@DESCEND)
      if (j = bits[0].lastIndexOf('$')) > -1
        id = bits[0].substring(j)
        if (stylesheet = @identity[id])?.tagName == 'STYLE'
          if @stylesheets.solve stylesheet, operation, @getContinuation(continuation), element, property, value
            return

    element.style[camel] = value
    return



  solve: ->
    Numeric::solve.apply(@, arguments)
    @each @scope, @update

  get: (object, property, continuation) ->
    path = @getPath(object, property)
    if (prop = @properties[path])?
      if typeof prop == 'function'
        return prop.call(@, object, continuation)
      else
        return prop
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
        @each(child, callback, x, y, offsetParent, a,r,g,s)
        index++

      child = child.nextSibling
    return a

  getStyle: (node, property) ->
    value = node.style[property] || @getComputedStyle(node)[property]
    if value
      num = parseFloat(value)
      if `num == value` || (num + 'px') == value
        return num
    return value

  update: (node, x, y, full) ->
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
              style = @getIntrinsicProperty(prop)
              if @properties[style]?.matcher
                @set id, prop, @getStyle(node, style)
              else
                @set id, prop, @get(node, prop)

    return

  @condition: ->
    @scope?
    
  url: null
module.exports = Intrinsic