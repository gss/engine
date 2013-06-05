importScripts "../vendor/c.js"

astFunctions =
           
  plus: (e1,e2) ->
    return c.plus e2, e2 
  
  minus : (e1,e2) ->
    return c.minus e2, e2 
    
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

onmessage = (constraints) ->
  # TODO: Include Cassowary, solve
  if c.Equation isnt null
    postMessage(
      a: 7
      b: 5
      c: 2
    )
  else
    postMessage(
      a: 1
      b: 1
      c: 1
    )
