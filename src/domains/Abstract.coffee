# Find, produce and observe variables
Domain     = require('../Domain')
Command    = require('../Command')

Variable   = require('../commands/Variable')
Constraint = require('../commands/Constraint')
Assignment = require('../commands/Assignment')
Condition  = require('../commands/Condition')
Iterator   = require('../commands/Iterator')
Call       = require('../commands/Call')

class Abstract extends Domain
  url: undefined
  helps: true

  Properties:  require('../properties/Axioms')

  constructor: ->
    if @running
      @compile()
    super

Abstract::Remove = Call.Unsafe.extend {
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
    return true

  extras: 4

  execute: (args..., engine, operation, continuation, scope) ->
    meta = key: @delimit(continuation)
    if scope != engine.scope
      meta.scope = engine.identify(scope)

    args.unshift operation[0]
    wrapper = @produce(meta, args, operation)
    args.parent = wrapper


    if @inheriting
      wrapper.parent = operation.parent

    if domain = @domain?(engine)
      wrapper.domain ||= domain

    engine.update wrapper, undefined, undefined, domain
    return

  produce: (meta, args)->
    return [meta, args] 


# Unrecognized command in conditional clause
Clause = Top.extend

  condition: (engine, operation) ->
    if parent = operation.parent
      if parent[1] == operation
        return parent.command instanceof Abstract::Condition

  domain: (engine) ->
    return engine.solved

  inheriting: true

# Register subclasses to be dispatched by condition
Abstract::Default::advices = [Clause, Top]

# Asynchronous block
Abstract::Iterator = Iterator

# Conditional blocks
Abstract::Condition = Condition

# Array of commands, stops command propagation
Abstract::List = Command.List

# Global variable
Abstract::Variable = Variable.extend {
  signature: [
    property: ['String']
  ],
}, 
  'get': (property, engine, operation, continuation, scope) ->
    return ['get', property]
    
# Scoped variable
Abstract::Variable.Getter = Abstract::Variable.extend {
  signature: [
    object:   ['Query', 'Selector', 'String']
    property: ['String']
  ]
},
  'get': (object, property, engine, operation, continuation, scope) ->
    if prop = engine.properties[property]
      unless prop.matcher
        return prop.call(engine, object, continuation)
    return ['get', engine.getPath(object, property)]
  
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
Abstract::Assignment = Assignment.extend {},
  '=': (object, name, value, engine) ->
    engine.assumed.set(object, name, value)

# Style assignment
Abstract::Assignment.Unsafe = Assignment.Unsafe.extend {},
  'set': (object, property, value, engine, operation, continuation, scope) ->

    if engine.intrinsic
      engine.intrinsic.restyle object || scope, property, value, continuation, operation
    else
      engine.assumed.set object || scope, property, value
    return

module.exports = Abstract