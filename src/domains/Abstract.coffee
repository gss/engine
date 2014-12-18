# Find, produce and observe variables
Domain      = require('../Domain')
Command     = require('../Command')
   
Variable    = require('../Variable')
Constraint  = require('../Constraint')

class Abstract extends Domain
  url: undefined
  helps: true

  Iterator:   require('../Iterator')
  Condition:  require('../Condition')

  Properties: require('../properties/Axioms')  


Abstract::Remove = Command.extend {
  signature: false

  extras: 1
},
  remove: (args..., engine)->
    for path in args
      engine.triggerEvent('remove', path)
    return true


# Catch-all class for unknown commands    
Abstract::Default = Command.Default.extend
  extras: 2

  execute: (args..., engine, operation) ->
    args.unshift operation[0]
    return args

# Topmost unknown command returns processed operation back to engine
Top = Abstract::Default.extend
  
  condition: (engine, operation) ->
    if parent = operation.parent
      if parent.command instanceof Abstract::Default 
        return false
        
    operation.index ||= engine.abstract.index = (engine.abstract.index || 0) + 1
    return true

  extras: 4

  execute: (args..., engine, operation, continuation, scope) ->
    meta = 
      key: @delimit(continuation)
      index: operation.index

    if scope != engine.scope
      meta.scope = engine.identify(scope)

    args.unshift operation[0]
    wrapper = @produce(meta, args, operation)
    args.parent = wrapper


    if domain = @domain?(engine, operation)
      wrapper.parent = operation.parent
      wrapper.domain ||= domain

    engine.update wrapper, undefined, undefined, domain
    return

  produce: (meta, args)->
    return [meta, args]

  domain: (engine, operation) -> 
    if parent = operation.parent
      if domain = parent.command.domains?[parent.indexOf(operation)]
        return engine[domain]

# Register subclasses to be dispatched by condition
Abstract::Default::advices = [Top]

# Array of commands, stops command propagation
Abstract::List = Command.List

# Global variable
Abstract::Variable = Variable.extend {
  signature: [
    property: ['String']
  ],
}, 
  'get': (property, engine, operation, continuation, scope) ->
    if engine.queries
      if scope == engine.scope
        scope = undefined
      object = engine.Query::getScope(engine, scope, continuation)
    return ['get', engine.getPath(object, property)]
    
# Scoped variable
Abstract::Variable.Getter = Abstract::Variable.extend {
  signature: [
    object:   ['Query', 'Selector', 'String']
    property: ['String']
  ]
},
  'get': (object, property, engine, operation, continuation, scope) ->
    if engine.queries
      prefix = engine.Query::getScope(engine, object, continuation)

    if prop = engine.properties[property]
      unless prop.matcher
        if (object ||= scope).nodeType == 9
          object = object.body
        return prop.call(engine, object, continuation)
    if property.indexOf('intrinsic') > -1
      prefix ||= engine.scope
    return ['get', engine.getPath(prefix, property)]
  
# Proxy math that passes basic expressions along
Abstract::Variable.Expression = Variable.Expression.extend {},
  '+': (left, right) ->
    ['+', left, right]
    
  '-': (left, right) ->
    ['-', left, right]
    
  '/': (left, right) ->
    ['/', left, right]
  
  '*': (left, right) ->
    ['*', left, right]
  
  
# Constant definition
Abstract::Assignment = Command.extend {
  type: 'Assignment'
  
  signature: [
    [object:   ['Query', 'Selector']]
    property: ['String']
    value:    ['Variable']
  ]
},
  '=': (object, name, value, engine) ->
    engine.assumed.set(object, name, value)

# Style assignment
Abstract::Assignment.Style = Abstract::Assignment.extend {
  signature: [
    [object:   ['Query', 'Selector']]
    property: ['String']
    value:    ['Any']
  ]

  # Register assignment within parent rule 
  # by its auto-incremented property local to operation list
  advices: [
    (engine, operation, command) ->
      parent = operation
      rule = undefined
      while parent.parent
        if !rule && parent[0] == 'rule'
          rule = parent
        parent = parent.parent

      operation.index = parent.rules = (parent.rules || 0) + 1
      if rule
        (rule.properties ||= []).push(operation.index)
      return
  ]
},
  'set': (object, property, value, engine, operation, continuation, scope) ->

    if engine.intrinsic
      engine.intrinsic.restyle object || scope, property, value, continuation, operation
    else
      engine.assumed.set object || scope, property, value
    return

module.exports = Abstract