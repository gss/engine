class Dimensions
  # Global variables managed by the engine

  '::window[width]': ->
    return window.innerWidth

  '::window[height]': ->
    return window.innerHeight

  '::window[scroll-left]': ->
    return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft 

  '::window[scroll-top]': ->
    return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop 

  # Constants

  '::window[x]': 0
  '::window[y]': 0

  # Properties

  "[intrinsic-height]": (scope) ->
    return scope.offsetHeight

  "[intrinsic-width]": (scope) ->
    return scope.offsetWidth

  "[intrinsic-y]": (scope) ->
    return scope.offsetTop

  "[intrinsic-x]": (scope) ->
    return scope.offsetWidth

  "[scroll-left]": (scope) ->
    return scope.scrollLeft

  "[scroll-top]": (scope) ->
    return scope.scrollTop

  "[offset-left]": (scope) ->
    return scope.offsetLeft

  "[offset-top]": (scope) ->
    return scope.offsetTop

module.exports = Dimensions
