class Setter
  constructor: (@container) ->
    @container = document unless @container

  set: (element, dimension, value) ->
    switch dimension
      when 'width', 'w'
        @setWidth element, value
      when 'height', 'h'
        @setHeight element, value
      when 'left', 'x'
        @setLeft element, value
      when 'top', 'y'
        @setTop element, value

  makePositioned: (element) ->
    element.style.position = 'absolute'

  getOffsets: (element) ->
    offsets =
      x: 0
      y: 0
    return offsets unless element.offsetParent
    element = element.offsetParent
    loop
      offsets.x += element.offsetLeft
      offsets.y += element.offsetTop
      break unless element.offsetParent
      element = element.offsetParent
    return offsets

  setWidth: (element, value) ->
    element.style.width = "#{value}px"

  setHeight: (element, value) ->
    element.style.height = "#{value}px"

  setLeft: (element, value) ->
    @makePositioned element
    offsets = @getOffsets element
    element.style.left = "#{value - offsets.x}px"

  setTop: (element, value) ->
    @makePositioned element
    offsets = @getOffsets element
    element.style.top = "#{value - offsets.y}px"

module.exports = Setter
