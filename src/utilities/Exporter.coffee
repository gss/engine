
  preexport: ->

    # Let every element get an ID
    if (scope = @scope).nodeType == 9
      scope = @scope.body
    @identity.provide(scope)
    for element in scope.getElementsByTagName('*')
      if element.tagName != 'SCRIPT' &&
          (element.tagName != 'STYLE' || element.getAttribute('type')?.indexOf('gss') > -1)
        @identity.provide(element)
    if window.Sizes
      @sizes = []
      for pairs in window.Sizes
        for width in pairs[0]
          for height in pairs[1]
            @sizes.push(width + 'x' + height)
    if match = location.search.match(/export=([a-z0-9]+)/)?[1]
      if match.indexOf('x') > -1
        [width, height] = match.split('x')
        baseline = 72
        width = parseInt(width) * baseline
        height = parseInt(height) * baseline
        window.addEventListener 'load', =>
          localStorage[match] = JSON.stringify(@export())
          @postexport()

        document.body.style.width = width + 'px'
        @intrinsic.properties['::window[height]'] = ->
          return height
        @intrinsic.properties['::window[width]'] = ->
          return width

      else 
        if match == 'true'
          localStorage.clear()
          @postexport()

  postexport: ->
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
    for path, value of @values
      if (index = path.indexOf('[')) > -1 && path.indexOf('"') == -1
        property = @camelize(path.substring(index + 1, path.length - 1))
        id = path.substring(0, index)
        if property == 'x' || property == 'y' || document.body.style[property] != undefined
          unless @values[id + '[intrinsic-' + property + ']']?
            values[path] = Math.ceil(value)
    values.stylesheets = @stylesheets.export() 
    return values
