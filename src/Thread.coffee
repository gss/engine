class Thread

  constructor: ->
    @cachedVars = {}
    @solver = new c.SimplexSolver()
    @solver.autoSolve = false
    @constraintsByTracker = {}
    @varIdsByTracker = {}
    @
    
  execute: (ast) =>
    for command in ast.commands
      @_execute command, command
    #
    #for vs in ast.vars
    #  @_execute vs
    #for cs in ast.constraints
    #  @solver.addConstraint @_execute cs

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

  _getValues: () ->
    #@solver.resolve()
    @solver.solve()
    o = {}
    for id of @cachedVars
      o[id] = @cachedVars[id].value
    return o

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
  
  # The `get` command registers all trackable information to the root constraint commands
  get: (root, id, tracker) ->
    v = @cachedVars[id]
    if v
      @_trackRootIfNeeded root, tracker
      @_trackRootIfNeeded root, v.tracker
      return v
    throw new Error("AST method 'get' couldn't find var with id: #{id}")

  plus: (root,e1, e2) ->
    return c.plus e1, e2

  minus : (root,e1,e2) ->
    return c.minus e1, e2

  multiply: (root,e1,e2) ->
    return c.times e1, e2

  divide: (root,e1,e2,s,w) ->
    return c.divide e1, e2

  _strength: (s) ->
    strength = c.Strength[s]
    #if !strength? then throw new Error("Strength unrecognized: #{s}")
    return strength
  
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

  _editvar: (varr, strength) =>
    return @solver.addEditVar varr
  
  # Todo
  # - track edit constraints... c.EditConstraint
  suggest: (self, varr, val, strength) =>
    
    if typeof varr is 'string' then varr = @get(self, varr)
    
    # beiginEdit?
    @_editvar varr, strength
    @solver.suggestValue varr, val
    #setEditedValue

  # Todo
  # - track stay constraints... c.StayConstraint
  stay: (self) =>
    args = [arguments...]
    for v in args[1...args.length]
      @solver.addStay v
    return @solver
  
  # Remove Commands
  
  'remove': (self,tracker) =>
    # remove constraints
    if @constraintsByTracker[tracker]
      for constraint in @constraintsByTracker[tracker]
        @solver.removeConstraint constraint
      delete @constraintsByTracker[tracker]
    # clean up varcache
    if @varIdsByTracker[tracker]
      for id in @varIdsByTracker[tracker]
        delete @cachedVars[id]
      delete @varIdsByTracker[tracker]
      
