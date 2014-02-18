Rule = GSS.Rule

class StyleSheet
  
  isScoped: false        
  
  ###    
  el:  Node
  engine:     Engine
  rules:      []
  isScoped:   Boolean  
  ###  
  constructor: (o = {}) ->  
    for key, val of o
      @[key] = val  
    
    if !@engine then throw new Error "StyleSheet needs engine"
      
    @engine.styleSheets.push @
    
    GSS.styleSheets.push @
    
    @isRemote = false
    @remoteSourceText = null
    if @el
      tagName = @el.tagName
      if tagName is "LINK"
        @isRemote = true    
    
    
    @rules = []
    if o.rules      
      @addRules o.rules
      
    return @      
    
  addRules: (rules) ->
    for r in rules
      r.parent = @
      r.styleSheet = @      
      r.engine = @engine
      rule = new GSS.Rule r
      @rules.push rule
  
  needsInstall: true           
  
  install: () ->
    if @needsInstall
      @needsInstall = false
      @_install()
    @
  
  reinstall: () ->
    @_install()
  
  installNewRules: (rules) ->
    @rules = []
    @addRules rules
    for rule in @rules
      rule.install()
  
  _install: ->    
    if @isRemote
      @_installRemote()
    else if @el
      @_installInline()
    else 
      for rule in @rules
        rule.install()
  
  _installInline: ->
    #@destroyRules()
    @installNewRules GSS.get.readAST @el
  
  _installRemote: () ->
    if @remoteSourceText
      return @installNewRules GSS.compile @remoteSourceText
    url = @el.getAttribute('href')
    if !url then return null
    req = new XMLHttpRequest
    req.onreadystatechange = () =>
      return unless req.readyState is 4
      return unless req.status is 200
      @remoteSourceText = req.responseText.trim()
      @installNewRules GSS.compile @remoteSourceText
    req.open 'GET', url, true
    req.send null
  
  reset: ->    
    @needsInstall = true
    for rule in @rules
      rule.reset()     
  
  destroyRules: ->
    for rule in @rules
      rule.destroy()
    @rules = []
  
  destroy: () ->
    i = @engine.styleSheets.indexOf @
    @engine.styleSheets.splice i, 1
    
    i = GSS.styleSheets.indexOf @
    GSS.styleSheets.splice i, 1
    
    #...
  
  isRemoved: ->
    if @el and !document.contains @el
      return true
    return false
    
  
  # CSS dumping
  # ----------------------------------------
  
  needsDumpCSS: false
  
  setNeedsDumpCSS: (bool) ->
    if bool
      @engine.setNeedsDumpCSS true
      @needsDumpCSS = true
    else
      @needsDumpCSS = false
    
  
  dumpCSSIfNeeded: ->
    if @needsDumpCSS
      #@needsDumpCSS = false
      @dumpCSS()
    
  dumpCSS: ->
    css = ""
    for rule in @rules
      ruleCSS = rule.dumpCSS()
      css = css + ruleCSS if ruleCSS
    return css

StyleSheet.fromNode = (node) ->
  if node.gssStyleSheet then return node.gssStyleSheet
  #if !GSS.get.isStyleNode(node) then return null    
    
  engine = GSS(scope: GSS.get.scopeForStyleNode(node))  
  
  sheet = new GSS.StyleSheet {
    el: node
    engine: engine
    engineId: engine.id
  }
  node.gssStyleSheet = sheet
  return sheet




class StyleSheet.Collection
  
  constructor: ->
    collection = []
    for key, val of @
      collection[key] = val
    return collection
    
  install: ->
    for sheet in @
      sheet.install()
    @
  
  findAndInstall: () ->
    nodes = document.querySelectorAll '[type="text/gss"], [type="text/gss-ast"]'
    for node in nodes
      sheet = GSS.StyleSheet.fromNode node
      sheet?.install()
    @
  
  
  findAllRemoved: ->
    removed = []
    for sheet in @
      if sheet.isRemoved() then removed.push sheet
    return removed
    



GSS.StyleSheet = StyleSheet

GSS.styleSheets = new GSS.StyleSheet.Collection()

module.exports = StyleSheet