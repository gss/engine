Command = require('../concepts/Command')

class Value extends Command
  type: 'Value'
  
class Value.Variable extends Value

  signature: [
    property: ['String']
  ]
  
  constructor: ->
    
  before: (args, engine, operation, continuation, scope) ->
    if (value = scope?.values?[args[0]])?
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

Value.Expression.define
  '+': (left, right) ->
    return c.plus(left, right)

  '-': (left, right) ->
    return c.minus(left, right)

  '*': (left, right) ->
    return c.times(left, right)

  '/': (left, right) ->
    return c.divide(left, right)

  
module.exports = Value
  