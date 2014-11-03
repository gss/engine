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
Abstract::Default = Command.Default.extend(
  extras: 4

  # topmost unknown command returns processed operation back to engine
  execute: () ->
    length = arguments.length
    engine = arguments[length - 4]
    operation = arguments[length - 3]
    continuation = arguments[length - 2]
    scope = arguments[length - 1]
    result = Array.prototype.slice.call(arguments, 0, -4)
    result.unshift operation[0]
    if result.length == 1
      result = result[0]

    if parent = operation.parent
      if parent.command instanceof Command.Default
        return result
      unless parent.command instanceof Command.List
        throw "Incorrect command nesting - unknown command can only be on the top level"
    
    # 
    engine.yield [key: continuation, result]
    return
)
Abstract::List = Command.List.extend(
  capture: ->

  execute: (result) ->
    #
)

# Global variable
Abstract::Value = Value.extend()
Abstract::Value.Variable = Abstract::Value.extend {
  signature: [
    property: ['String']
  ],
}, 
  'get': (property, engine, operation, continuation, scope) ->
    return ['get', property]
    
# Scoped variable
Abstract::Value.Getter = Abstract::Value.extend {
  signature: [
    object:   ['Query', 'Selector']
    property: ['String']
  ]
},
  'get': (object, property, engine, operation, continuation, scope) ->
    if prop = engine.properties[property]
      unless prop.matcher
        return prop.call(engine, object, continuation)
    return ['get', engine.getPath(object, property)]
  
# Proxy math for axioms
Abstract::Value.Expression = Value.Expression.extend {},
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
  '=': (object, name, value) ->
    @assumed.set(object, name, value)

# Style assignment
Abstract::Assignment.Unsafe = Assignment.Unsafe.extend {},
  'set': (object, property, value, engine, operation, continuation, scope) ->
    if @intrinsic
      @intrinsic.restyle object || scope, property, value, continuation, operation
    else
      @assumed.set object || scope, property, value
    return

module.exports = Abstract