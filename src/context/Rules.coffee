# CSS rules and conditions

class Rules
  
  # Conditionals
  
  "$rule":
    prefix: "{"
    scope: true
    evaluate: (arg, i, evaluated) ->
      return arg if i == 0
      if i == 1 || (evaluated[1] && i == 2)
        return @evaluate arg

  "$if":
    prefix: "@if"
    evaluate: (arg, i, evaluated) ->
      return arg if i == 0
      if i == 1 || (evaluated[1] ? i == 2 : i == 3)
        return @evaluate arg

module.exports = Rules