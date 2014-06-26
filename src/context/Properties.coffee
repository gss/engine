# Little shim for require.js so we dont have to carry it around
unless this.require
  this.module ||= {}
  this.require = (string) ->
    bits = string.replace('.js', '').split('/')
    if string == 'cassowary'
      return c
    return this[bits[bits.length - 1]]

# Handles side effects caused by elements changing position or size

class Properties

  # Formulas

  "[right]": (scope, path) ->
    return @plus(@get(scope, "[x]", path), @get(scope, "[width]", path))
  
  "[bottom]": (scope, path) ->
    return @plus(@get(scope, "[y]", path), @get(scope, "[height]", path))
  
  "[center-x]": (scope, path) ->
    return @plus(@get(scope, "[x]", path), @divide(@get(scope, "[width]", path), 2))

  "[center-y]": (scope, path) ->
    return @plus(@get(scope, "[y]", path), @divide(@get(scope, "[height]", path), 2))


module.exports = Properties