Command = require('../concepts/Command')

class Value extends Command
  type: 'Value'
  
class Value.Variable extends Value

  signature: [
    property: ['String']
  ]
  
  constructor: ->
    
  isVariable: true
      
  continuations: undefined
  variables: undefined
  paths: undefined
  
  
# Algebraic expression
class Value.Expression extends Value
  
  signature: [
    left:  ['Value', 'Number']
    right: ['Value', 'Number']
  ]

# Substituted expression or variable 
class Value.Solution extends Value
  
  signature: [
    property: ['String']
    contd:    ['String']
    value:    ['Number']
  ]

Value.Solution.define 
  got: (property, contd, value, engine, operation, continuation, scope) ->
    if engine.suggest && engine.solver
      variable = (operation.parent.suggestions ||= {})[operation.index]
      unless variable
        Domain::Methods.uids ||= 0
        uid = ++Domain::Methods.uids
        variable = operation.parent.suggestions[operation.index] ||= engine.declare(null, operation)
        variable.suggest = value
        variable.operation = operation

        @constrained ||= []
      return variable

    if !continuation && contd
      return engine.solve operation.parent, contd, engine.identity.solve(scoped), operation.index, value
    return value
  
module.exports = Value
  