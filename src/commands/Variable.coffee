Command = require('../Command')

class Variable extends Command
  type: 'Variable'

  signature: [
    property: ['String']
  ]

  log: ->
  unlog: ->
  
  constructor: ->
    
  before: (args, engine, operation, continuation, scope, ascender, ascending) ->
    if (value = ascending?.values?[args[0]])?
      return value

  # Declare variable within domain, initial value is zero
  declare: (engine, name) ->
    variables = engine.variables
    unless variable = variables[name]
      variable = variables[name] = engine.variable(name)
    #if engine.nullified?[name]
    #  delete engine.nullified[name]
    #if engine.replaced?[name]
    #  delete engine.replaced[name]
    (engine.declared ||= {})[name] = variable
    return variable

  # Undeclare variable in given domain, outputs "null" once
  undeclare: (engine, variable, quick) ->
    if quick
      (engine.replaced ||= {})[variable.name] = variable
    else
      (engine.nullified ||= {})[variable.name] = variable
      if engine.declared?[variable.name]
        delete engine.declared[variable.name]

    delete engine.values[variable.name]
    engine.nullify(variable)
    engine.unedit(variable)

# Algebraic expression
class Variable.Expression extends Variable
  
  signature: [
    left:  ['Variable', 'Number']
    right: ['Variable', 'Number']
  ]

Variable.Expression.algebra = 
  '+': (left, right) ->
    return left + right

  '-': (left, right) ->
    return left - right

  '*': (left, right) ->
    return left * right

  '/': (left, right) ->
    return left / right

  'min': (left, right) ->
    return Math.min(left, right)

  'max': (left, right) ->
    return Math.max(left, right)
  
module.exports = Variable