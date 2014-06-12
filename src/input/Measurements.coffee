# Handles side effects caused by elements changing position or size

class Measurements

  constructor: (@input) ->

  # Math ops compatible with constraints API

  plus: (a, b) ->
    return a + b

  minus: (a, b) ->
    return a - b

  multiply: (a, b) ->
    return a * b

  divide: (a, b) ->
    return a / b

  # Global getters

  '::window[width]': (context) ->
    w = window.innerWidth
    w = w - GSS.get.scrollbarWidth() if GSS.config.verticalScroll
    return ['suggest', ['get', "::window[width]"], ['number', w], 'required']

  '::window[height]': (context) ->
    h = window.innerHeight
    h = h - GSS.get.scrollbarWidth() if GSS.config.horizontalScroll
    return ['suggest', ['get', "::window[height]"], ['number', w], 'required']


  # Constants

  '::window[x]': 0
  '::window[y]': 0
  '::scope[x]': 0
  '::scope[y]': 0


  # Formulas

  "[right]": (path, node) ->
    return @plus(@_get(node, "x"), @_get(node, "width"))
  
  "[bottom]": (path, node) ->
    return @plus(@_get(node, "y"), @_get(node, "height"))
  
  "[center-x]": (path, node) ->
    return @plus(@_get(node, "x"), @divide(@_get(node, "width"), 2))

  "[center-y]": (path, node) ->
    return @plus(@_get(node, "y"), @divide(@_get(node, "height"), 2))


  'get$':
    prefix: '['
    suffix: ']'
    command: (path, object, property) ->
      if object.nodeType
        id = GSS.setupId(object)
      else if object.absolute is 'window'
        return ['get',"::window[#{prop}]", path]

    
      # intrinsics
      if property.indexOf("intrinsic-") is 0
        if @register "$" + id + "[intrinsic]", context
          # Todo: Measure here
          if engine.vars[k] isnt val
            return ['suggest', ['get', property, id, path], ['number', val], 'required'] 
      return ['get', property, '$' + id, path]

module.exports = Measurements