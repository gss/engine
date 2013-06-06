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
      when 'width'
        return element.getBoundingClientRect().width

module.exports = Getter
