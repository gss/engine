
# Handles side effects caused by elements changing position or size

class Equasions

  # Formulas

  right: (scope, path) ->
    return @['_+'](@_get(scope, "x", path), @_get(scope, "width", path))
  
  bottom: (scope, path) ->
    debugger
    return @['_+'](@_get(scope, "y", path), @_get(scope, "height", path))
  
  center:
    x: (scope, path) ->
      return @['_+'](@_get(scope, "x", path), @['_/'](@_get(scope, "width", path), 2))

    y: (scope, path) ->
      return @['_+'](@_get(scope, "y", path), @['_/'](@_get(scope, "height", path), 2))
      
module.exports = Equasions