
transformPrefix = GSS._.transformPrefix

class View  
  
  constructor: () ->    
    @values = {}
        
    # V8:
    # Declaring vars in constructor to limit anonymous classes
    @is_positioned = false
    @el = null
    @id = null
    @parentOffsets = null
    @style = null
    @Matrix = null
    @matrixType = null
    @virtuals = null
    @
  
  attach: (@el,@id) => 
    if !@el then throw new Error "View needs el"
    if !@id then throw new Error "View needs id"
    if @el.ClassList
      @el.ClassList.patch(@el)

    View.byId[@id] = @
    @is_positioned = false
    @el.gssView = @
    
    GSS.trigger 'view:attach', @    
    if !@matrixType
      @matrixType = GSS.config.defaultMatrixType
    @Matrix = GSS.glMatrix[@matrixType] or throw new Error "View matrixType not found: #{@matrixType}"
    if !@matrix # create once      
      @matrix = @Matrix.create()
    @
  
  recycle: () =>
    
    GSS.trigger 'view:detach', @
    
    #@scope = null
    if @el.ClassList
      @el.ClassList.unpatch(@el)

    @is_positioned = false
    @el = null
    delete View.byId[@id]
    @id = null
    @parentOffsets = null
    @style = null
    @Matrix.identity(@matrix)
    @matrixType = null
    @virtuals = null
    @values = {}
    View.recycled.push @  
        
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
    
    if o['opacity']?
      @style['opacity'] = o['opacity']
      delete o['opacity']
    
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
    GSS._.setStyles(@el, @style)
    @
  
  ###
  _positionTranslate: (xLocal, yLocal) ->
    @style[transformPrefix] += " translateX(#{@xLocal}px)"
    @style[transformPrefix] += " translateY(#{@yLocal}px)"        
  ###
  
  positionIfNeeded: () ->
    #@updateOffsets()
    if !@is_positioned
      @style.position = 'absolute'
      @style.margin = '0px'
      @style.top = '0px'
      @style.left = '0px'
    @is_positioned = true
  
  _positionMatrix: (xLocal, yLocal) ->
    @Matrix.translate(@matrix,@matrix,[xLocal,yLocal,0])
    @style[transformPrefix] = GSS._[@matrixType + "ToCSS"]( @matrix )
  
  printCss: ->
    css = ""
    if @is_positioned
      css += 'position:absolute;'
      css += 'margin:0px;'
      css += 'top:0px;'
      css += 'left:0px;'
    found = false
    for key, val of @style
      found = true
      css += "#{GSS._.dasherize(key)}:#{val};"
    return "" if !found
    return "##{@id}{" + css + "}"
    
  printCssTree: (el,recurseLevel = 0) =>

    if !el
      el = @el 
      css = @printCss()
    else
      css = ""
    if recurseLevel > GSS.config.maxDisplayRecursionDepth then return ""    
    children = el.children
    return "" if !children    
    for child in children
      view = GSS.get.view(child)
      if view
        css += view.printCssTree()
      else
        css += @printCssTree child, recurseLevel+1
    return css
        
  
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
  
  
  # Virtuals
  # -----------------------------------------------------------------------
  
  addVirtuals: (names) ->
    if !@virtuals then return @virtuals = [].concat(names)
    for name in names
      @addVirtual name
    null
    
  addVirtual: (name) ->
    if !@virtuals then return @virtuals = [name]
    if @virtuals.indexOf(name) is -1 then @virtuals.push name
    null
  
  hasVirtual: (name) ->
    if !@virtuals
      return false
    else if @virtuals.indexOf(name) is -1
      return false
    return true
  
  nearestViewWithVirtual: (name) ->
    # Todo:
    # - timing edge-cases until deferred & batched query changes
    # - top level resolution
    ancestor = @
    while ancestor
      if ancestor.hasVirtual name
        return ancestor
      ancestor = ancestor.parentElement
    return null
  

# View Pooling
# ============================================================================

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