class Exporter
  constructor: (@engine) ->
    return unless @command = location.search.match(/export=([a-z0-9]+)/)?[1]

    @preexport()

  preexport: =>
    # Let every element get an ID
    if (scope = @engine.scope).nodeType == 9
      scope = @engine.scope.body
    @engine.identify(scope)
    for element in scope.getElementsByTagName('*')
      if element.tagName != 'SCRIPT' &&
          (element.tagName != 'STYLE' || element.getAttribute('type')?.indexOf('gss') > -1)
        @engine.identify(element)
    if window.Sizes
      @sizes = []
      for pairs in window.Sizes
        for width in pairs[0]
          for height in pairs[1]
            @sizes.push(width + 'x' + height)

    if @command.indexOf('x') > -1
      [width, height] = @command.split('x')
      baseline = 72
      width = parseInt(width) * baseline
      height = parseInt(height) * baseline
      window.addEventListener 'load', =>
        localStorage[@command] = JSON.stringify(@export())
        @postexport()

      document.body.style.width = width + 'px'
      @engine.data.properties['::window[height]'] = ->
        return height
      @engine.data.properties['::window[width]'] = ->
        return width

    else 
      if @command == 'true'
        localStorage.clear()
        @postexport()

  postexport: =>
    for size in @sizes
      unless localStorage[size]
        location.search = location.search.replace(/[&?]export=([a-z0-9])+/, '') + '?export=' + size
        return
    result = {}
    for property, value of localStorage
      if property.match(/^\d+x\d+$/)
        result[property] = JSON.parse(value)
    document.write(JSON.stringify(result))

  export: ->
    values = {}
    for path, value of @engine.values
      if (index = path.indexOf('[')) > -1 && path.indexOf('"') == -1
        property = @engine.data.camelize(path.substring(index + 1, path.length - 1))
        id = path.substring(0, index)
        if property == 'x' || property == 'y' || document.body.style[property] != undefined
          unless @engine.values[id + '[intrinsic-' + property + ']']?
            values[path] = Math.ceil(value)
    values.stylesheets = @engine.document.Stylesheet.export() 
    return values

module.exports = Exporter