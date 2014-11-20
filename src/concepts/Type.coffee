class Type
  
  @define: (property, value)-> 
    if value
      @[property] = value
    else
      for prop, value of property
        @define prop, value
  
Type.define
  # Decimal value (e.g. line-height: 1.0)
  Float: (obj) ->
    parsed = parseFloat(obj)
    if parsed == obj
      return parsed

  # Integer value (e.g. z-index: 1)
  Integer: (obj) ->
    parsed = parseInt(obj)
    if String(parsed) == String(obj)
      return parsed

  # Style-specific unquoted word 
  String: (obj) ->
    if typeof obj == 'string'
      return obj
    
  # Array of strings (e.g. font-family)
  Strings: (obj) ->
    if typeof obj == 'string' || obj instanceof Array
      return obj

  Timings:
    'ease':        ['cubic-bezier', .42, 0, 1,   1]
    'ease-in':     ['cubic-bezier', .42, 0, 1,   1]
    'ease-out':    ['cubic-bezier', 0,   0, .58, 1]
    'ease-in-out': ['cubic-bezier', .42, 0, .58, 1]
    'linear':      ['cubic-bezier', 0,   0, 1,   1]
    'step-start':  'step-start'
    'step-end':    'step-end'
  Timing: (obj = 'ease') ->
    if typeof obj == 'string'
      if obj = @Type.Timings[obj]
        return obj
    else if obj[0] == 'steps' || obj[0] == 'cubic-bezier'
      return obj


  Length: (obj) ->
    if typeof obj == 'number'
      return obj
    if @Unit[obj[0]]
      if obj[1] == 0
        return 0
      return obj

  # Length with % unit
  Percentage: (obj) ->
    if obj[0] == '%'
      return obj

  # Keywords for background-position and alike
  Positions: {"top", "bottom", "left", "right"}
  Position: (obj) ->
    if @Type.Positions[obj]
      return obj

  # Length with % unit
  Times: {'s', 'ms', 'm'}
  Time: (obj) ->
    if @Type.Times[obj[0]]
      return obj

  Colors: {'transparent', 'hsl', 'rgb', 'hsla', 'rgba', 'hsb'}
  Pseudocolors: {'transparent', 'currentColor'}
  Color: (obj) ->
    if typeof obj == 'string'
      if @Type.Pseudocolors[obj]
        return obj
    else
      if @Type.Colors[obj[0]]
        return obj

  Sizes: {'medium', 'xx-small', 'x-small', 'small', 'large', 'x-large', 'xx-large', 'smaller', 'larger' }
  Size: (obj) ->
    if @Type.Sizes[obj]
      return obj

  Gradients: {'linear-gradient', 'radial-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient'}
  Gradient: (obj) ->
    if @Type.Gradients[obj[0]]
      return obj

  URLs: {'url', 'src'}
  URL: (obj) ->
    if @Type.URLs[obj[0]]
      return obj

  Property: (obj) ->
    if @properties[obj]
      return obj

  Matrix: (obj) ->
    if typeof obj == 'object' && object.length != undefined
      return obj

module.exports = Type