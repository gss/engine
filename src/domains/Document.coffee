
Abstract = require('./Abstract')
Native   = require('../methods/Native')

class Document extends Abstract
  priority: Infinity

  Methods:    Native::mixin {},
              Abstract::Methods,
              require('../methods/Selectors'),
              require('../methods/Rules')

  Queries:    require('../modules/Queries')
  Pairs:      require('../modules/Pairs')

  Mutations:  require('../modules/Mutations')
  Positions:  require('../modules/Positions')
  Stylesheet: require('../modules/Stylesheets')

  helps: true

  constructor: () ->
    @engine.positions   ||= new @Positions(@)
    @engine.stylesheets ||= new @Stylesheet(@)
    @engine.applier     ||= @engine.positions
    @engine.scope       ||= document
    @engine.queries     ||= new @Queries(@)
    @engine.pairs       ||= new @Pairs(@)
    @engine.mutations   ||= new @Mutations(@)
    @engine.all           = @engine.scope.getElementsByTagName('*')

    
    if @scope.nodeType == 9 && ['complete', 'interactive', 'loaded'].indexOf(@scope.readyState) == -1
      @scope.addEventListener 'DOMContentLoaded', @
    else if @running
      @events.compile.call(@)

    @scope.addEventListener 'scroll', @, true
    if window?
      window.addEventListener 'resize', @

    super

  events:
    resize: (e = '::window') ->
      id = e.target && @identity.provide(e.target) || e
      @engine.solve id + ' resized', ->
        @intrinsic.verify(id, "width")
        @intrinsic.verify(id, "height")
      
    scroll: (e = '::window') ->
      id = e.target && @identity.provide(e.target) || e
      @engine.solve id + ' scrolled', ->
        @intrinsic.verify(id, "scroll-top")
        @intrinsic.verify(id, "scroll-left")

    solve: ->
      # Unreference removed elements
      if @removed
        for id in @removed
          @identity.unset(id)
        @removed = undefined

    # Observe stylesheets in dom
    DOMContentLoaded: ->
      @scope.removeEventListener 'DOMContentLoaded', @
      @engine.compile() unless @running

    # Observe and parse stylesheets
    compile: ->
      @stylesheets.compile()
      
    destroy: ->
      @scope.removeEventListener 'DOMContentLoaded', @
      @scope.removeEventListener 'scroll', @
      window.removeEventListener 'resize', @
      @engine.events.destroy.apply(@, arguments)

  @condition: ->
    @scope?  
  url: null
module.exports = Document