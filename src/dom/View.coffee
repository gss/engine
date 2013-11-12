
#transformPrefix = Modernizr.prefixed('transform')

# from: http://blogs.msdn.com/b/ie/archive/2011/10/28/a-best-practice-for-programming-with-vendor-prefixes.aspx
firstSupportedStylePrefix = (prefixedPropertyNames) ->
  tempDiv = document.createElement("div")
  for name in prefixedPropertyNames
    if (typeof tempDiv.style[name] != 'undefined')
      return name
  return null

transformPrefix = firstSupportedStylePrefix(["transform", "msTransform", "MozTransform", "WebkitTransform", "OTransform"])

class View  
  
  constructor: () ->
    @
    
  attach: (@el,@id) =>
    if !@el then throw new Error "View needs el"
    if !@id then throw new Error "View needs id"
    View.byId[@id] = @
    @is_positioned = false
    ###
    @engine = GSS.get.nearestEngine(@el)
    console.log GSS.get.nearestEngine(@el)
    @engine.on "beforeDestroy", @onEngineDestroy
    ###
    
    #@engine = null
  
  # first to set owns...
  ###
  setEngineIfNeeded: (engine) ->
    if !@engine
      @engine = engine
      @engine.on "beforeDestroy", @onEngineDestroy
  ###
        
  onEngineDestroy: =>
    @engine.off "beforeDestroy", @onEngineDestroy
    GSS._id_killed(@id) # -> @recycle()

  
  recycle: () =>
    @scope = null
    @is_positioned = false
    @el = null
    delete View.byId[@id]
    @id = null
    @offsets = null
    @style = null    
    View.recycled.push @
      
  is_positioned: false
  
  setupForPositioning: () ->
    @updateOffsets()
    if !@is_positioned
      @style.position = 'absolute'
      @style.margin = '0px'
    @is_positioned = true
        
  updateOffsets: () ->
    @offsets = @getOffsets()
    
  getOffsets: () ->
    el = @el
    if !GSS.config.useOffsetParent 
      return { 
        x:0
        y:0
      }
    offsets =
      x: 0
      y: 0
    return offsets unless el.offsetParent
    el = el.offsetParent
    loop
      offsets.x += el.offsetLeft
      offsets.y += el.offsetTop
      break unless el.offsetParent
      el = el.offsetParent
    return offsets

  display: () ->
    for key, val of @style
      @el.style[key] = val
  
  # - digests css intentions to be used for `display()`
  # - used to batch last minute DOM reads (offsetParent)
  setCSS: (o) ->

    @style = {}    
    
    if (o.x?) or (o.y?) # assuming left & top are normalized
      @setupForPositioning()      
      #@style[transformPrefix] = ""
      if o.x
        @style.left = o.x - @offsets.x + "px"
        #@style[transformPrefix] += "translateX(#{o.x - @offsets.x}px)"
      if o.y
        @style.top = o.y - @offsets.y + "px"
        #@style[transformPrefix] += " translateY(#{o.y - @offsets.y}px)"
        
    if o.width?
      @style.width = o.width + "px"
    if o.height?
      @style.height = o.height + "px"
    @

View.byId = {}

View.recycled = []

View.count = 0

View.new = ({el,id}) ->
  View.count++
  if View.recycled.length > 0
    view = View.recycled.pop()
  else
    view = new View()
  view.attach el, id


module.exports = View