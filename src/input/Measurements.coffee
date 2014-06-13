class Measurements
  # Hook: Evaluate input
  read: ->
    return @evaluate.apply(@, arguments)

  # Hook: Output equasions
  write: ->
    return @output.read.apply(@output, arguments)

module.exports = Measurements