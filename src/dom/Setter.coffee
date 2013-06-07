class Setter
  constructor: (@container) ->
    @container = document unless @container

  set: (element, dimension, value) ->
    switch dimension
      when 'width'
        @setWidth element, value
      when 'height'
        @setHeight element, value
      when 'left'
        @setLeft element, value

  makePositioned: (element) ->
    element.style.position = 'absolute'

  setWidth: (element, value) ->
    element.style.width = "#{value}px"

  setHeight: (element, value) ->
    element.style.height = "#{value}px"

  setLeft: (element, value) ->
    @makePositioned element
    # TODO: Calculate offset of position parent

module.exports = Setter
