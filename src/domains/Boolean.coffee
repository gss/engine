
Numeric    = require('./Numeric')
Command    = require('../concepts/Command')
Value      = require('../commands/Value')
Constraint = require('../commands/Constraint')

class Boolean extends Numeric
  immutable: true
  
Boolean.Constraint = Constraint.extend {},
  "&&": (a, b) ->
    return a && b

  "||": (a, b) ->
    return a || b
    
  "!=": (a, b) ->
    return a == b

  "==": (a, b) ->
    return a == b

  "<=": (a, b) ->
    return a <= b

  ">=": (a, b) ->
    return a >= b

  "<": (a, b) ->
    return a < b

  ">": (a, b) ->
    return a > b

Boolean.Value = Value.Variable.extend {}, 
  get: (property, engine) ->
    path = engine.Variable.getPath(object, property)
    if engine.intrinsic.properties[path]
      return engine.intrinsic.get(null, path)
    return engine.values[path]

module.exports = Boolean
