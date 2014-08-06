# Functions are only called for primitive values
# When it encounters variables, it leaves expression to solver

# Provide some values for solver to crunch
# Simplifies expressions, caches DOM computations

# Measurements happen synchronously,
# re-measurements are deferred to be done in bulk

Numeric = require('../domains/Numeric')
Native  = require('../methods/Native')

class Intrinsic extends Numeric
  priority: -Infinity
  
  Queries:     require('../modules/Queries')
  Positions:   require('../modules/Positions')
  Types:       require('../methods/Types')
  Units:       require('../methods/Units')
  Style:       require('../concepts/Style')

  Methods:     Native::mixin {},
               require('../methods/Types'),
               require('../methods/Units'),
               require('../methods/Selectors'),
               require('../methods/Rules'),
               require('../methods/Native'),
               require('../methods/Transformations')

  Properties:  Native::mixin {},
               require('../properties/Dimensions'),
               require('../properties/Styles')

  constructor: () ->
    @engine.queries   ||= new @Queries(@)
    @engine.positions ||= new @Positions(@)
    @types              = new @Types(@)
    @units              = new @Units(@)

    @scope = document unless @scope
    
    if @scope.nodeType == 9 && ['complete', 'interactive', 'loaded'].indexOf(@scope.readyState) == -1
      @scope.addEventListener 'DOMContentLoaded', @
    else if @running
      @compile()

    @scope.addEventListener 'scroll', @
    window.addEventListener 'resize', @

    super

  events:
    resize: (e = '::window') ->
      id = e.target && @identity.provide(e.target) || e
      @solve id + ' resized', ->
        @intrinsic.verify(id, "width", undefined, false)
        @intrinsic.verify(id, "height", undefined, false)
      
    scroll: (e = '::window') ->
      id = e.target && @identity.provide(e.target) || e
      @solve id + ' scrolled', ->
        @intrinsic.verify(id, "scroll-top", undefined, false)
        @intrinsic.verify(id, "scroll-left", undefined, false)

    solve: ->
      # Unreference removed elements
      if @removed
        for id in @removed
          @identity.unset(id)
        @removed = undefined

    # Observe stylesheets in dom
    DOMContentLoaded: ->
      @scope.removeEventListener 'DOMContentLoaded', @
      @start()

    # Observe and parse stylesheets
    compile: ->
      @intrinsic.queries.connect()
      @engine.solve 'Intrinsic', 'stylesheets', [
        ['eval',  ['$attribute', ['$tag', 'style'], '*=', 'type', 'text/gss']]
        ['load',  ['$attribute', ['$tag', 'link' ], '*=', 'type', 'text/gss']]
      ]

    destroy: ->
      @scope.removeEventListener 'DOMContentLoaded', @
      @scope.removeEventListener 'scroll', @
      window.removeEventListener 'resize', @
      @engine.events.destroy.apply(@, arguments)
    

  # Trigger scheduled reflow and suggest updated measurements
  flush: (reflow) ->
    suggestions = undefined
    if (reflow)
      @positions.render(null, @reflown)
    @reflown = undefined

    if @buffer
      for property, value of @buffer
        if value? && value != @values[property]
          (suggestions ||= []).push ['suggest', property, value, 'required']
      @values.merge @buffer
      @buffer = undefined

  getComputedStyle: (element, force) ->
    unless (old = element.currentStyle)?
      computed = (@computed ||= {})
      id = @identity.provide(element)
      old = computed[id]
      if force || !old?
        return computed[id] = window.getComputedStyle(element)
    return old

  set: (element, property) -> 
    element.style[property] = value

  get: ->
    prop = @camelize(property)
    value = element.style[property]
    if value == ''
      value = @getComputedStyle(element)[prop]
    value = @toPrimitive(value, null, null, null, element, prop)
    if value.push && typeof value[0] == 'object'
      return @properties[property].apply(@, value)
    else
      return @properties[property].call(@, value)

  # Triggered on possibly resized element by mutation observer
  # If an element is known to listen for its intrinsic properties
  # schedule a reflow on that element. If another element is already
  # scheduled for reflow, reflow shared parent element of both elements 
  validate: (node) ->
    return unless subscribers = @_subscribers
    reflown = undefined
    while node
      if node == @scope
        if @reflown
          reflown = @getCommonParent(reflown, @reflown)
        else
          reflown = @scope
        break
      if node == @reflown
        break 
      if id = node._gss_id
        if properties = subscribers[id]
          reflown = node
      node = node.parentNode
    @reflown = reflown

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

  update: (node, x, y, styles, full) ->
    return unless @_subscribers
    if id = node._gss_id
      if properties = @_subscribers[id]
        for prop in properties
          continue if full && (prop == 'width' || prop == 'height')

          path = id + "[intrinsic-" + prop + "]"
        
          switch prop
            when "x"
              (@buffer ||= {})[path] = x + node.offsetLeft
            when "y"
              (@buffer ||= {})[path] = y + node.offsetTop
            when "width"
              (@buffer ||= {})[path] = node.offsetWidth
            when "height"
              (@buffer ||= {})[path] = node.offsetHeight
            else
              @values.set null, path, @getStyle(node, prop)

  # Intrinsics cant run in worker
  url: null

module.exports = Intrinsic