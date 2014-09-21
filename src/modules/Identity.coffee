class Identity
  @uid: 0
  
  # Get or generate uid for a given object.
  provide: (object, generate) ->
    if typeof object == 'string'
      return '$' + object
    unless id = object._gss_id
      if object == document
        id = "::document"
      else if object == window
        id = "::window"

      unless generate == false
        object._gss_id = id ||= 
          "$" + (object.id || ++Identity.uid)
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
    return @provide(object, false)

module.exports = Identity