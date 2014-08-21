# Transforms variables into tracked variables

Domain = require('../concepts/Domain')

class Abstract extends Domain

class Abstract::Methods

  get:
    command: (operation, continuation, scope, meta, object, property, contd) ->
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

      if object
        if prop = @properties[property]
          unless prop.matcher
            return prop.call(@, object, contd)
      if @getContinuation(continuation || contd || '') == ".group .vessel$vessel1↓ .box:last-child$box5"
        debugger
      return ['get', id, property, @getContinuation(continuation || contd || '')]

  set:
    command: ->
      object = @intrinsic || @assumed
      object.set.apply(object, arguments)

  suggest:
    command: ->
      @assumed.set.apply(@assumed, arguments)

  value: (value, continuation, string, exported) ->
    console.info(Array.prototype.slice.call(arguments))
    if exported
      op = string.split(',')
      scope = op[1]
      property = op[2]
      @engine.values[@engine.getPath(scope, property)] = value
    return value

# Proxy math for axioms
for op in ['+', '-', '*', '/']
  do (op) ->
    Abstract::Methods::[op] = (a, b) ->
      return [op, a, b]

module.exports = Abstract