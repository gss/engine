# A single HTML document that observes mutations
# Mutations -> Solver -> Styles

Engine = require('./Engine')
Space  = require('./concepts/Space')

class Document extends Class.include(Engine, Space)
  Queries:       
    require('./input/Queries')

  Restyles:          
    require('./output/Restyles')

  Solver:
    require('./Solver')

  Style:
    require('./concepts/Style')

  Types:
    require('./commands/Types')

  Units:
    require('./commands/Units')

  Commands: Engine.include(
    Engine::Commands
    Document::Units
    Document::Types
    require('./commands/Measurements')
    require('./commands/Selectors')
    require('./commands/Rules')
    require('./commands/Native')
    require('./commands/Algebra')
    require('./commands/Transformations')
  )

  Properties: Engine.include(
    require('./properties/Dimensions'),
    require('./properties/Equasions')
    require('./properties/Styles')
  )

  constructor: (scope = document, url) ->
    return context if context = super(scope, url)

    # Element style properties are assigned by Styles object
    @restyles  = new @Restyles(@)

    # Solver returns data to set element styles
    @solver    = new @Solver(@, @restyles, url)

    # DOM Queries trigger expression re-evaluation
    @queries   = new @Queries(@, @expressions)

    @types     = new @Types(@)
    @units     = new @Units(@)

    # Let queries module capture output
    @expressions.capturer  = @queries

    # Expressions generate commands and pass them to solver
    @expressions.output = @solver
    
    if @scope.nodeType == 9 && ['complete', 'interactive', 'loaded'].indexOf(@scope.readyState) == -1
      @scope.addEventListener 'DOMContentLoaded', @
    else
      @start()

    @scope.addEventListener 'scroll', @
    window.addEventListener 'resize', @

  capture: ->
    return @expressions.capture.apply(@expressions, arguments)
  
  release: ->
    return @expressions.release.apply(@expressions, arguments)
    
  onresize: (e = '::window') ->
    id = e.target && @identify(e.target) || e
    captured = @expressions.capture(id + ' resized') 
    @measure(id, "width", undefined, false)
    @measure(id, "height", undefined, false)
    @release() if captured
    
  onscroll: (e = '::window') ->
    id = e.target && @identify(e.target) || e
    captured = @expressions.capture(id + ' scrolled') 
    @measure(id, "scroll-top", undefined, false)
    @measure(id, "scroll-left", undefined, false)
    @release() if captured

  destroy: ->
    @scope.removeEventListener 'DOMContentLoaded', @
    @scope.removeEventListener 'scroll', @
    window.removeEventListener 'resize', @

  # Observe stylesheets in dom
  onDOMContentLoaded: ->
    @scope.removeEventListener 'DOMContentLoaded', @
    @start()

  # Observe and parse stylesheets
  start: ->
    if super
      return @capture 'stylesheets', [
        ['eval',  ['$attribute', ['$tag', 'style'], '*=', 'type', 'text/gss']]
        ['load',  ['$attribute', ['$tag', 'link' ], '*=', 'type', 'text/gss']]
      ]
    
  
# Export all DOM commands as helper functions 
for target in [Engine, Document::, Document]
  for source in [Document::Commands::]
    for property, command of source
      target[property] ||= Engine::Command(command, true, property)

  target.engine = Engine

module.exports = Engine.Document = Document 
