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
      for rule in @rules
        rule.install()
    @
  
  reset: ->    
    @needsInstall = true
    for rule in @rules
      rule.reset()
  
  loadRulesFromNode: ->
    #@destroyRules()
    @rules = []
    rules = GSS.get.readAST @el
    @addRules rules    
  
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

StyleSheet.fromNode = (node) ->
  if node.gssStyleSheet then return node.gssStyleSheet
  if !GSS.get.isStyleNode(node) then return null    
    
  engine = GSS(scope: GSS.get.scopeForStyleNode(node))
  
  sheet = new GSS.StyleSheet {
    el: node
    engine: engine
    engineId: engine.id
  }
  sheet.loadRulesFromNode()
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
    nodes = document.querySelectorAll "style"
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