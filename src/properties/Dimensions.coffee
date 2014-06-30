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
      return scope.offsetTop

    x: (scope) ->
      return scope.offsetWidth

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
