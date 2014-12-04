Abstract = require('./Abstract')

class Document extends Abstract
  priority: Infinity
  
  Selector:    require('../commands/Selector')
  Stylesheet:  require('../commands/Stylesheet')
               
  Queries:     require('../structures/Queries')
  Pairs:       require('../structures/Pairs')
  Mutations:   require('../structures/Mutations')
  Positions:   require('../structures/Positions')

  disconnected: true

  constructor: () ->
    # Export modules into engine
    engine = @engine
    engine.positions   ||= new @Positions(@)
    engine.queries     ||= new @Queries(@)
    engine.pairs       ||= new @Pairs(@)
    engine.mutations   ||= new @Mutations(@)
    engine.applier     ||= engine.positions
    engine.scope       ||= document

    if document.nodeType == 9 && ['complete', 'loaded'].indexOf(document.readyState) == -1
      document.addEventListener('DOMContentLoaded', engine)
      document.addEventListener('readystatechange', engine)
      window  .addEventListener('load',             engine)
    else if @running
      @events.compile.call(@)
      
    @scope.addEventListener 'scroll', engine, true
    #if @scope != document
    #  document.addEventListener 'scroll', engine, true
    window?.addEventListener 'resize', engine

    super

  events:
    resize: (e = '::window') ->
      id = e.target && @identify(e.target) || e

      unless @resizer?
        if e.target && @updating
          if @updating.resizing
            return @updating.resizing = 'scheduled'
          @updating.resizing = 'computing'
        @once 'solve', ->
          setTimeout ->
            if @updated?.resizing == 'scheduled'
              @triggerEvent('resize')
          , 10
      else
        clearTimeout(@resizer);

      @resizer = setTimeout =>
        @resizer = undefined
        @solve id + ' resized', ->
          @intrinsic.verify(id, "width")
          @intrinsic.verify(id, "height")
      , 10
      
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
        @intrinsic.solve()

    # Observe and parse stylesheets

    compile: ->
      @document.Stylesheet.compile(@document)

    solve: ->
      if @scope.nodeType == 9
        html = @scope.body.parentNode
        klass = html.className
        if klass.indexOf('gss-ready') == -1
          @mutations?.disconnect(true)
          html.className = (klass && klass + ' ' || '') + 'gss-ready' 
          @mutations?.connect(true)

    
      # Unreference removed elements
      if @document.removed
        for id in @document.removed
          @identity.unset(id)
        @document.removed = undefined
      
    commit: ->
      @document.Stylesheet.perform(@document)
      
    destroy: ->
      @scope.removeEventListener 'DOMContentLoaded', @
      #if @scope != document
      #  document.removeEventListener 'scroll', @
      @scope.removeEventListener 'scroll', @
      window.removeEventListener 'resize', @

  @condition: ->
    @scope?  

  transact: ->
    if result = super
      @mutations?.disconnect(true)
      return result

  commit: ->
    if result = super
      @mutations?.connect(true)
      return result 
  url: null
module.exports = Document