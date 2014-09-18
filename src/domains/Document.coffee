
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

    
    if @scope.nodeType == 9 && ['complete', 'loaded'].indexOf(@scope.readyState) == -1
      @scope.addEventListener 'DOMContentLoaded', @
      window.addEventListener 'load', @
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
        @intrinsic.get(id, "width")
        @intrinsic.get(id, "height")
      
    scroll: (e = '::window') ->
      id = e.target && @identity.provide(e.target) || e
      @engine.solve id + ' scrolled', ->
        @intrinsic.get(id, "scroll-top")
        @intrinsic.get(id, "scroll-left")

    solve: ->
      if @scope.nodeType == 9
        html = @scope.body.parentNode
        klass = html.className
        if klass.indexOf('gss-ready') == -1
          html.className = (klass && klass + ' ' || '') + 'gss-ready' 
      # Unreference removed elements
      if @removed
        for id in @removed
          @identity.unset(id)
        @removed = undefined

    # Observe stylesheets in dom
    DOMContentLoaded: ->
      @scope.removeEventListener 'DOMContentLoaded', @
      window.removeEventListener 'load', @
      @engine.compile() if @running == undefined
    
    onLoad: ->
      @DOMContentLoaded()

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