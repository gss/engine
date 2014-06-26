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

  Context: Engine.include(
    require('./context/Measurements.js'),
    require('./context/Properties.js'),
    require('./context/Selectors.js'),
    require('./context/Rules.js'),
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

    @onresize()
    @onscroll()

  # Delegate: Pass input to interpreter, buffer DOM queries within command batch
  run: ->
    @queries.updated = null # Turn on batching
    result = @expressions.pull.apply(@expressions, arguments)
    @queries.updated = undefined # Forget batched stuff 
    return result
    
  onresize: (e = '::window') ->
    @context.compute(e.target || e, "[width]")
    @context.compute(e.target || e, "[height]")

  onscroll: (e = '::window') ->
    @context.compute(e.target || e, "[scroll-top]")
    @context.compute(e.target || e, "[scroll-left]")

  destroy: ->
    @scope.removeEventListener 'DOMContentLoaded', @
    @scope.removeEventListener 'scroll', @
    window.removeEventListener 'resize', @

  onDOMContentLoaded: ->
    @scope.removeEventListener 'DOMContentLoaded', @

    # Observe and parse stylesheets
    # @pull ['$parse', ['$attribute', ['$tag', 'style'], 'type', 'text/gss', '*']]
    # @pull ['$parse', ['$attribute', ['$tag', 'style'], 'type', 'tree/gss', '*']]
    

module.exports = Engine.Document    
