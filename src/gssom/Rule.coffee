
Node = GSS.Node

class Rule extends Node
  
  isRule: true
  
  constructor: (o) ->
    
    for key, val of o
      @[key] = val
      
    ###
    @rules
    @commands
    @selectors
    @type
    @parent
    @styleSheet
    @isApplied
    ###
    
    @rules = []
    if o.rules      
      @addRules o.rules
    
    @Type = Rule.types[@type] or throw new Error "Rule type, #{type}, not found"
    @
  
  _selectorContext: null
  
  getSelectorContext: ->
    # TODO: invalidate & recompute?
    if !@_selectorContext
      @_selectorContext = @_computeSelectorContext()
    return @_selectorContext
  
  _computeSelectorContext: () ->    
    selectorContext = []
    
    rule = @
    while rule.parent
      parent = rule.parent
      if parent?.selectors
        if selectorContext.length is 0
          for $ in parent.selectors
            selectorContext.push $
        else
          _context = []
          for $ in parent.selectors       
            for $$ in selectorContext
              _context.push( $ + " " + $$ )
          selectorContext = _context
      rule = parent
        
    @selectorContext = selectorContext
    return selectorContext
  
  getContextQuery: ->
    if !@query
      return @setupContextQuery()
    return @query
  
  setupContextQuery: ->
    effectiveSelector = @getSelectorContext().join(", ")
    engine = @engine
    @query = engine.registerDomQuery selector:effectiveSelector, isMulti:true, isLive:false, createNodeList:() ->
      return engine.queryScope.querySelectorAll(effectiveSelector)
    
  
  update: () ->
    if @commands
      
      @engine.run @ #install?              

    @Type.update.call(@)
  
  update___: () ->
    if @commands
      @engine.run @
    @Type.update.call(@)
    
    
Rule.types =
  
  directive: 
    update: ->
  
  constraint: 
    update: ->      
  
  style: 
    update: ->
  
  ruleset: 
    update: ->

module.exports = Rule      