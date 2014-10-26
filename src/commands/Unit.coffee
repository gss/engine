Command = require('../concepts/Command')

class Unit extends Command
  signature: [
    value: ['Value']
  ]

Command.define.call Unit,

  # Static lengths

  px: (value) ->
    return value

  pt: (value) ->
    return value

  cm: (value) ->
    return @['*'](value, 37.8)

  mm: (value) ->
    return @['*'](value, 3.78)

  in: (value) ->
    return @['*'](value, 96)


  # Rotations

  deg: (value) ->
    return @['*'](value, (Math.PI / 180))

  grad: (value) ->
    return @deg(@['/'](value, 360 / 400))

  turn: (value) ->
    return @deg(@['*'](value, 360))

  rad: (value) ->
    return value

class Unit.Dynamic extends Unit
  
Command.define.call Unit.Dynamic,

  # Dynamic lengths

  em: (value, engine, operation, continuation, scope, ) ->
    return @['*'](@get(scope, 'font-size', continuation), value)
  
  rem: (value, engine, operation, continuation, scope, ) ->
    return @['*'](@get('::window', 'font-size', continuation), value)

  vw: (value, engine, operation, continuation, scope, ) ->
    return @['*'](@['/'](@get('::window', 'width', continuation), 100), value)

  vh: (value, engine, operation, continuation, scope, ) ->
    return @['*'](@['/'](@get('::window', 'height', continuation), 100), value)

  vmin: (value, engine, operation, continuation, scope, ) ->
    return @['*'](@['/'](@get('::window', 'min', continuation), 100), value)
    
  vmax: (value, engine, operation, continuation, scope, ) ->
    return @['*'](@['/'](@get('::window', 'max', continuation), 100), value)

module.exports = Unit