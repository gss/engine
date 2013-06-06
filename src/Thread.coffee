class Thread
  
  constructor: ->
    @cachedVars = {}
    @solver = new c.SimplexSolver()
  
  unparse: (ast) =>
    for vs in ast.vars
      @_execute vs
    for cs in ast.constraints
      @solver.addConstraint @_execute cs
  
  _execute: (ast) =>
    node = ast
    func = @[node[0]]
    if !func? then throw new Error("Thread unparse broke, couldn't find method: #{node[0]}")
    for sub, i in node[1..node.length]
      if sub instanceof Array # then recurse
        node.splice i+1,1,@_execute sub
    #console.log node[0...node.length]
    return func.apply @, node[1...node.length]
  
  _getValues: () ->
    o = {}
    for id of @cachedVars
      o[id] = @cachedVars[id].value
    return o
  
  number: (num) ->
    return Number(num)
  
  var: (id, prop, context) ->
    if @cachedVars[id]
      return @cachedVars[id]
    v = new c.Variable {name:id}
    @cachedVars[id] = v
    return v
  
  get: (id) ->
    if @cachedVars[id]
      return @cachedVars[id]
    throw new Error("AST method 'get' couldn't find var with id: #{id}")
      
  plus: (e1, e2) ->
    return c.plus e1, e2 
  
  minus : (e1,e2) ->
    return c.minus e1, e2 
    
  multiply: (e1,e2) ->
    return c.plus e1, e2
    
  divide: (e1,e2,s,w) ->
    return c.divide e1, e2
  
  strength: (s) ->
    strength = c.Strength[s]
    return strength
  
  eq: (e1,e2,s,w) =>    
    return new c.Equation e1, e2, @strength(s), w
  
  lte: (e1,e2,s,w) =>    
    return new c.Inequality e1, c.LEQ, e2, @strength(s), w
  
  gte: (e1,e2,s,w) =>    
    return new c.Inequality e1, c.GEQ, e2, @strength(s), w
  
  lt: (e1,e2,s,w) =>    
    return new c.Inequality e1, c.LEQ, e2, @strength(s), w
  
  gt: (e1,e2,s,w) =>    
    return new c.Inequality e1, c.GEQ, e2, @strength(s), w