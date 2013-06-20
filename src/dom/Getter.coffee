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

  measure: (element, dimension) ->
    switch dimension
      when 'width', 'w'
        return element.getBoundingClientRect().width
      when 'height', 'h'
        return element.getBoundingClientRect().height
      when 'left', 'x'
        return element.getBoundingClientRect().left
      when 'top', 'y'
        return element.getBoundingClientRect().top
      # Read-only values
      when 'bottom'
        return @measure(element, 'top') + @measure(element, 'height')
      when 'right'
        return @measure(element, 'left') + @measure(element, 'width')
      when 'centerX'
        return @measure(element, 'left') + @measure(element, 'width') / 2
      when 'centerY'
        return @measure(element, 'top') + @measure(element, 'height') / 2

module.exports = Getter
