# Stupid simple observable object
# Will handle references and ownership for garbage collection

module.exports = class Registry
  constructor: (@object) ->

  append: (path, value) ->
    group = @[path] ||= []
    console.warn('append', value, '@', path)
    if typeof value != 'string'
      value = path + @object.toId(value)
    group.push value

  set: (path, value) ->
    if value == undefined
      old = @[path]
      if old
        @object.onRemove(path, old)
    else
      if typeof value != 'string'
        value = path + @object.toId(value)
      @[path] = value

  remove: (path, value) ->
    if typeof value != 'string'
      id = value._gss_id
      value = path + "$" + id
    if group = @[path]
      console.group('remove ' + path)
      delete @[path]
      if group instanceof Array
        if (index = group.indexOf(value)) > -1
          group.splice(index, 1)
          @object.onRemove(path, value, id)
      else
        @object.onRemove(path, value, id)
      console.groupEnd('remove ' + path)