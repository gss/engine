class Styles
  @Matrix: require('../../vendor/gl-matrix.js')

  constructor: (@engine) -> 

  # Receive solved styles
  read: (data) ->
    @lastInput = JSON.parse JSON.stringify data

    intrinsic = null

    # Filter out intrinsic properties, ignore their non-intrinsic parts
    for path, value of data
      index = path.indexOf('[intrinsic-')
      if index > -1
        property = path.substring(index + 1, path.length - 1)
        data[prop] = undefined
        (intrinsic ||= {})[path] = value

    # Apply changed styles
    for path, value of data
      @set(path, undefined, value)

    # Compare intrinsic properties
    if intrinsic
      for path, value of intrinsic
        @set(path, undefined, value)
        
    @engine.triggerEvent('solved', data, intrinsic)



  remove: (id) ->
    delete @[id]

  camelize: (string) ->
    return (@camelized ||= {})[string] ||= 
      string.toLowerCase().replace /-([a-z])/i, (match) ->
        return match[1].toUpperCase()

  dasherize: (string) ->
    return (@dasherized ||= {})[string] ||= 
      string.replace /[A-Z]/, (match) ->
        return '-' + match[0].toLowerCase()

  get: (path, property, value) ->
    element = @references.get(path)
    camel = @camelize(property)
    style = element.style
    value = style[camel]
    if value != undefined
      return value
    @

  set: (path, property, value) ->
    if property == undefined
      last = path.lastIndexOf('[')
      property = path.substring(last + 1, path.length - 1)
      path = path.substring(0, last)

    element = @engine.references.get(path)
    camel = @camelize(property)
    style = element.style
    if style[camel] != undefined
      if typeof value == 'number' && property != 'zIndex'
        value += 'px'
      style[camel] = value
    @
    
  position: (node, offsets) ->

  matrix: (node, offsets) ->

    
module.exports = Styles