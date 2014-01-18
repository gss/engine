
class Node
  
  addRules: (rules) ->
    for r in rules
      r.parent = @
      r.styleSheet = @styleSheet      
      r.engine = @engine
      rule = new GSS.Rule r
      @rules.push rule
  
  # Update Pass
  
  needsUpdate: true
  
  setNeedsUpdate: (bool) ->
    if bool
      # trickle update up
      @styleSheet.setNeedsUpdate true
      @needsUpdate = true
    else
      @needsUpdate = false      
  
  updateIfNeeded: ->
    if @needsUpdate
      @update()      
      @needsUpdate = false
    for rule in @rules
      rule.updateIfNeeded()

module.exports = Node