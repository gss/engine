# Known formulas

class Axioms

  right: (scope, path) ->
    return @['+'](@_get(scope, "x", path), @_get(scope, "width", path))
  
  bottom: (scope, path) ->
    return @['+'](@_get(scope, "y", path), @_get(scope, "height", path))
  
  center:
    x: (scope, path) ->
      return @['+'](@_get(scope, "x", path), @['/'](@_get(scope, "width", path), 2))

    y: (scope, path) ->
      return @['+'](@_get(scope, "y", path), @['/'](@_get(scope, "height", path), 2))
      
module.exports = Axioms

for property, value of Axioms::
  value.axiom = true