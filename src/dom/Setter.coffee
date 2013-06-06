class Setter
  constructor: (@container) ->
    @container = document unless @container

  set: (element, dimension, value) ->
    switch dimension
      when 'width'
        @setWidth element, value
      when 'left'
        @setLeft element, value

  makePositioned: (element) ->
    element.style.position = 'absolute'

  setWidth: (element, value) ->
    element.style.width = "#{value}px"

  setLeft: (element, value) ->
    @makePositioned element
    # TODO: Calculate offset of position parent

module.exports = Setter
