# Encapsulates DOM reads

class Getter
  
  constructor: (@container) ->
    @styleNodes = null
    @container = document unless @container
  
  clean: ->
  
  destroy: ->
    @container = null
    @styleNodes = null    
   
  get: (selector) ->
    method = selector[0]
    identifier = selector[1]
    switch method
      when "$reserved"
        if identifier is 'this'
          return @container
      when "$id"
        # TODO: Restrict to container
        if identifier[0] is '#'
          identifier = identifier.substr 1
        return document.getElementById identifier
      when "$class"
        if identifier[0] is '.'
          identifier = identifier.substr 1
        return @container.getElementsByClassName identifier
      when "$tag"
        return @container.getElementsByTagName identifier
    @container.querySelectorAll identifier  
  
  getId: (el) ->
    if el?.getAttribute? then return el.getAttribute('data-gss-id')
    return null
      
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
  
  getAllStyleNodes: () ->
    # get live nodeList only once
    if !@styleNodes
      @styleNodes = @container.getElementsByTagName("style")
    return @styleNodes
  
  readAllASTs: () ->
    ASTs = []
    for node in @getAllStyleNodes()
      AST = @readAST node
      if AST then ASTs.push AST
    return ASTs
  
  hasAST: (node) ->  
    mime = node.getAttribute?("type")
    if mime
      return (mime.indexOf("text/gss") is 0)
    return false
  
  #getNearestEngine:
  
  getEngineForStyleNode: (node) ->
    return node.parentElement
  
  # returns null if not a styleNode, returns {} if styleNode is empty    
  readAST: (node) ->
    #return if node._gss_processed
    mime = node.getAttribute("type")
    reader = @["readAST:#{mime}"]
    if reader then return reader.call @, node
    return null
  
  'readAST:text/gss-ast': (node) ->
    source = node.innerHTML.trim()
    if source.length is 0 then return {}
    try 
      ast = JSON.parse source
    catch e
      console.error "Parsing compiled gss error", console.dir e
    return ast    
    
  'readAST:text/gss': (node) ->
    throw new Error "did not include GSS's compilers"

module.exports = Getter
