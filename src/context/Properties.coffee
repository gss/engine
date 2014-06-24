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


  # Constants

  '::window[left]': 0
  '::window[top]': 0

  # Formulas

  "[right]": (scope) ->
    return @plus(@get("[left]", scope), @get("[width]", scope))
  
  "[bottom]": (scope) ->
    return @plus(@get("[top]", scope), @get("[height]", scope))
  
  "[center-x]": (scope) ->
    return @plus(@get("[left]", scope), @divide(@get("[width]", scope), 2))

  "[center-y]": (scope) ->
    return @plus(@get("[top]", scope), @divide(@get("[height]", scope), 2))


module.exports = Properties