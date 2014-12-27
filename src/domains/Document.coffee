Abstract = require('./Abstract')

class Document extends Abstract
  priority: Infinity
  
  Selector:    require('../Selector')
  Stylesheet:  require('../Stylesheet')
               
  disconnected: true

  constructor: () ->
    super

    if @scope.nodeType == 9
      if ['complete', 'loaded'].indexOf(@scope.readyState) == -1
        document.addEventListener('DOMContentLoaded', @engine)
        document.addEventListener('readystatechange', @engine)
        window  .addEventListener('load',             @engine)
      else
        @compile()

    @engine.Selector = @Selector
    @engine.Stylesheet = @Stylesheet
    @Selector.observe(@engine)
      
    @scope.addEventListener 'scroll', @engine, true
    #if @scope != document
    #  document.addEventListener 'scroll', engine, true
    window?.addEventListener 'resize', @engine


  events:
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
        cancelAnimationFrame(@resizer);

      @resizer = requestAnimationFrame =>
        @resizer = undefined
        if @updating && !@updating.resizing
          @updating.resizing = 'scheduled'
          return
        @solve id + ' resized', ->
          @intrinsic.verify(id, "width")
          @intrinsic.verify(id, "height")
      
    scroll: (e = '::window') ->
      id = e.target && @identify(e.target) || e
      @solve id + ' scrolled', ->
        @intrinsic.verify(id, "scroll-top")
        @intrinsic.verify(id, "scroll-left")

    # Observe stylesheets in dom
    DOMContentLoaded: ->
      document.removeEventListener 'DOMContentLoaded', @
      @compile()

    # Wait for web fonts
    readystatechange: ->
      if @running && document.readyState == 'complete'
        @solve 'Document', 'readystatechange', ->
          @intrinsic.solve()
    
    # Remeasure when images are loaded
    load: ->
      window.removeEventListener 'load', @
      document.removeEventListener 'DOMContentLoaded', @
      @solve 'Document', 'load', ->

    # Observe and parse stylesheets

    compile: ->
      @document.Stylesheet.compile(@document)
      @Selector?.connect(@, true)

    solve: ->
      if @scope.nodeType == 9
        html = @scope.body.parentNode
        klass = html.className
        if klass.indexOf('gss-ready') == -1
          @Selector?.disconnect(@, true)
          html.className = (klass && klass + ' ' || '') + 'gss-ready' 
          @Selector?.connect(@, true)

    
      # Unreference removed elements
      if @document.removed
        for id in @document.removed
          @identity.unset(id)
        @document.removed = undefined
      
    destroy: ->
      @scope.removeEventListener 'DOMContentLoaded', @
      #if @scope != document
      #  document.removeEventListener 'scroll', @
      @scope.removeEventListener 'scroll', @
      window.removeEventListener 'resize', @

      @Selector?.disconnect(@, true)

  @condition: ->
    @scope?
    
  url: null

module.exports = Document