
Node = GSS.Node

rule_cid = 0

class Rule extends Node
  
  isRule: true    
  
  constructor: (o) ->
    rule_cid++
    @cid = rule_cid
    
    for key, val of o
      @[key] = val
    
    @boundConditionals = []
    
    if @name is 'else' or @name is 'elseif' or @name is "if"
      @isConditional = true
    
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
  
  install: () ->
    if @commands then @engine.run @ #install?
  
  uninstall: ()->
  
  update: () ->    
    @Type.update.call(@)
  
  update___: () ->
    if @commands
      @engine.run @
    @Type.update.call(@)
  
  
  # Tree traversal
  # -----------------------------------------
  
  nextSibling: () ->
    i = @parent.rules.indexOf @
    return @parent.rules[i+1]
    
  prevSibling: () ->
    i = @parent.rules.indexOf @
    return @parent.rules[i-1]
    
    
  
  # Selector Context
  # -----------------------------------------
  
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
      
  # conditionals
  # ----------------------------------
  
  gatherCondCommand: ->
    command = ["cond"]    
    next = @
    nextIsConditional = true
    while nextIsConditional
      command.push next.getClauseCommand()
      next = next.nextSibling()
      nextIsConditional = next?.isConditional
    return command
      
  getClauseCommand: ->
    return ["clause", @clause, @getClauseTracker()]
  
  getClauseTracker: ->
    return "cond:#{@cid}"
  
  injectChildrenCondtionals: (conditional) ->
    for rule in @rules
      rule.boundConditionals.push conditional
      rule.isCondtionalBound = true
      rule.injectChildrenCondtionals()
  
  
Rule.types =
  
  directive: 
    
    update: ->
      if @name is 'else' or @name is 'elseif'
        @injectChildrenCondtionals(@)
        return @
      else if @name is 'if'
        @commands = [@gatherCondCommand()]
        @injectChildrenCondtionals(@)
        @install()
      else        
        @install()        
  
  
  constraint: 
    update: -> 
      @install()    
  
  style: 
    update: ->
  
  ruleset: 
    update: ->

module.exports = Rule      