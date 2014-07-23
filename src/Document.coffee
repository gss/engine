# A single HTML document that observes mutations
# Mutations -> Solver -> Styles

Engine = require('./Engine')

class Engine.Document extends Engine
  Queries:       
    require('./input/Queries.js')

  Restyles:          
    require('./output/Restyles.js')

  Solver:
    require('./Solver.js')

  Style:
    require('./concepts/Style.js')

  Types:
    require('./commands/Types.js')

  Units:
    require('./commands/Units.js')

  Commands: Engine.include(
    Engine::Commands
    Document::Units
    Document::Types
    require('./commands/Measurements.js')
    require('./commands/Selectors.js')
    require('./commands/Rules.js')
    require('./commands/Native.js')
    require('./commands/Algebra.js')
    require('./commands/Transformations.js')
  )

  Properties: Engine.include(
    require('./properties/Dimensions.js'),
    require('./properties/Equasions.js')
    require('./properties/Styles.js')
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

    # Expressions generate commands and pass them to solver
    @expressions.output = @solver
    
    if @scope.nodeType == 9 && ['complete', 'interactive', 'loaded'].indexOf(@scope.readyState) == -1
      @scope.addEventListener 'DOMContentLoaded', @
    else
      @start()

      @types       = new @Types(@)       if @Types
    @scope.addEventListener 'scroll', @
    window.addEventListener 'resize', @

  # Delegate: Pass input to interpreter
  run: ->
    captured = @queries.capture()
    result = @expressions.pull.apply(@expressions, arguments)
    @queries.release() if captured
    result
    
  onresize: (e = '::window') ->
    id = e.target && @identify(e.target) || e
    captured = @expressions.capture(id + ' resized') 
    @measure(id, "width", undefined, false)
    @measure(id, "height", undefined, false)
    @expressions.release() if captured
    
  onscroll: (e = '::window') ->
    id = e.target && @identify(e.target) || e
    captured = @expressions.capture(id + ' scrolled') 
    @measure(id, "scroll-top", undefined, false)
    @measure(id, "scroll-left", undefined, false)
    @expressions.release() if captured

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
    return if @running
    super
    capture = @queries.capture('initial')
    @run [
      ['eval',  ['$attribute', ['$tag', 'style'], '*=', 'type', 'text/gss']]
      ['load',  ['$attribute', ['$tag', 'link'],  '*=', 'type', 'text/gss']]
    ]
    @queries.release() if capture
    return true
    
  
# Export all DOM commands as helper functions 
for target in [Engine, Engine.Document::, Engine.Document]
  for source in [Engine.Document::Commands::]
    for property, command of source
      target[property] ||= Engine::Command(command, true, property)

  target.engine = Engine

module.exports = Engine.Document    
