# A single HTML document that observes mutations
# Mutations -> Solver -> Styles

Engine = require('./Engine')

class Engine.Document extends Engine
  Queries:       
    require('./input/Queries.js')

  Styles:          
    require('./output/Styles.js')

  Solver:
    require('./Solver.js')

  Commands: Engine.include(
    require('./commands/Measurements.js'),
    require('./commands/Selectors.js'),
    require('./commands/Rules.js'),
    require('./commands/Native.js'),
    require('./commands/Algebra.js')
  )

  Properties: Engine.include(
    require('./properties/Dimensions.js'),
    require('./properties/Equasions.js')
  )

  constructor: (scope = document, url) ->
    return context if context = super(scope, url)

    # Element style properties are assigned by Styles object
    @styles    = new @Styles(@)

    # Solver returns data to set element styles
    @solver    = new @Solver(@, @styles, url)

    # DOM Queries trigger expression re-evaluation
    @queries   = new @Queries(@, @expressions)

    # Expressions generate commands and pass them to solver
    @expressions.output = @solver
    
    if @scope.nodeType == 9
      @scope.addEventListener 'DOMContentLoaded', @

    @scope.addEventListener 'scroll', @
    window.addEventListener 'resize', @

  # Delegate: Pass input to interpreter, buffer DOM queries within command batch
  run: ->
    @queries.updated = null # Turn on batching
    result = @expressions.pull.apply(@expressions, arguments)
    @queries.updated = undefined # Forget batched stuff 
    return result
    
  onresize: (e = '::window') ->
    @_compute(e.target || e, "width", undefined, false)
    @_compute(e.target || e, "height", undefined, false)

  onscroll: (e = '::window') ->
    @_compute(e.target || e, "scroll-top", undefined, false)
    @_compute(e.target || e, "scroll-left", undefined, false)

  destroy: ->
    @scope.removeEventListener 'DOMContentLoaded', @
    @scope.removeEventListener 'scroll', @
    window.removeEventListener 'resize', @

  # Observe stylesheets in dom
  onDOMContentLoaded: ->
    @scope.removeEventListener 'DOMContentLoaded', @

  # Observe and parse stylesheets
  start: ->
    return if @running
    super
    console.groupCollapsed('Watch for stylesheets')
    @do [
      ['eval',  ['$attribute', ['$tag', 'style'], '*=', 'type', 'text/gss']]
      ['load',  ['$attribute', ['$tag', 'link'],  '*=', 'type', 'text/gss']]
    ]
    console.groupEnd('Watch for stylesheets')
    return true
    
# Export all DOM commands as helper functions 
for target in [Engine, Engine.Document::, Engine.Document]
  for source in [Engine.Document::Commands::]
    for property, command of source
      target[property] ||= Engine.Helper(command, true)

  target.engine = Engine

module.exports = Engine.Document    
