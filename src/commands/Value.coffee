Command = require('../concepts/Command')

class Value extends Command
  type: 'Value'
  
class Value.Variable extends Value

  signature: [
    property: ['String']
    tracker:  ['String']
    scoped:   ['String']
  ]
  
  constructor: ->
    
  after: (engine, node, args, result, operation, continuation, scope) ->
    if result.length > 0
      if result.length > 1
        @paths = result.splice(1)
      return result[0]
  
  isVariable: true
      
  continuations: undefined
  variables: undefined
  paths: undefined
  

  # Return domain that should be used to evaluate given variable
  @getDomain: (engine, operation, force, quick) ->
    if operation.domain && !force
      return operation.domain
    [cmd, scope, property] = variable = operation
    path = @getPath(scope, property)
    
    intrinsic = engine.intrinsic
    if (scope || path.indexOf('[') > -1) && property && intrinsic?.properties[path]?
      domain = intrinsic
    else if scope && property && intrinsic?.properties[property] && !intrinsic.properties[property].matcher
      domain = intrinsic
    else
      for d in engine.domains
        if d.values.hasOwnProperty(path) && (d.priority >= 0 || d.variables[path]) && d.displayName != 'Solved'
          domain = d
          break
        if d.substituted
          for constraint in d.substituted
            if constraint.substitutions?[path]
              domain = d
              break
    unless domain
      if property && (index = property.indexOf('-')) > -1
        prefix = property.substring(0, index)
        if (domain = engine[prefix])
          unless domain instanceof engine.Domain
            domain = undefined

      unless domain
        #if scope && property && @intrinsic?.properties[property]
        #  domain = @intrinsic.maybe()
        #else
        if !quick
          domain = @engine.linear.maybe()
    if variable && !force
      variable.domain = domain
    return domain
    
  # Return computed path for id and property e.g. $id[property]
  @getPath: (id, property) ->
    unless property
      property = id
      id = undefined
    if property.indexOf('[') > -1 || !id
      return property
    else
      if typeof id != 'string'
        if id.nodeType
          id = @engine.identity.provide(id)
        else 
          id = id.path
      return id + '[' + property + ']'
      
  getPath: @getPath  
  getDomain: @getDomain
  
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
  