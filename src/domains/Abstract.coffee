# Transforms variables into tracked variables

Domain = require('../concepts/Domain')

class Abstract extends Domain

class Abstract::Methods

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

  value: (value) ->
    return value

  "<": (a, b) ->
    return a < b

  ">": (a, b) ->
    return a > b

  "+": (a, b) ->
    return a + b

  "-": (a, b) ->
    return a - b

  "*": (a, b) ->
    return a * b

  "/": (a, b) ->
    return a / b

module.exports = Abstract