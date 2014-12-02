# Known formulas

class Axioms

  right: (scope) ->
    id = @identify(scope)
    return ['+', ['get', @getPath(id, 'x')], ['get', @getPath(id, 'width')]]

  bottom: (scope, path) ->
    id = @identify(scope)
    return ['+', ['get', @getPath(id, 'y')], ['get', @getPath(id, 'height')]]
  
  center:
    x: (scope, path) ->
      id = @identify(scope)
      return ['+', ['get', @getPath(id, 'x')], ['/', ['get', @getPath(id, 'width')], 2]]

    y: (scope, path) ->
      id = @identify(scope)
      return ['+', ['get', @getPath(id, 'y')], ['/', ['get', @getPath(id, 'height')], 2]]
      
module.exports = Axioms