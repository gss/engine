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

    height: (element) ->
      return element.offsetHeight

    width: (element) ->
      return element.offsetWidth

    y: (element) ->
      y = 0
      while element
        y += element.offsetTop
        element = element.offsetParent
        if element == @scope || !element
          break
        if element == @scope.offsetParent
          y -= @scope.offsetTop
      return y

    x: (element) ->
      x = 0
      while element
        x += element.offsetLeft
        element = element.offsetParent
        if element == @scope || !element
          break
        if element == @scope.offsetParent
          x -= @scope.offsetLeft
      return x

  scroll:

    left: (element) ->
      return element.scrollLeft

    top: (element) ->
      return element.scrollTop

  client:

    left: (element) ->
      return element.clientLeft

    top: (element) ->
      return element.clientTop

  offset:

    left: (element) ->
      return element.offsetLeft

    top: (element) ->
      return element.offsetTop

module.exports = Dimensions
