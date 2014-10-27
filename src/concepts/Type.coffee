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
    if obj instanceof String
      return obj
    
  # Array of strings (e.g. font-family)
  Strings: (obj) ->
    if obj instanceof String || obj instanceof Array
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
    if obj instanceof String
      if obj = @Timings[obj]
        return obj
    else if obj[0] == 'steps' || obj[0] == 'cubic-bezier'
      return obj


  Length: (obj) ->
    if obj instanceof Number
      return obj
    if (@units || @Units.prototype)[obj[0]]
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
    if @Positions[obj]
      return obj

  # Length with % unit
  Times: {'s', 'ms', 'm'}
  Time: (obj) ->
    if @Times[obj[0]]
      return obj

  Colors: {'transparent', 'hsl', 'rgb', 'hsla', 'rgba', 'hsb'}
  Pseudocolors: {'transparent', 'currentColor'}
  Color: (obj) ->
    if obj instanceof String
      if @Pseudocolors[obj]
        return obj
    else
      if @Colors[obj[0]]
        return obj

  Sizes: {'medium', 'xx-small', 'x-small', 'small', 'large', 'x-large', 'xx-large', 'smaller', 'larger' }
  Size: (obj) ->
    if @Sizes[obj]
      return obj

  Gradients: {'linear-gradient', 'radial-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient'}
  Gradient: (obj) ->
    if @Gradients[obj[0]]
      return obj

  URLs: {'url', 'src'}
  URL: (obj) ->
    if @URLs[obj[0]]
      return obj

  Property: (obj) ->
    if @properties[obj]
      return obj

  Matrix: (obj) ->
    if typeof obj == 'object' && object.length != undefined
      return obj

module.exports = Type