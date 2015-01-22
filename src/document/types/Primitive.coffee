Command = require('../../engine/Command')

class Primitive extends Command

# Decimal value (e.g. line-height: 1.0)
class Primitive.Number extends Primitive
  type: 'Number'
  constructor: (obj) ->
    parsed = parseFloat(obj)
    if parsed == obj
      return parsed

  @formatNumber: (number) ->
    return number
      
class Primitive.Integer extends Primitive
  type: 'Integer'
  constructor: (obj) ->
    parsed = parseInt(obj)
    if String(parsed) == String(obj)
      return parsed

class Primitive.String extends Primitive
  type: 'String'
  constructor: (obj) ->
    if typeof obj == 'string'
      return obj

  # Array of strings (e.g. font-family)
class Primitive.Strings extends Primitive
  type: 'Strings'
  constructor: (obj) ->
    if typeof obj == 'string' || obj instanceof Array
      return obj

class Primitive.Size extends Primitive
  type: 'Size'
  constructor: (obj) ->
    if typeof obj == 'string' && Primitive.Size.Keywords?[obj]
      return obj
  @Keywords: {'medium', 'xx-small', 'x-small', 'small', 'large', 'x-large', 'xx-large', 'smaller', 'larger' }

# Keywords for background-position and alike
class Primitive.Position extends Primitive
  type: 'Position'
  constructor: (obj) ->
    if typeof obj == 'string' && Primitive.Position.Keywords?[obj]
      return obj
  @Keywords: {"top", "bottom", "left", "right"}

class Primitive.Property extends Primitive
  type: 'Property'
  Property: (obj) ->
    if @properties[obj]
      return obj

module.exports = Primitive