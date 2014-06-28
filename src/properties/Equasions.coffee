
# Handles side effects caused by elements changing position or size

class Equasions

  # Formulas

  "[right]": (scope, path) ->
    return @_plus(@_get(scope, "[x]", path), @_get(scope, "[width]", path))
  
  "[bottom]": (scope, path) ->
    return @_plus(@_get(scope, "[y]", path), @_get(scope, "[height]", path))
  
  "[center-x]": (scope, path) ->
    return @_plus(@_get(scope, "[x]", path), @_divide(@_get(scope, "[width]", path), 2))

  "[center-y]": (scope, path) ->
    return @_plus(@_get(scope, "[y]", path), @_divide(@_get(scope, "[height]", path), 2))

module.exports = Equasions