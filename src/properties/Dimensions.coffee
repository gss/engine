class Dimensions
  # Global variables managed by the engine


  '::window':
      
    width: ->
      return window.innerWidth

    height: ->
      return window.innerHeight

    #right: '::window[width]'
    #bottom: '::window[height]'
    #
    #center:
    #  x: ->
    #    return window.innerWidth / 2
    #
    #  y: ->
    #    return window.innerHeight / 2

    scroll:

      left: ->
        return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft 

      top: ->
        return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop 

    x: 0
    y: 0

  '::document':

    scroll:
      left: '::window[scroll-left]'
      top:  '::window[scroll-top]'
      
    x: '::window[x]'
    y: '::window[y]'

  intrinsic:

    height: (element) ->
      return element.offsetHeight

    width: (element) ->
      return element.offsetWidth

    y: (element) ->
      return

    x: (element) ->
      return

  scroll:

    left: (element) ->
      return element.scrollLeft

    top: (element) ->
      return element.scrollTop

    height: (element) ->
      return element.scrollHeight

    width: (element) ->
      return element.scrollWidth
      
  client:

    left: (element) ->
      return element.clientLeft

    top: (element) ->
      return element.clientTop

    height: (element) ->
      return element.clientHeight

    width: (element) ->
      return element.clientWidth

  offset:

    left: (element) ->
      return element.offsetLeft

    top: (element) ->
      return element.offsetTop

    height: (element) ->
      return element.offsetHeight

    width: (element) ->
      return element.offsetWidth

module.exports = Dimensions
