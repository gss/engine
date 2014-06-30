class Values
  constructor: (@engine) ->

  get: (id, property) ->
    if property == null
      property = id
      id = null
    if id
      path = id + '[' + property + ']'
    else
      path = property
    return @[path]

  merge: (object) ->
    for prop, value of object
      old = @[prop]
      continue if old == value
      if @engine._onChange
        @engine._onChange prop, value, old
      if value?
        @[prop] = value
      else
        delete @[prop]
    @

  export: ->
    object = {}
    for property, value of @
      if @hasOwnProperty property
        if property != 'engine'
          object[property] = value
    return object

module.exports = Values