_rule_cid = 0

class Rule
  
  isRule: true    
  
  constructor: (o) ->
    _rule_cid++
    @cid = _rule_cid
    
    # TODO: unroll
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
  
  addRules: (rules) ->
    for r in rules
      r.parent = @
      r.styleSheet = @styleSheet      
      r.engine = @engine
      rule = new GSS.Rule r
      @rules.push rule
  
  _selectorContext: null
  
  needsInstall: true
  
  install: ->
    if @needsInstall
      @needsInstall = false
      @Type.install.call(@)      
    for rule in @rules
      rule.install()
    @
      
  uninstall: ()->
  
  reset: ->
    @needsInstall = true
    @boundConditionals = []
    for rule in @rules
      rule.reset()
  
  executeCommands: () ->
    if @commands then @engine.run @ #install?
  
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
      if !parent.isConditional # conditionals don't add to selector context
        if parent?.selectors?.length > 0
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
    return "gss-cond-#{@cid}"
  
  injectChildrenCondtionals: (conditional) ->
    for rule in @rules
      rule.boundConditionals.push conditional
      if rule.commands
        for command in rule.commands
          command.push ["where", conditional.getClauseTracker()]
      rule.isCondtionalBound = true
      rule.injectChildrenCondtionals(conditional)
  
  # CSS dumping
  # ----------------------------------------
  
  setNeedsDumpCSS: (bool) ->
    if bool
      @styleSheet.setNeedsDumpCSS true
  
  dumpCSS: ->
    css = @Type.dumpCSS?.call(@)
    for rule in @rules
      ruleCSS = rule.dumpCSS()
      css = css + ruleCSS if ruleCSS
    return css
    
  
Rule.types =
  
  directive: 
    
    install: ->
      if @name is 'else' or @name is 'elseif'
        @injectChildrenCondtionals(@)
        return @
      else if @name is 'if'
        
        @commands = [@gatherCondCommand()]
        @injectChildrenCondtionals(@)
        @executeCommands()
      else        
        @executeCommands()
  
  
  constraint: 
    install: -> 
      @executeCommands()
  
  style:
    install: ->
      @setNeedsDumpCSS(true)
    dumpCSS: ->
  
  ruleset: 
    install: ->
    dumpCSS: ->
      foundStyle = false
      css = ""
      effectiveSelector = null
      for rule in @rules
        if rule.type is "style"
          if !foundStyle
            effectiveSelector = rule.getSelectorContext().join(", ")
            foundStyle = true
          css = css + rule.key + ":" + rule.val + ";"   
      if foundStyle        
        # TODO: conditionals?
        css = effectiveSelector + "{" + css + "}"
      return css
          
module.exports = Rule      