class Dimensions
  # Global variables managed by the engine

  '::window':
      
    width: ->
      return window.innerWidth

    height: ->
      return window.innerHeight

    scroll:

      left: ->
        return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft 

      top: ->
        return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop 


    x: 0

    y: 0

  intrinsic:

    height: (scope) ->
      return scope.offsetHeight

    width: (scope) ->
      return scope.offsetWidth

    y: (scope) ->
      y = 0
      while scope
        y = scope.offsetTop
        scope = scope.offsetParent
        if scope == @scope
          break
        if scope == @scope.offsetParent
          y -= @scope.offsetTop
      return y

    x: (scope) ->
      x = 0
      while scope
        x = scope.offsetLeft
        scope = scope.offsetParent
        if scope == @scope
          break
        if scope == @scope.offsetParent
          x -= @scope.offsetLeft
      return x

  scroll:

    left: (scope) ->
      return scope.scrollLeft

    top: (scope) ->
      return scope.scrollTop

  client:

    left: (scope) ->
      return scope.clientLeft

    top: (scope) ->
      return scope.clientTop

  offset:

    left: (scope) ->
      return scope.offsetLeft

    top: (scope) ->
      return scope.offsetTop

module.exports = Dimensions
