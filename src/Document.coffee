Engine = require('./Engine')
Variable = require('./engine/commands/Variable')


class Document extends Engine
  @Measurement:   require('./document/types/Measurement')
  @Primitive:     require('./document/types/Primitive')
  @Unit:          require('./document/commands/Unit')

  class Document::Input extends Engine::Input
    Selector:     require('./document/commands/Selector')
    Stylesheet:   require('./document/commands/Stylesheet')
    Unit:         Document.Unit::Macro
    

  class Document::Output extends Engine::Output
    Style:        require('./document/Style')
    Properties:   require('./document/properties/Styles')
    Unit:         Document.Unit::Numeric

    Gradient:     require('./document/types/Gradient')
    Matrix:       require('./document/types/Matrix')
    Easing:       require('./document/types/Easing')
    Color:        require('./document/types/Color')
    URL:          require('./document/types/URL')

    Number:       Document.Primitive.Number
    Integer:      Document.Primitive.Integer
    String:       Document.Primitive.String
    Strings:      Document.Primitive.Strings
    Size:         Document.Primitive.Size
    Position:     Document.Primitive.Position
    
    Length:       Document.Measurement.Length
    Time:         Document.Measurement.Time
    Frequency:    Document.Measurement.Frequency
    Angle:        Document.Measurement.Angle
    Percentage:   Document.Measurement.Percentage
    

    pretransform: (id) ->
      if element = @identity[id]

        return @Matrix.rst(
          @get(id, 'rotate-x')    || 0
          @get(id, 'rotate-y')    || 0
          @get(id, 'rotate-z')    || 0
          @get(id, 'scale-x')     ? 1
          @get(id, 'scale-y')     ? 1
          @get(id, 'scale-z')     ? 1
          @get(id, 'translate-x') || 0
          @get(id, 'translate-y') || 0
          @get(id, 'translate-z') || 0
        )

  
  class Document::Data extends Engine::Data
    immediate:    true
    Properties:   require('./document/properties/Getters')

    Length:       Document.Measurement.Length
    Time:         Document.Measurement.Time
    Frequency:    Document.Measurement.Frequency
    Angle:        Document.Measurement.Angle
    Percentage:   Document.Measurement.Percentage

    perform: ->
      if arguments.length < 4 && @data.subscribers
        @console.start('Measure', @values)
        scope = @scope
        if scope.nodeType == 9
          @measure(scope, 0, 0)
          scope = scope.body

        @each scope, 'measure'
        @console.end(@changes)
        return @propagate @commit()
      
    # Reset intrinsic style when observed initially
    subscribe: (id, property) ->
      if (node = @identity.solve(id)) && node.nodeType == 1
        property = property.replace(/^intrinsic-/, '')
        path = @getPath(id, property)
        if @engine.values.hasOwnProperty(path) || @engine.updating.solution?.hasOwnProperty(path)
          node.style[@camelize property] = ''
        @updating.reflown = true

    unsubscribe: (id, property, path) ->
      @output.set path, null
      @set path, null
      

    get: (object, property) ->
      unless (value = super)?
        path = @getPath(object, property)
        if (value = @fetch(path))?
          @set(null, path, value)
      return value# || 0

    fetch: (path) ->
      if (prop = @properties[path])?
        if typeof prop == 'function'
          return prop.call(@, object)
        else
          return prop
        return value
      else 
        if (j = path.indexOf('[')) > -1
          id = path.substring(0, j)
          property = path.substring(j + 1, path.length - 1)
          object = @identity.solve(path.substring(0, j))

          if (prop = @properties[property])?
            if prop.axiom
              return prop.call(@, object)
            else if typeof prop != 'function'
              return prop
            else if property.indexOf('intrinsic') == -1
              return prop.call(@, object)

  constructor: (data, url, scope = document) ->
    super
    
    @scope = @getScopeElement(scope)
    Engine[@identify(@scope)] = @

    if @scope.nodeType == 9
      state = @scope.readyState
      if state != 'complete' && state != 'loaded' && 
          (state != 'interactive' || document.documentMode)
        document.addEventListener('DOMContentLoaded', @engine, false)
        document.addEventListener('readystatechange', @engine, false)
        window  .addEventListener('load',             @engine, false)
      else
        setTimeout =>
          unless @engine.running
            @engine.compile()
        , 10

    @input.Selector.observe(@engine)

    @scope.addEventListener 'scroll', @engine, true
    window?.addEventListener 'resize', @engine, true

  prefixes: ['moz', 'webkit', 'ms']
    

  write: (update) ->
    @input.Selector.disconnect(@, true)
    @propagate(update.changes)
    @input.Stylesheet.rematch(@)
    if assigned = @assign(update.changes)
      update.assigned = true
    @input.Selector.connect(@, true)
    return assigned

  $$events:

    validate: (update) ->
      if @data.subscribers && update.domains.indexOf(@data, update.index + 1) == -1
        @data.verify('::window', 'width')
        @data.verify('::window', 'height')
        @data.verify(@scope, 'width')
        @data.verify(@scope, 'height')
        
        @propagate @data.solve()
    apply: ->


    remove: (path) ->
      @input.Stylesheet.remove(@, path)
      @data.remove(path)

    compile: ->
      scope = @scope.body || @scope
      for property, value of @output.properties
        unless scope.style[property]?
          prop = @camelize(property)
          prop = prop.charAt(0).toUpperCase() + prop.slice(1)
          for prefix in @prefixes
            prefixed = prefix + prop
            if scope.style[prefixed]?
              value.property = '-' + prefix + '-' + property
              value.camelized = prefixed
              
      @solve @input.Stylesheet.operations
      @input.Selector.connect(@, true)


    solve: ->
      if @scope.nodeType == 9
        html = @scope.documentElement
        klass = html.className
        if klass.indexOf('gss-ready') == -1
          @input.Selector.disconnect(@, true)
          html.setAttribute('class', (klass && klass + ' ' || '') + 'gss-ready')
          @input.Selector.connect(@, true)

    finish: (update) ->
      # Unreference removed elements
      if removed = update?.removed
        for element in removed
          @identity.unset(element)
        update.removed = undefined


    resize: (e = '::window') ->
      id = e.target && @identify(e.target) || e
      
      unless @resizer?
        if e.target && @updating
          if @updating.resizing
            return @updating.resizing = 'scheduled'
          @updating.resizing = 'computing'
        @once 'solve', ->
          requestAnimationFrame ->
            if @updated?.resizing == 'scheduled'
              @triggerEvent('resize')
      else
        cancelAnimationFrame(@resizer)

      @resizer = requestAnimationFrame =>
        @resizer = undefined
        if @updating && !@updating.resizing
          @updating.resizing = 'scheduled'
          return
        @solve 'Resize', id, ->
          if @scope._gss_id != id
            @data.verify(id, "width")
            @data.verify(id, "height")
          if id != '::document'
            @data.verify(id, "width")
            @data.verify(id, "height")
          @data.verify(@scope, "width")
          @data.verify(@scope, "height")
          return @data.commit()
          
    scroll: (e = '::window') ->
      id = e.target && @identify(e.target) || e
      @solve 'Scroll', id, ->
        if id == '::window'
          @data.verify('::document', "scroll-top")
          @data.verify('::document', "scroll-left")
        @data.verify(id, "scroll-top")
        @data.verify(id, "scroll-left")
        return @data.commit()
        
    # Fire as early as possible
    DOMContentLoaded: ->
      document.removeEventListener 'DOMContentLoaded', @
      @compile()
      @solve 'Ready', ->

    # Wait for web fonts
    readystatechange: ->
      if @running && document.readyState == 'complete'
        @solve 'Statechange', ->

    # Remeasure when images are loaded
    load: ->
      window.removeEventListener 'load', @
      document.removeEventListener 'DOMContentLoaded', @
      @solve 'Loaded', ->

    # Unsubscribe events and observers
    destroy: ->
      if @scope
        Engine[@scope._gss_id] = undefined
        for element in @scope.getElementsByTagName('*')
          @identity.unset(element)
        @identity.unset(@scope)
        @dispatchEvent(@scope, 'destroy')
      @scope.removeEventListener 'DOMContentLoaded', @
      #if @scope != document
      #  document.removeEventListener 'scroll', @
      @scope.removeEventListener 'scroll', @
      window.removeEventListener 'resize', @

      @input.Selector.disconnect(@)


  getComputedStyle: (element, force) ->
    unless (old = element.currentStyle)?
      computed = (@computed ||= {})
      id = @identify(element)
      old = computed[id]
      if force || !old?
        return computed[id] = window.getComputedStyle(element)
    return old

  # Set or unset absolute position 
  setAbsolutePosition: (element, property, value) ->
    position = element.style.position
    if element.positioned == undefined
      element.positioned = + !!position
    if position && position != 'absolute'
      return
    if element.style[property] == ''
      if value? && value != ''
        element.positioned = (element.positioned || 0) + 1
    else 
      if !value? || value == ''
        element.positioned = (element.positioned || 0) - 1
    if element.positioned == 1
      element.style.position = 'absolute'
    else if element.positioned == 0
      element.style.position = ''


  setStyle: (element, property, value = '', continuation, operation) -> 
    switch property
      when "x"
        property = "left"
      when "y"
        property = "top"

    return unless prop = @output.properties[property]
    camel = prop.camelized || @camelize(property)
    
    if typeof value != 'string'
      if value < 0 && (property == 'width' || property == 'height')
        @console.warn(property + ' of', element, ' is negative: ', value)

      value = prop.format(value)


    else if parent = operation
      while parent.parent
        parent = parent.parent
        if parent.command.type == 'Condition' && !parent.command.global
          break

      if parent.command.parse
        if parent.command.set @, operation, @Command::delimit(continuation), element, property, value
          return

    path = @getPath(element, 'intrinsic-' + property)

    if @data.watchers?[path]
      return

    if property == 'left' || property == 'top'
      @setAbsolutePosition(element, property, value)

    if element.style[camel] != undefined
      element.style[camel] = value
    return

  # Iterate elements and measure intrinsic offsets
  each: (parent, callback, x = 0,y = 0, a,r,g,s) ->
    scope = @engine.scope

    # Calculate new offsets for given element and styles
    if offsets = @[callback](parent, x, y, a,r,g,s)
      x += offsets.x || 0
      y += offsets.y || 0

    if parent.offsetParent == scope
      x -= scope.offsetLeft
      y -= scope.offsetTop
    else if parent != scope
      if !offsets 
        measure = true

    # Recurse to children
    if parent == document
      parent = document.body
    child = parent.firstChild

    while child
      if child.nodeType == 1
        # Elements with explicitly set position: relative 
        # lay yout their children as if the parent was at 0,0
        if child.style.position == 'relative'
          @each(child, callback, 0, 0, a,r,g,s)
        else
          if measure && child.offsetParent == parent
            x += parent.offsetLeft + parent.clientLeft
            y += parent.offsetTop + parent.clientTop
            measure = false
          @each(child, callback, x, y, a,r,g,s)
        
      child = child.nextSibling
    return a

  getStyle: (node, property) ->
    property = @camelize(property)
    value = node.style[property] || @getComputedStyle(node)[property]
    if value
      num = parseFloat(value)
      if String(num) == String(value) || (num + 'px') == value
        return num
    return value
    
  measure: (node, x, y, full) ->
    if id = node._gss_id
      if properties = @data.subscribers[id]
        if node.nodeType == 9
          node = node.documentElement

        for prop of properties
          switch prop
            when "intrinsic-x", "computed-x", "intrinsic-left", "computed-left"
              @set id, prop, x + node.offsetLeft
            when "intrinsic-y", "computed-y", "intrinsic-top", "computed-top"
              @set id, prop, y + node.offsetTop
            when "intrinsic-width",  "computed-width"
              @set id, prop, node.offsetWidth
            when "intrinsic-height", "computed-height"
              @set id, prop, node.offsetHeight
            when "scroll-top", "scroll-left"

            
            else
              style = prop.replace(/^(?:computed|intrinsic)-/, '')
              if prop != style
                if @properties[style]
                  @set id, prop, @get(node, style)
                else if @output.properties[style]
                  @set id, prop, @getStyle(node, style)

    return

  camelize: (string) ->
    return string.toLowerCase().replace /-([a-z])/gi, (match) ->
      return match[1].toUpperCase()

  dasherize: (string) ->
    return string.replace /[A-Z]/g, (match) ->
      return '-' + match[0].toLowerCase()


  group: (data) ->


    # Apply changed styles in batch, 
    # leave out positioning properties (Restyle/Reflow)
    pretransforms = @updating.pretransform
    transforms = result = undefined

    for path, value of data
      last = path.lastIndexOf('[')
      continue if last == -1
      property = path.substring(last + 1, path.length - 1)
      id = path.substring(0, last)

      # Find unregistered elements by id
      continue if id.charAt(0) == ':'
      unless element = @engine.identity[id]
        continue if id.indexOf('"') > -1
        continue unless element = document.getElementById(id.substring(1))
      
      if @values[id + '[intrinsic-' + property + ']']?
        continue

      console.info(property)
      if (property == 'x' || property == 'y') 
        key = 'positions'
      else if prop = @output.properties[property]
        key = 'styles'
        if prop.task
          (@updating[prop.task] ||= {})[id] ||= true
          if prop.task == 'pretransform'
            pretransforms = @updating.pretransform

        if property == 'transform'
          (pretransforms ||= {})[id] = @output.pretransform(id)
          (transforms ||= {})[id] = value
          continue
      else
        continue

      (((result ||= {})[key] ||= {})[id] ||= {})[property] = value

    # Combine matricies
    if pretransforms
      for id, pretransform of pretransforms
        if pretransform == true
          pretransform = @output.pretransform(id) 
        
        transform = transforms?[id] || @values[id + '[transform]']


        (((result ||= {}).styles ||= {})[id] ||= {}).transform = 
          if pretransform && transform
            @output.Matrix.prototype._mat4.multiply(pretransform, transform, pretransform)
          else
            pretransform || transform || null


      @updating.pretransform = undefined

      
    return result

      
  ### 
  Applies style changes in bulk, separates reflows & positions.
  It recursively offsets global coordinates to respect offset parent, 
  then sets new positions
  ###

  assign: (data) ->
    unless changes = @group(data)
      return

    @console.start('Apply', data)

    for id, styles of changes.styles
      element = @identity[id] || document.getElementById(id.substring(1))
      if element.nodeType == 1
        for prop, value of styles
          @setStyle(element, prop, value)


    if changes.positions
      # Adjust positioning styles to respect element offsets 
      @each(@scope, 'placehold', null, null, changes.positions)

      for id, styles of changes.positions
        element = @identity[id] || document.getElementById(id.substring(1))
        for prop, value of styles
          if element.nodeType == 1
            @setStyle(element, prop, value)

    @console.end(changes)
    return true

  # Calculate offsets according to new values (but dont set anything)
  placehold: (element, x, y, positioning, full) ->
    offsets = undefined
    if uid = element._gss_id
      # Adjust newly set positions to respect parent offsets
      styles = positioning?[uid]
      if values = @engine.values
        if styles?.x == undefined
          if (left = values[uid + '[x]'])?
            (styles ||= (positioning[uid] ||= {})).x = left
        if styles?.y == undefined
          if (top = values[uid + '[y]'])?
            (styles ||= (positioning[uid] ||= {})).y = top

      if styles
        for property, value of styles
          unless value == null
            switch property
              when "x"
                styles.x = value - x
                (offsets ||= {}).x = value - x
              when "y"
                styles.y = value - y
                (offsets ||= {}).y = value - y



    return offsets

module.exports = Document
