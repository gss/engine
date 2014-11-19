class Identity
  @uid: 0
  
  # Get or generate uid for a given object.
  yield: (object, generate) ->
    if typeof object == 'string'
      if object.charAt(0) != '$' && object.charAt(0) != ':'
        return '$' + object
      return object
    unless id = object._gss_id
      if object == document
        id = "::document"
      else if object == window
        id = "::window"

      unless generate == false
        if uid = object._gss_uid
          object._gss_id = uid
        object._gss_id = id ||= 
          "$" + (object.id || object._gss_id || ++Identity.uid)
        @[id] = object
    return id

  get: (id) ->
    return @[id]

  solve: (id) ->
    return @[id]

  unset: (object) ->
    delete @[object._gss_id]

  # Get id if given object has one
  find: (object) ->
    return @yield(object, false)

module.exports = Identity