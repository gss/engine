
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
    debugger
    return a < b

  ">": (a, b) ->
    return a > b



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