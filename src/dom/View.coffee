
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
  
  @transformPrefix: transformPrefix
  
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
    @parentOffsets = null
    @style = null    
    @values = {}
    View.recycled.push @
      
  is_positioned: false
  
  positionIfNeeded: () ->
    #@updateOffsets()
    if !@is_positioned
      @style.position = 'absolute'
      @style.margin = '0px'
      @style.top = '0px'
      @style.left = '0px'
    @is_positioned = true
        
  updateParentOffsets: () ->
    @parentOffsets = @getParentOffsets()
  
  getParentOffsets: () ->
    box = @el.getBoundingClientRect()
    return {
      y: box.top + (window.pageYOffset or document.documentElement.scrollTop) - (document.documentElement.clientTop or 0),
      x: box.left + (window.pageXOffset or document.documentElement.scrollLeft) - (document.documentElement.clientLeft or 0)
    }
  
  getParentOffsets__: () ->
    # http://jsperf.com/offset-vs-getboundingclientrect/7
    el = @el
    ###
    if !GSS.config.useOffsetParent 
      return { 
        x:0
        y:0
      }
    ###
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
      if @parentOffsets
        offsets.x += @parentOffsets.x
        offsets.y += @parentOffsets.y
      @style[transformPrefix] = "" # " translateZ(0px)"
      if o.x?
        #@style.left = o.x - offsets.x + "px"
        @style[transformPrefix] += " translateX(#{o.x - offsets.x}px)"
        delete o.x
      if o.y?
        #@style.top = o.y - offsets.y + "px"
        @style[transformPrefix] += " translateY(#{o.y - offsets.y}px)"        
        delete o.y
    
    if o['z-index']?
      @style['z-index'] = o['z-index']
      delete o['z-index']
    ###   
    if o['line-height']?
      @style['line-height'] = o['line-height']
      delete o['line-height']
    ###
    ###
    if o.width?
      @style.width = o.width + "px"
      delete o.width
    if o.height?
      @style.height = o.height + "px"
      delete o.height
    ###
    for key,val of o
      @style[key] = val + "px"
    for key, val of @style
      @el.style[key] = val
    @
  
  displayIfNeeded: (offsets = {x:0,y:0}, pass_to_children=true) ->
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
    if pass_to_children
      @displayChildrenIfNeeded(offsets)
  
  setNeedsDisplay: (bool) ->    
    if bool
      @needsDisplay = true
    else
      @needsDisplay = false
  
  displayChildrenIfNeeded: (offsets) ->
    @_displayChildrenIfNeeded(@el, offsets, 0)
  
  _displayChildrenIfNeeded: (el, offsets, recurseLevel) ->    
    if recurseLevel <= GSS.config.maxDisplayRecursionDepth
      for child in el.children
        view = GSS.get.view(child)
        if view
          view.displayIfNeeded(offsets)
        else
          @_displayChildrenIfNeeded child, offsets, recurseLevel+1
                
  # - digests css intentions to be used for `display()`
  # - used to batch last minute DOM reads (offsetParent)
  updateValues: (o) ->
    @values = o  
    
    # reset style
    @style = {}
        
    if @el.getAttribute('gss-parent-offsets')?
      @updateParentOffsets()

    if (o.x?) or (o.y?) # assuming left & top are normalized
      @positionIfNeeded()
      
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
  

# Pooling

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