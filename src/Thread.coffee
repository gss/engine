class Thread

  constructor: ->
    @
  
  needsSetup: true
  
  setupIfNeeded: () ->
    return @ unless @needsSetup
    @needsSetup           = false
    @solver               = new c.SimplexSolver()
    @solver.autoSolve     = false
    @cachedVars           = {}          
    @constraintsByTracker = {}
    @varIdsByTracker      = {}
    @__editVarNames       = []
    @  
  
  # Worker interface
  # ------------------------------------------------
    
  postMessage: (message) ->
    # wrapper to make easier to work without webworkers    
    @execute message
    @
  
  terminate: () ->
    @needsSetup           = true
    @solver               = null
    @cachedVars           = null    
    @constraintsByTracker = null
    @varIdsByTracker      = null
    @__editVarNames       = null
    @   
      
  # API
  # ------------------------------------------------
  
  execute: (message) =>
    @setupIfNeeded()
    for command in message.commands
      @_execute command, command
    #for vs in message.vars
    #  @_execute vs
    #for cs in message.constraints
    #  @solver.addConstraint @_execute cs
    @

  _execute: (command, root) =>
    node = command
    func = @[node[0]]
    if !func?
      throw new Error("Thread.execute broke, couldn't find method: #{node[0]}")
    # recursive excution
    for sub, i in node[1..node.length]
      if sub instanceof Array # then recurse
        node.splice i+1,1,@_execute sub, root
    return func.call @, root, node[1...node.length]...

  getValues: () ->
    #@solver.resolve()
    @solver.solve()
    o = {}
    for id of @cachedVars
      o[id] = @cachedVars[id].value
    return o
    
  # Cassowary Commands
  # ------------------------------------------------

  number: (root, num) ->
    return Number(num)
    
  _trackVarId: (id,tracker) ->
    if !@varIdsByTracker[tracker] then @varIdsByTracker[tracker] = []
    if @varIdsByTracker[tracker].indexOf(id) is -1 then @varIdsByTracker[tracker].push(id)

  var: (self, id, tracker) ->
    if @cachedVars[id]
      return @cachedVars[id]
    v = new c.Variable {name:id}
    # vars can only have one tracker
    if tracker
      @_trackVarId id, tracker
      v._tracker = tracker
      v._is_tracked = true
    @cachedVars[id] = v
    return v

  varexp: (self, id, expression, tracker) -> # an expression accessed like a variable
    cv = @cachedVars
    if cv[id]
      return cv[id]
    if !(expression instanceof c.Expression)
      throw new Error("Thread `varexp` requires an instance of c.Expression")
    # Return new instance of expression everytime it is accessed.
    # Unlike `c.Variable`s, `c.Expression` need to be cloned to work properly
    # because... math =)
    Object.defineProperty cv, id,
      get: ->
        clone = expression.clone()
        # varexps can only have one tracker
        if tracker
          @_trackVarId id, tracker
          clone._tracker = tracker
          clone._is_tracked = true
        # TODO: Add value getter to expressions...
        return clone
    return expression
  
  _trackRootIfNeeded: (root,tracker) ->
    if tracker
      root._is_tracked = true
      if !root._trackers then root._trackers = []
      if  root._trackers.indexOf(tracker) is -1 then root._trackers.push(tracker)
  
  get$: (root, prop, elId, selector) ->
        
    @_trackRootIfNeeded root, elId    
    if selector
      @_trackRootIfNeeded root, selector + elId    
    
    return @_get$ prop, elId
    
        
  _get$: (prop, elId) ->
    varId = elId + "[#{prop}]"        
    switch prop
      when "right"
        exp = c.plus( @_get$("x", elId), @_get$("width", elId) )
        return @varexp null, varId, exp, elId
      when "bottom"
        exp = c.plus( @_get$("y", elId), @_get$("height", elId) )
        return @varexp null, varId, exp, elId
      when "center-x"
        exp = c.plus( @_get$("x", elId), c.divide(@_get$("width", elId),2) )
        return @varexp null, varId, exp, elId
      when "center-y"
        exp = c.plus( @_get$("y", elId), c.divide(@_get$("height", elId),2) )
        return @varexp null, varId, exp, elId        
      else
        return @var null, varId, elId
    
    
  
  # The `get` command registers all trackable information to the root constraint commands
  get: (root, id, tracker) ->
    if tracker 
      @_trackRootIfNeeded root, tracker
    v = @cachedVars[id]
    if v      
      @_trackRootIfNeeded root, v.tracker
      return v
    else 
      v = @var null, id
      return v
      
    throw new Error("AST method 'get' couldn't find var with id: #{id}")

  plus: (root, e1, e2) ->
    return c.plus e1, e2

  minus : (root,e1,e2) ->
    return c.minus e1, e2

  multiply: (root,e1,e2) ->
    return c.times e1, e2

  divide: (root,e1,e2,s,w) ->
    return c.divide e1, e2

  _strength: (s='required') ->
    if typeof s is 'string'
      if s is 'require' then s = 'required'
      strength = c.Strength[s]
      #if !strength? then throw new Error("Strength unrecognized: #{s}")
      return strength
    return s
    ###   
    if strength.symbolicWeight?
      return strength
    else
      throw new Error("Unrecognized Strength: #{s}")
    ###
  
  #
  _addConstraint: (root, constraint) =>
    @solver.addConstraint constraint
    if root._is_tracked
      for tracker in root._trackers
        if !@constraintsByTracker[tracker] then @constraintsByTracker[tracker] = []
        @constraintsByTracker[tracker].push constraint
    return constraint
  
  # Equation Constraints

  eq:  (self,e1,e2,s,w) =>
    return @_addConstraint(self, new c.Equation(e1, e2, @_strength(s), w))

  lte: (self,e1,e2,s,w) =>
    return @_addConstraint(self, new c.Inequality(e1, c.LEQ, e2, @_strength(s), w))

  gte: (self,e1,e2,s,w) =>
    return @_addConstraint(self, new c.Inequality(e1, c.GEQ, e2, @_strength(s), w))

  lt:  (self,e1,e2,s,w) =>
    return @_addConstraint(self, new c.Inequality(e1, c.LEQ, e2, @_strength(s), w))

  gt:  (self,e1,e2,s,w) =>
    return @_addConstraint(self, new c.Inequality(e1, c.GEQ, e2, @_strength(s), w))

  # Edit / Stay Constraints

  _editvar: (varr, s, w) =>
    if @__editVarNames.indexOf(varr.name) is -1
      @__editVarNames.push(varr.name)
      @solver.addEditVar varr, @_strength(s), w
    @  
  
  suggest: (self, varr, val, s='strong', w) =>
    # Todo
    # - Debounce solver resolution or batch suggest
    # - track edit constraints... c.EditConstraint
    
    if typeof varr is 'string' then varr = @get(self, varr)
      
    # if !@is_editing
    #  @is_editing = true
    #  @solver.beginEdit()
    
    # @solver.setEditedValue
    
    @_editvar varr, s, w
    @solver.suggestValue varr, val
    @solver.resolve()
    

  # Todo
  # - track stay constraints... c.StayConstraint
  stay: (self) =>
    args = [arguments...]
    for v in args[1...args.length]
      @solver.addStay v
    return @solver
  
  # Remove Commands
  
  'remove': (self) => # (tacker, tracker, tracker...)
    args = [arguments...]
    trackers = [args[1...args.length]...]
    for tracker in trackers
      @_remove tracker
      
  _remove: (tracker) =>
    delete @__editVarNames[tracker]
    # remove constraints
    if @constraintsByTracker[tracker]
      for constraint in @constraintsByTracker[tracker]
        try 
          @solver.removeConstraint constraint
        catch error
          #throw new Error "cant remove constraint by tracker: #{tracker}"
          movealong = 'please'
      delete @constraintsByTracker[tracker]
    # clean up varcache
    if @varIdsByTracker[tracker]
      for id in @varIdsByTracker[tracker]
        delete @cachedVars[id]
      delete @varIdsByTracker[tracker]

if module?.exports then module.exports = Thread
