Abstract = require('./Abstract')

class Document extends Abstract
  priority: Infinity
  
  Selector:   require('../commands/Selector')
  Iterator:   require('../commands/Iterator')
  Condition:  require('../commands/Condition')
  Source:     require('../commands/Source')
              
  Queries:    require('../modules/Queries')
  Pairs:      require('../modules/Pairs')

  Mutations:  require('../modules/Mutations')
  Positions:  require('../modules/Positions')
  Stylesheet: require('../modules/Stylesheets')

  helps: true
  disconnected: true

  constructor: () ->
    # Export modules into engine
    engine = @engine
    engine.positions   ||= new @Positions(@)
    engine.stylesheets ||= new @Stylesheet(@)
    engine.queries     ||= new @Queries(@)
    engine.pairs       ||= new @Pairs(@)
    engine.mutations   ||= new @Mutations(@)
    engine.applier     ||= engine.positions
    engine.scope       ||= document
    engine.all           = engine.scope.getElementsByTagName('*')

    if @scope.nodeType == 9 && ['complete', 'loaded'].indexOf(@scope.readyState) == -1
      @scope.addEventListener 'DOMContentLoaded', engine
      document.addEventListener 'readystatechange', engine
      window.addEventListener 'load', engine
    else if @running
      @events.compile.call(@)
      
    @scope.addEventListener 'scroll', engine, true
    if window?
      window.addEventListener 'resize', engine

    super

  events:
    resize: (e = '::window') ->
      id = e.target && @identity.provide(e.target) || e

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
      , 20
      
    scroll: (e = '::window') ->
      id = e.target && @identity.provide(e.target) || e
      @solve id + ' scrolled', ->
        @intrinsic.verify(id, "scroll-top")
        @intrinsic.verify(id, "scroll-left")

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

    # Observe stylesheets in dom
    DOMContentLoaded: ->
      @scope.removeEventListener 'DOMContentLoaded', @
      @engine.compile() if @running == undefined

    readystatechange: ->
      document.removeEventListener 'readystatechange', @
      if @running == undefined
        @triggerEvent('DOMContentLoaded')
      @solve 'Document', 'onload', ->
        @intrinsic.solve([])
    
    load: ->
      if @running == undefined
        @triggerEvent('DOMContentLoaded')
      window.removeEventListener 'load', @
      @solve 'Document', 'onload', ->
        @intrinsic.solve([])

    # Observe and parse stylesheets
    compile: ->
      @console.profile(1)
      @stylesheets.compile()
      @console.profileEnd(1)
      
    destroy: ->
      @scope.removeEventListener 'DOMContentLoaded', @
      @scope.removeEventListener 'scroll', @
      window.removeEventListener 'resize', @
      @events.destroy.apply(@, arguments)

  @condition: ->
    @scope?  
  url: null
module.exports = Document