
transformPrefix = GSS._.transformPrefix

class View  
  
  constructor: () ->    
    @values = {}
    @
  
  matrixType: null
  
  attach: (@el,@id) =>    
    if !@el then throw new Error "View needs el"
    if !@id then throw new Error "View needs id"
    View.byId[@id] = @
    @is_positioned = false   
    
    GSS.trigger 'view:attach', @
    
    if !@matrixType
      @matrixType = GSS.config.defaultMatrixType
    @Matrix = GSS.glMatrix[@matrixType] or throw new Error "View matrixType not found: #{@matrixType}"
    if !@matrix # create once      
      @matrix = @Matrix.create()
    @
  
  recycle: () =>
    
    GSS.trigger 'view:detach', @
    
    @scope = null
    @is_positioned = false
    @el = null
    delete View.byId[@id]
    @id = null
    @parentOffsets = null
    @style = null
    @Matrix.identity(@matrix)
    @matrixType = null
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
      if o.x?        
        xLocal = o.x - offsets.x
        delete o.x
      else
        xLocal = 0
      if o.y?
        yLocal = o.y - offsets.y
        delete o.y 
      else
        yLocal = 0
      #if o.z?
      if !GSS.config.fractionalPixels
        xLocal = Math.round xLocal
        yLocal = Math.round yLocal
      @values.xLocal = xLocal
      @values.yLocal = yLocal
      @_positionMatrix(xLocal, yLocal)
    
    if o['z-index']?
      @style['zIndex'] = o['z-index']
      delete o['z-index']
    ###   
    if o['line-height']?
      @style['line-height'] = o['line-height']
      delete o['line-height']
    ###
    
    if !GSS.config.fractionalPixels
      if o.width?  then o.width  = Math.round o.width
      if o.height? then o.height = Math.round o.height
      
      
    for key,val of o
      key = GSS._.camelize( key ) # b/c Mozilla
      @style[key] = val + "px"
    for key, val of @style
      @el.style[key] = val
    @
  
  ###
  _positionTranslate: (xLocal, yLocal) ->
    @style[transformPrefix] += " translateX(#{@xLocal}px)"
    @style[transformPrefix] += " translateY(#{@yLocal}px)"        
  ###
  
  _positionMatrix: (xLocal, yLocal) ->
    @Matrix.translate(@matrix,@matrix,[xLocal,yLocal,0])
    @style[transformPrefix] = GSS._[@matrixType + "ToCSS"]( @matrix )
  
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
      children = el.children
      return null if !children
      for child in children
        view = GSS.get.view(child)
        if view
          view.displayIfNeeded(offsets)
        else
          @_displayChildrenIfNeeded child, offsets, recurseLevel+1
                
  # - digests css intentions to be used for `display()`
  # - used to batch last minute DOM reads (offsetParent)
  updateValues: (o) ->        
    @values = o  
    
    # reset style & matrix
    @style = {}
    @Matrix.identity(@matrix)
        
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