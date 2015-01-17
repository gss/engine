Abstract = require('./Abstract')

class Document extends Abstract
  priority: Infinity
  
  Selector:    require('../commands/Selector')
  Stylesheet:  require('../commands/Stylesheet')

  constructor: () ->
    super

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

    @Selector.observe(@engine)

    @scope.addEventListener 'scroll', @engine, true
    #if @scope != document
    #  document.addEventListener 'scroll', engine, true
    window?.addEventListener 'resize', @engine, true


  events:

    apply: ->
      @document.Selector.disconnect(@, true)

    write: (solution) ->
      @document.Stylesheet.rematch(@)

    flush: ->
      @document.Selector.connect(@, true)

    remove: (path) ->
      @document.Stylesheet.remove(@, path)

    compile: ->
      @solve @document.Stylesheet.operations
      @document.Selector?.connect(@, true)

    solve: ->
      if @scope.nodeType == 9
        html = @scope.documentElement
        klass = html.className
        if klass.indexOf('gss-ready') == -1
          @document.Selector.disconnect(@, true)
          html.setAttribute('class', (klass && klass + ' ' || '') + 'gss-ready')
          @document.Selector.connect(@, true)


      # Unreference removed elements
      if @document.removed
        for id in @document.removed
          @identity.unset(id)
        @document.removed = undefined


    resize: (e = '::window') ->
      id = e.target && @identify(e.target) || e
      console.error('resize event')

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
          @intrinsic.verify(id, "width")
          @intrinsic.verify(id, "height")
          @intrinsic.verify(@scope, "width")
          @intrinsic.verify(@scope, "height")
          return @intrinsic.commit()
          
    scroll: (e = '::window') ->
      id = e.target && @identify(e.target) || e
      @solve 'Scroll', id, ->
        @intrinsic.verify(id, "scroll-top")
        @intrinsic.verify(id, "scroll-left")
        return @intrinsic.commit()
        
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
      @scope.removeEventListener 'DOMContentLoaded', @
      #if @scope != document
      #  document.removeEventListener 'scroll', @
      @scope.removeEventListener 'scroll', @
      window.removeEventListener 'resize', @

      @document.Selector.disconnect(@, true)

  @condition: ->
    @scope?

  url: null

module.exports = Document
