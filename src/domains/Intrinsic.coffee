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

  restyle: (element, property, value = '') -> 
    switch property
      when "x"
        property = "left"
      when "y"
        property = "top"

    return unless prop = @properties[property]

    if typeof value != 'string'
      value = prop.toString(value)
    console.log('restyle', element, property, value)
    element.style[@camelize property] = value

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
        prop = path.substring(j + 1, path.length - 1)
        if (prop = @properties[property]).axiom
          return prop.call(@, object, continuation)
        else if prop && typeof prop != 'function'
          return prop
    return Numeric::get.apply(@, arguments)


  # Triggered on possibly resized element by mutation observer
  # If an element is known to listen for its intrinsic properties
  # schedule a reflow on that element. If another element is already
  # scheduled for reflow, reflow shared parent element of both elements 
  validate: (node) ->
    return unless subscribers = @objects
    reflown = undefined
    while node
      if node == @scope
        if @engine.workflow.reflown
          reflown = @getCommonParent(reflown, @engine.workflow)
        else
          reflown = @scope
        break
      if node == @engine.workflow.reflown
        break 
      if id = node._gss_id
        if properties = subscribers[id]
          reflown = node
      node = node.parentNode
    @engine.workflow.reflown = reflown

  # Compute value of a property, reads the styles on elements
  verify: (node, property, continuation, old, returnPath, primitive) ->
    if node == window
      id = '::window'
    else if node.nodeType
      id = @identity.provide(node)
    else
      id = node
      node = @ids[id]

    path = @getPath(id, property)

    unless (value = @buffer?[path])?
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
      # dom measurement
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
        (@buffer ||= {})[path] = value
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

    return suggestions


  # Iterate elements and measure intrinsic offsets
  each: (parent, callback, x,y, offsetParent, a,r,g,s) ->
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
      if child.nodeType = 1
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
      console.log(num, value, 5)
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
              @set id, prop, @getStyle(node, @engine.getIntrinsicProperty(prop))


  @condition: ->
    window?  
  url: null
module.exports = Intrinsic