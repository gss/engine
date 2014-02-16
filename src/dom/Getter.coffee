# Encapsulates DOM reads

getScrollbarWidth = ->
  inner = document.createElement("p")
  inner.style.width = "100%"
  inner.style.height = "200px"
  outer = document.createElement("div")
  outer.style.position = "absolute"
  outer.style.top = "0px"
  outer.style.left = "0px"
  outer.style.visibility = "hidden"
  outer.style.width = "200px"
  outer.style.height = "150px"
  outer.style.overflow = "hidden"
  
  # added by D4, *seems* to fix potential zoom issues
  outer.style.zoom = "document"
  
  outer.appendChild inner
  document.body.appendChild outer
  w1 = inner.offsetWidth
  outer.style.overflow = "scroll"
  w2 = inner.offsetWidth
  w2 = outer.clientWidth  if w1 is w2
  document.body.removeChild outer
  return w1 - w2

scrollbarWidth = null

class Getter
  
  constructor: (@scope) ->
    @styleNodes = null
    @scope = document unless @scope
  
  clean: ->
  
  destroy: ->
    @scope = null
    @styleNodes = null    
   
   
  scrollbarWidth: ->
    scrollbarWidth = getScrollbarWidth() if !scrollbarWidth
    return scrollbarWidth
    
  
  get: (selector) ->
    method = selector[0]
    identifier = selector[1]
    switch method
      when "$reserved"
        if identifier is 'this'
          return @scope
      when "$id"
        # TODO: Restrict to scope
        if identifier[0] is '#'
          identifier = identifier.substr 1
        return document.getElementById identifier
      when "$class"
        if identifier[0] is '.'
          identifier = identifier.substr 1
        return @scope.getElementsByClassName identifier
      when "$tag"
        return @scope.getElementsByTagName identifier
    @scope.querySelectorAll identifier  
  
  measure: (node, dimension) ->
    switch dimension
      when 'width', 'w'
        return node.getBoundingClientRect().width
      when 'height', 'h'
        return node.getBoundingClientRect().height
      when 'left', 'x'
        scroll = window.scrollX or window.scrollLeft or 0
        return node.getBoundingClientRect().left + scroll
      when 'top', 'y'
        scroll = window.scrollY or window.scrollTop or 0
        return node.getBoundingClientRect().top + scroll
      # Read-only values
      when 'bottom'
        return @measure(node, 'top') + @measure(node, 'height')
      when 'right'
        return @measure(node, 'left') + @measure(node, 'width')
      when 'centerX'
        return @measure(node, 'left') + @measure(node, 'width') / 2
      when 'centerY'
        return @measure(node, 'top') + @measure(node, 'height') / 2
  
  offsets: (element) ->
    offsets =
      x: 0
      y: 0
    return offsets unless element.offsetParent
    element = element.offsetParent
    loop
      offsets.x += element.offsetLeft
      offsets.y += element.offsetTop
      break unless element.offsetParent
      element = element.offsetParent
    return offsets
    
  view: (node) ->
    return GSS.View.byId[GSS.getId(node)]
  
  getAllStyleNodes: () ->
    # get live nodeList only once
    #if !@styleNodes
    #  @styleNodes = @scope.getElementsByTagName("style")
    #return @styleNodes
    return @scope.getElementsByTagName("style")
  
  readAllASTs: () ->
    ASTs = []
    for node in @getAllStyleNodes()
      AST = @readAST node
      if AST then ASTs.push AST
    return ASTs
  
  scopeFor: (node) ->
    if @isStyleNode node
      return @scopeForStyleNode node
    else
      return @nearestScope node
  
  isStyleNode: (node) ->  
    tagName = node?.tagName
    if tagName is "STYLE" or tagName is "LINK"
      mime = node.getAttribute?("type")
      if mime
        return (mime.indexOf("text/gss") is 0)
    return false      
  
  scopeForStyleNode: (node) ->
    scoped = node.getAttribute 'scoped'
    if scoped? and scoped isnt "false"
      return node.parentElement
    else
      return Getter.getRootScope()  
  
  isScope: (el) ->
    return !!el?._gss_is_scope
  
  nearestScope: (el, skipSelf = false) ->
    if skipSelf
      el = el.parentElement
    while el.parentElement 
      if @isScope(el) then return el
      el = el.parentElement
    return null  
    
  nearestEngine: (el, skipSelf = false) ->
    scope = @nearestScope el, skipSelf
    if scope then return @engine scope
    return null
  
  descdendantNodes: (el) ->
    return el.getElementsByTagName("*")
  
  engine: (el) ->
    return GSS.engines.byId[GSS.getId(el)]
    
  
  # returns null if not a styleNode, returns {} if styleNode is empty    
  readAST: (node) ->
    #return if node._gss_processed
    mime = node.getAttribute("type")
    reader = @["readAST:#{mime}"]
    if reader then return reader.call @, node
    return null
  
  'readAST:text/gss-ast': (node) ->
    source = node.textContent.trim()
    if source.length is 0 then return {}
    try 
      ast = JSON.parse source
    catch e
      console.error "Parsing compiled gss error", console.dir e
    return ast    
    
  'readAST:text/gss': (node) ->
    throw new Error "did not include GSS's compilers"
  

Getter.getRootScope = ->
  if !ShadowDOMPolyfill?
    return document.body
  else
    return ShadowDOMPolyfill.wrap document.body

module.exports = Getter
