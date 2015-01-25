class Getters
  # Global variables managed by the engine


  '::window':
      
    width: ->
      return Math.min(window.innerWidth, document.documentElement.clientWidth)

    height: ->
      return document.documentElement.clientHeight
    x: 0
    y: 0

  '::document':

    height: ->
      return document.documentElement.clientHeight
      
    width: ->
      return document.documentElement.clientWidth

    x: 0
    y: 0

    scroll:
      height: ->
        return document.body.scrollHeight

      width: ->
        return document.body.scrollWidth

      left: ->
        return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft 

      top: ->
        return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop 


  intrinsic:

    height: (element) ->
      return# element.offsetHeight

    width: (element) ->
      return# element.offsetWidth

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

module.exports = Getters
