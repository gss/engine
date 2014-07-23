class Units

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


  # Dynamic lengths

  em: 
    command: (operation, continuation, scope, meta, value) ->
      return @['*'](@get(scope, 'font-size', continuation), value)
  
  rem: 
    command: (operation, continuation, scope, meta, value) ->
      return @['*'](@get('::window', 'font-size', continuation), value)

  vw: 
    command: (operation, continuation, scope, meta, value) ->
      return @['*'](@['/'](@get('::window', 'width', continuation), 100), value)

  vh: 
    command: (operation, continuation, scope, meta, value) ->
      return @['*'](@['/'](@get('::window', 'height', continuation), 100), value)

  vmin: 
    command: (operation, continuation, scope, meta, value) ->
      return @['*'](@['/'](@get('::window', 'min', continuation), 100), value)
    
  vmax: 
    command: (operation, continuation, scope, meta, value) ->
      return @['*'](@['/'](@get('::window', 'max', continuation), 100), value)

module.exports = Units 