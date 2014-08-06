class Variables

  get:
    command: (operation, continuation, scope, meta, object, property) ->
      if typeof object == 'string'
        id = object

      # Get document property
      else if object.absolute is 'window' || object == document
        id = '::window'

      # Get element property
      else if object.nodeType
        id = @identity.provide(object)

      unless property
        # Get global variable
        id = ''
        property = object
        object = undefined

      return ['get', id, property, @getContinuation(continuation || '')]

  set:
    command: ->
      object = @intrinsic || @assumed
      object.set.apply(object, arguments)

  suggest:
    command: ->
      @assumed.set.apply(@assumed, arguments)

  got: (value) ->
    return value

  value: (value) ->
    return value

Variables::got .hidden = true

module.exports = Variables