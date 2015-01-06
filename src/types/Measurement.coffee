Variable = require '../commands/Variable'
Unit     = require '../commands/Unit'



class Measurement extends Variable

  signature: [
    value: ['Variable', 'Number']
  ]

class Measurement.Percentage extends Measurement
  constructor: (obj) ->
    switch typeof obj
      when 'object'
        if obj[0] == '%'
          return obj


class Measurement.Length extends Measurement
  constructor: (obj) ->
    switch typeof obj
      when 'number'
        return obj
      when 'object'
        if Measurement.Length[obj[0]]
          return obj
        if Unit[obj[0]] && obj[0] != '%'
          return obj

  @define

    # Static lengths

    px: (value) ->
      return value

    pt: (value) ->
      return value

    cm: (value) ->
      return value * 37.8

    mm: (value) ->
      return value * 3.78

    in: (value) ->
      return value * 96

  @formatNumber: (number) ->
    return number + 'px'


# Rotations
class Measurement.Angle extends Measurement
  constructor: (obj) ->
    switch typeof obj
      when 'number'
        return obj
      when 'object'
        if Measurement.Angle[obj[0]]
          return obj
  @define 
    deg: (value) ->
      return value * (Math.PI / 180)

    grad: (value) ->
      return value * (Math.PI / 180) / (360 / 400)

    turn: (value) ->
      return value * (Math.PI / 180) * 360

    rad: (value) ->
      return value

  @formatNumber: (number) ->
    return number + 'rad'

# Time
class Measurement.Time extends Measurement
  constructor: (obj) ->
    switch typeof obj
      when 'number'
        return obj
      when 'object'
        if Measurement.Time[obj[0]]
          return obj

  @define
    h: (value) ->
      return value * 60 * 60 * 1000

    min: (value) ->
      return value * 60 * 1000

    s: (value) ->
      return value * 1000

    ms: (value) ->
      return value

  @formatNumber: (number) ->
    return number + 'ms'

# Frequency
class Measurement.Frequency extends Measurement
  constructor: (obj) ->
    switch typeof obj
      when 'number'
        return obj
      when 'object'
        if @[obj[0]]
          return obj

  @define
    mhz: (value) ->
      return value * 1000 * 1000

    khz: (value) ->
      return value * 1000
      
    hz: (value) ->
      return value

  @formatNumber: (number) ->
    return number + 'hz'

module.exports = Measurement