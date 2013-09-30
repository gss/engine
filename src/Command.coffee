class Command
  constructor: (@engine) ->

  # generates vars for each element
  'var': (id, prop, elements) ->
    if elements instanceof Array
      for el in elements
        @engine.registerCommand 'var', el.id + prop
      elements.onadd (newElements) ->
        for el in elements
          @engine.registerCommand 'var', el.id + prop
    else # pass through
      @engine.registerCommand "var", arguments...

  '$class': (className) ->
    @engine._registerLiveNodeList "." + className, () =>
      return @engine.container.getElementsByClassName(className)

module.exports = Command
