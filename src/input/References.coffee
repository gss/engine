# Stupid simple observable object
# Will handle references and ownership for garbage collection

class References
  constructor: (@input) ->

  combine: (path, value) ->
    return object if typeof object == 'string'
    return continuation + @valueOf(object)

  append: (path, value) ->
    group = @[path] ||= []
    group.push @combine(path, value)

  set: (path, value) ->
    if value == undefined
      old = @[path]
      if old
        @input.clean(path, old)
    else
      @[path] = @combine(path, value)

  remove: (path, value) ->
    if typeof value != 'string'
      id = value._gss_id
      value = @combine(path, id)
    if group = @[path]
      console.group('remove ' + path)
      delete @[path]
      if group instanceof Array
        if (index = group.indexOf(value)) > -1
          group.splice(index, 1)
          @input.clean(path, value, id)
      else
        @input.clean(path, value, id)
      console.groupEnd('remove ' + path)

  @uid: 0
  @get: (object, force) ->
    id = object && object._gss_id
    if !id && force
      object._gss_id = id = ++References.uid
    return id


module.exports = References