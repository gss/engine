Rule = GSS.Rule
Node = GSS.Node

class StyleSheet extends Node
  
  isScoped: false    
  ###    
  ownerNode:  Node
  engine:     Engine
  rules:      []
  isScoped:   Boolean  
  ###  
  constructor: (o = {}) ->  
    for key, val of o
      @[key] = val  
    
    if !@engine then throw new Error "StyleSheet needs engine"
    
    
    @engine.styleSheets.push @
    
    if o.isScoped?
      @isScoped = o.isScoped
    
    @styleSheet = @
    
    @rules = []
    if o.rules      
      @addRules o.rules
    
  update: ->
    # do nothing      


class StyleSheet.Collection
  
  constructor: ->
    collection = []
    for key, val of @
      collection[key] = val
    return collection
    
  update: ->
    for sheet in @
      sheet.updateIfNeeded()
  
  queryAll: () ->
    nodes = document.querySelectorAll "style"
    for node in nodes
      @addStyleNode node
  
  addStyleNode: (node) ->
    if node.gssStyleSheet then return null    
    if !GSS.get.isStyleNode(node) then return null    
    engine = GSS(scope:scope)
    rules = @getter.readAST node
    styleSheet = @add {
      ownerNode: node
      engine: engine
      engineId: engine.id
      rules: rules
    }
    node.gssStyleSheet = styleSheet
    styleSheet
  
  add: (o) ->
    styleSheet = new GSS.StyleSheet o
    @push styleSheet
    styleSheet      
  
  remove: () ->
  
module.exports = StyleSheet