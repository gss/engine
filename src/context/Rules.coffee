# CSS rules and conditions

class Rules
  # The wonderful semicolon
  # Executes each argument with current continuations
  # - Expressions dont affect each other
  # - Unresolved values dont stop other expressions from executing

  ';':
    prefix: ''
    noop: true
    evaluate: (arg, evaluated) ->
      return arg if arg.index == 0
      if arg.index == 1 || (evaluated[1] && arg.index == 2)
        value = @evaluate arg
        value = null if value == undefined
        return value

  
  # Conditionals
  
  "$rule":
    evaluate: (arg, evaluated) ->
      return arg if arg.index == 0
      if arg.index == 1 || (evaluated[1] && arg.index == 2)
        return @evaluate arg, evaluated, evaluated[0], undefined, undefined, evaluated[1]

    receive: (engine, scope, args, result) ->
      console.error('recieved cmd')
      debugger
      engine.expressions.write result

    command: (path, condition, positive, negative) ->
      if condition
        positive
      else
        negative

  "$if":
    prefix: "@if"
    evaluate: (arg, i, evaluated) ->
      return arg if i == 0
      if i == 1 || (evaluated[1] ? i == 2 : i == 3)
        return @evaluate arg

module.exports = Rules