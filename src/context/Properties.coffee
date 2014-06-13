# Handles side effects caused by elements changing position or size

class Properties

  # Global getters

  '::window[width]': (context) ->
    w = window.innerWidth
    w = w - GSS.get.scrollbarWidth() if GSS.config.verticalScroll
    return ['suggest', ['get', "::window[width]"], w, 'required']

  '::window[height]': (context) ->
    h = window.innerHeight
    h = h - GSS.get.scrollbarWidth() if GSS.config.horizontalScroll
    return ['suggest', ['get', "::window[height]"], w, 'required']


  # Constants

  '::window[x]': 0
  '::window[y]': 0
  '::scope[x]': 0
  '::scope[y]': 0


  # Formulas

  "[right]": (scope) ->
    return @plus(@get("[x]", scope), @get("[width]", scope))
  
  "[bottom]": (scope) ->
    return @plus(@get("[y]", scope), @get("[height]", scope))
  
  "[center-x]": (scope) ->
    return @plus(@get("[x]", scope), @divide(@get("[width]", scope), 2))

  "[center-y]": (scope) ->
    return @plus(@get("[y]", scope), @divide(@get("[height]", scope), 2))


  'get$':
    prefix: '['
    suffix: ']'
    command: (path, object, property) ->
      if object.nodeType
        id = @engine.references.acquire(object)
      else if object.absolute is 'window'
        return ['get',"::window[#{prop}]", path]
    
      # intrinsics
      if property.indexOf("intrinsic-") is 0
        if @register "$" + id + "[intrinsic]", context
          # Todo: Measure here
          if engine.vars[k] isnt val
            return ['suggest', ['get', property, id, path], val, 'required'] 
      return ['get', property, '$' + id, path]

module.exports = Properties