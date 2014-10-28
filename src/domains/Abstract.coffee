# Transforms variables into tracked variables

Domain     = require('../concepts/Domain'
Command    = require('../concepts/Command'))

Value      = require('../commands/Value')
Constraint = require('../commands/Constraint')
Assignment = require('../commands/Assignment')

class Abstract extends Domain
  url: undefined
  
  constructor: ->
    if @running
      @compile()
    super

# Catch-all class for unknown commands    
Abstract.Default = Command.extend()

# Global variable
Abstract.Value = Command.extend.call Value
Abstract.Value.Variable = Command.extend.call Abstract.Value, {
  signature: [
    property: ['String']
    [tracker: ['String']]
  ],
}, 
  'get': (property, tracker, engine, operation, continuation, scope) ->
    return ['get', property, continuation, engine.identity.provide(scope)]
    
# Scoped variable
Abstract.Value.Getter = Command.extend.call Abstract.Value, {
  signature: [
    object:   ['Query']
    property: ['String']
    [tracker: ['String']]
  ]
},
  'get': (object, property, tracker, engine, operation, continuation, scope) -> 
    if object.nodeType
      object = engine.identity.provide(object)
      
    continuation = engine.Continuation(continuation || tracker || '')
      
    if prop = engine.properties[property]
      unless prop.matcher
        return prop.call(engine, object, continuation)

    return ['get', engine.getPath(id, property), continuation, engine.identity.provide(scope)]
  
# Proxy math for axioms
Abstract.Value.Expression = Command.extend.call Value.Expression, {},
  '+': (left, right) ->
    ['+', left, right]
    
  '-': (left, right) ->
    ['-', left, right]
    
  '/': (left, right) ->
    ['/', left, right]
  
  '*': (left, right) ->
    ['*', left, right]
  
# Constant definition
Abstract.Assignment = Command.extend.call Assignment, {},
  '=': (object, name, value) ->
    @assumed.set(object, name, value)

# Style assignment
Abstract.Assignment.Unsafe = Command.extend.call Assignment.Unsafe, {},
  'set':
    index: ['rule', 'assignment']
    
    command: (object, property, value, engine, operation, continuation, scope) ->
      if @intrinsic
        @intrinsic.restyle object || scope, property, value, continuation, operation
      else
        @assumed.set object || scope, property, value
      return

module.exports = Abstract