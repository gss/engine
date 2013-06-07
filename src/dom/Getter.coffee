class Getter
  constructor: (@container) ->
    @container = document unless @container

  get: (selector) ->
    method = selector[0]
    identifier = selector[1]
    switch method
      when "$id"
        # TODO: Restrict to container
        if identifier[0] is '#'
          identifier = identifier.substr 1
        return document.getElementById identifier
      when "$class"
        if identifier[0] is '.'
          identifier = identifier.substr 1
        return @container.getElementsByClassName identifier
      when "$tag"
        return @container.getElementsByTagName identifier
    @container.querySelectorAll identifier

  getPosition: (element) ->
    x = 0
    y = 0
    loop
      x += element.offsetLeft
      y += element.offsetTop
      break unless element.offsetParent
      element = element.offsetParent
    return offsets =
      left: x
      top: y

  measure: (element, dimension) ->
    switch dimension
      when 'width'
        return element.getBoundingClientRect().width
      when 'height'
        return element.getBoundingClientRect().height
      when 'left'
        return @getPosition(element).left
      when 'top'
        return @getPosition(element).top

module.exports = Getter
