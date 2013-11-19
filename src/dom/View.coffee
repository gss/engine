
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
    @values = {}
    @
    
  attach: (@el,@id) =>
    
    if !@el then throw new Error "View needs el"
    if !@id then throw new Error "View needs id"
    View.byId[@id] = @
    @is_positioned = false
  
  recycle: () =>
    @scope = null
    @is_positioned = false
    @el = null
    delete View.byId[@id]
    @id = null
    @offsets = null
    @style = null    
    @values = {}
    View.recycled.push @
      
  is_positioned: false
  
  setupForPositioning: () ->
    #@updateOffsets()
    if !@is_positioned
      @style.position = 'absolute'
      @style.margin = '0px'
      @style.top = '0px'
      @style.left = '0px'
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

  needsDisplay: false

  display: (offsets) ->
    #o = @values
    return unless @values
    o = {}
    for key, val of @values
      o[key] = val
    if o.x? or o.y?
      @style[transformPrefix] = "" # " translateZ(0px)"
      if o.x?
        #@style.left = o.x - offsets.x + "px"
        @style[transformPrefix] += " translateX(#{o.x - offsets.x}px)"
        delete o.x
      if o.y?
        #@style.top = o.y - offsets.y + "px"
        @style[transformPrefix] += " translateY(#{o.y - offsets.y}px)"        
        delete o.y
    if o.width?
      @style.width = o.width + "px"
      delete o.width
    if o.height?
      @style.height = o.height + "px"
      delete o.height
    for key,val of o
      @style[key] = val + "px"
    for key, val of @style
      @el.style[key] = val
  
  displayIfNeeded: (offsets = {x:0,y:0}) ->
    if @needsDisplay 
      @display(offsets)      
      @setNeedsDisplay false
    offsets =
      x:0
      y:0
    if @values.x
      offsets.x += @values.x
    if @values.y
      offsets.y += @values.y
    @_displayChildrenIfNeeded(offsets)
  
  setNeedsDisplay: (bool) ->    
    if bool
      @needsDisplay = true
    else
      @needsDisplay = false
  
  _displayChildrenIfNeeded: (offsets) ->
    for child in @el.children
      view = GSS.get.view(child)
      if view
        view.displayIfNeeded(offsets)    
  
  # - digests css intentions to be used for `display()`
  # - used to batch last minute DOM reads (offsetParent)
  updateValues: (o) ->
    @values = o
    
    # reset style
    @style = {}

    if (o.x?) or (o.y?) # assuming left & top are normalized
      @setupForPositioning()
      
    @setNeedsDisplay true           

    @
  
  getParentView: () ->
    el = @el.parentElement
    loop
      gid = el._gss_id
      if gid
        return View.byId[gid]
      break unless el.parentElement
      el = el.parentElement
  



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