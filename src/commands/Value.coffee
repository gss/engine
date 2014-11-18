Command = require('../concepts/Command')

class Value extends Command
  type: 'Value'
  
class Value.Variable extends Value

  signature: [
    property: ['String']
  ]
  
  constructor: ->
    
  before: (args, engine, operation, continuation, scope, ascender, ascending) ->
    if (value = ascending?.values?[args[0]])?
      return value

# Algebraic expression
class Value.Expression extends Value
  
  signature: [
    left:  ['Value', 'Number']
    right: ['Value', 'Number']
  ]

Value.Expression.algebra = 
  '+': (left, right) ->
    return left + right

  '-': (left, right) ->
    return left - right

  '*': (left, right) ->
    return left * right

  '/': (left, right) ->
    return left / right
  
# Substituted expression or variable 
class Value.Expression.Constant extends Value.Expression
  
  signature: [
    left:  ['Number']
    right: ['Number']
  ]

Value.Expression.Constant.define Value.Expression.algebra


  
module.exports = Value
  