# Do your math! Functions that work on fully resolved values

class Math

  # Math ops compatible with constraints API

  plus: (a, b) ->
    return a + b

  minus: (a, b) ->
    return a - b

  multiply: (a, b) ->
    return a * b

  divide: (a, b) ->
    return a / b


module.exports = Math