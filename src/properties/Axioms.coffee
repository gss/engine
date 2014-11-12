# Known formulas

class Axioms

  right: (scope) ->
    id = @identity.yield(scope)
    return ['+', ['get', id + '[x]'], ['get', id + '[width]']]

  bottom: (scope, path) ->
    id = @identity.yield(scope)
    return ['+', ['get', id + '[y]'], ['get', id + '[height]']]
  
  center:
    x: (scope, path) ->
      id = @identity.yield(scope)
      return ['+', ['get', id + '[x]'], ['/', ['get', id + '[width]'], 2]]

    y: (scope, path) ->
      id = @identity.yield(scope)
      return ['+', ['get', id + '[y]'], ['/', ['get', id + '[height]'], 2]]
      
module.exports = Axioms