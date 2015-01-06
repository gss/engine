Variable = require '../commands/Variable'

class Measurement extends Variable

  signature: [
    value: ['Variable', 'Number']
  ]

class Measurement.Length extends Measurement
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


# Rotations
class Measurement.Angle extends Measurement
  @define 
    deg: (value) ->
      return value * (Math.PI / 180)

    grad: (value) ->
      return value * (Math.PI / 180) / (360 / 400)

    turn: (value) ->
      return value * (Math.PI / 180) * 360

    rad: (value) ->
      return value

# Time
class Measurement.Time extends Measurement
  @define
    h: (value) ->
      return value * 60 * 60 * 1000

    min: (value) ->
      return value * 60 * 1000

    s: (value) ->
      return value * 1000

    ms: (value) ->
      return value

# Frequency
class Measurement.Frequency extends Measurement
  @define
    deg: (value) ->
      return value * (Math.PI / 180)

    grad: (value) ->
      return value * (Math.PI / 180) / (360 / 400)

    turn: (value) ->
      return value * (Math.PI / 180) * 360

    rad: (value) ->
      return value

module.exports = Measurement