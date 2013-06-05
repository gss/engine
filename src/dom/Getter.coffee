Getter = (container) ->
  @container = (if container then container else document)
  @container

Getter::get = (selector) ->
  method = selector[0]
  identifier = selector[1]
  switch method
    when "$id"
      return @getById(identifier)
    when "$class"
      return @getByClass(identifier)
    when "$tag"
      return @getByTag(identifier)
  document.querySelectorAll identifier

module.exports = Getter