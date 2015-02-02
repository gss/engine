Engine = require('./Engine')

class Document extends Engine
  @Measurement:   require('./document/types/Measurement')
  @Primitive:     require('./document/types/Primitive')

  class Document::Input extends Engine::Input
    Selector:     require('./document/commands/Selector')
    Stylesheet:   require('./document/commands/Stylesheet')
    Unit:         require('./document/commands/Unit')
    

  class Document::Output extends Engine::Output
    Style:        require('./document/Style')
    Properties:   require('./document/properties/Styles')
    Unit:         require('./document/commands/Unit')

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
        @each @scope, 'measure'
        @console.end(@changes)
      return @commit()
      
    # Reset intrinsic style when observed initially
    subscribe: (id, property) ->
      if (node = @identity.solve(id)) && node.nodeType == 1
        property = property.replace(/^intrinsic-/, '')
        path = @getPath(id, property)
        if @engine.values.hasOwnProperty(path) || @engine.updating.solution?.hasOwnProperty(path)
          node.style[property] = ''

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


  $$events:

    validate: (solution, update) ->
      if @data.subscribers && update.domains.indexOf(@data, update.index + 1) == -1
        @data.verify('::window', 'width')
        @data.verify('::window', 'height')
        @data.verify(@scope, 'width')
        @data.verify(@scope, 'height')
        
        if measured = @data.solve()
          if true#Object.keys(measured).length
            update.apply measured
            @output.merge measured
    
    apply: ->
      @input.Selector.disconnect(@, true)

    write: (solution) ->
      @input.Stylesheet.rematch(@)
      if solution
        @assign(solution)

    flush: ->
      @input.Selector.connect(@, true)

    remove: (path) ->
      @input.Stylesheet.remove(@, path)
      @data.remove(path)

    compile: ->
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


      # Unreference removed elements
      if @removed
        for id in @removed
          @identity.unset(id)
        @removed = undefined


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
        @dispatchEvent(@scope, 'destroy')
      @scope.removeEventListener 'DOMContentLoaded', @
      #if @scope != document
      #  document.removeEventListener 'scroll', @
      @scope.removeEventListener 'scroll', @
      window.removeEventListener 'resize', @

      @input.Selector.disconnect(@, true)


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
    camel = @camelize property
    if typeof value != 'string'
      value = prop.format(value)

    if property == 'left' || property == 'top'
      @setAbsolutePosition(element, property, value)

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

    element.style[camel] = value
    return

  # Iterate elements and measure intrinsic offsets
  each: (parent, callback, x = 0,y = 0, a,r,g,s) ->
    scope = @engine.scope
    
    if (parent ||= scope).nodeType == 9
      @data.verify(parent, 'width')
      @data.verify(parent, 'height')
      parent = parent.body

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
        for prop of properties
          switch prop
            when "x",      "intrinsic-x",      "computed-x"
              @set id, prop, x + node.offsetLeft
            when "y",      "intrinsic-y",      "computed-y"
              @set id, prop, y + node.offsetTop
            when "width",  "intrinsic-width",  "computed-width"
              @set id, prop, node.offsetWidth
            when "height", "intrinsic-height", "computed-height"
              @set id, prop, node.offsetHeight
            else
              style = prop.replace(/^(?:computed|intrinsic)-/, '')
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
      
  ### 
  Applies style changes in bulk, separates reflows & positions.
  It recursively offsets global coordinates to respect offset parent, 
  then sets new positions
  ###

  assign: (data, node) ->
    node ||= @engine.scope

    # Apply changed styles in batch, 
    # leave out positioning properties (Restyle/Reflow)
    positioning = {}
    if data
      for path, value of data
        unless value == undefined
          @write null, path, value, positioning

    # Adjust positioning styles to respect element offsets 
    @each(node, 'placehold', null, null, positioning, !!data)

    # Set new positions in bulk (Reflow)
    positions = {}
    for id, styles of positioning
      for prop, value of styles
        positions[@getPath(id, prop)] = value

    @engine.fireEvent('positions', positions)

    for prop, value of positions
      @write null, prop, value

    return data

  write: (id, property, value, positioning) ->
    # parse $id[property] as [id, property]
    unless id?
      path = property
      last = path.lastIndexOf('[')
      return if last == -1
      property = path.substring(last + 1, path.length - 1)
      id = path.substring(0, last)

    return unless id.charAt(0) != ':'
    unless element = @engine.identity[id]
      return if id.indexOf('"') > -1
      return unless element = document.getElementById(id.substring(1))
    
    if positioning && (property == 'x' || property == 'y')
      (positioning[id] ||= {})[property] = value
    else
      @setStyle(element, property, value)

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

      # Let other measurements hook up into this batch
      # @engine.data.update(element, x, y, full)


    return offsets

module.exports = Document
