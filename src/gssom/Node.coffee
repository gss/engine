
class Node
  
  addRules: (rules) ->
    for r in rules
      r.parent = @
      r.styleSheet = @styleSheet      
      r.engine = @engine
      rule = new GSS.Rule r
      @rules.push rule

module.exports = Node