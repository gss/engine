class Setter
  constructor: (@container) ->
    @container = document unless @container

  set: (element, dimension, value) ->
    switch dimension
      when 'width'
        element.style.width = value
      when 'left'
        element.style.position = 'absolute'
        # TODO: Calculate offset of position parent
        element.style.left = value
