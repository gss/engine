
Numeric = require('./Numeric')

class Boolean extends Numeric
  immutable: true

class Boolean::Methods
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

  get: (object, property) ->
    path = @engine.Variable.getPath(object, property)
    if @intrinsic.properties[path]
      return @intrinsic.get(null, path)
    return @values[path]


for property, value of Boolean::Methods::
  do (property, value) ->
    Boolean::Methods::[property] = (a, b) ->
      if a? && b?
        if typeof a != 'object' && typeof b != 'object'
          return value.call(@, a, b)
        else
          return [property, a, b]

module.exports = Boolean

for property, value of Numeric::Methods::
  Boolean::Methods::[property] = value