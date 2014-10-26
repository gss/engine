
Numeric = require('./Numeric')

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

Boolean.Value = Command.extend.call Value.Variable, {}, 
  get: (property, engine) ->
    path = engine.Variable.getPath(object, property)
    if engine.intrinsic.properties[path]
      return engine.intrinsic.get(null, path)
    return engine.values[path]

module.exports = Boolean
