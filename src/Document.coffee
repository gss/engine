# A single HTML document that observes mutations
# Mutations -> Solver -> Styles

Engine = require('./Engine')

class Engine.Document extends Engine
  Mutations:       
    require('./input/Mutations.js')
  Measurements:    
    require('./input/Measurements.js')
  Styles:          
    require('./output/Styles.js')
  Solver:
    require('./Solver.js')

  Context: Engine.include(
    require('./context/Properties.js'),
    require('./context/Selectors.js'),
    require('./context/Rules.js'),
    require('./context/Math.js')
  )

  constructor: (scope = document, url) ->
    return context if context = super(scope, url)

    @mutations           = new @Mutations(@)
    @measurements        = new @Measurements(@)
    @solver              = new @Solver(@, url)
    @styles              = new @Styles(@)

    # Mutations and measurements trigger expression evaluation
    @mutations   .output = @expressions 
    @measurements.output = @expressions 

    # Expressions generate commands and pass them to solver
    @expressions .output = @solver

    # Solver returns data to set element styles
    @solver      .output = @styles
    
    if @scope.nodeType == 9
      @scope.addEventListener 'DOMContentLoaded', @

  onDOMContentLoaded: ->
    @scope.removeEventListener 'DOMContentLoaded', @

    # Observe and parse stylesheets
    # @read ['$parse', ['$attribute', ['$tag', 'style'], 'type', 'text/gss', '*']]
    # @read ['$parse', ['$attribute', ['$tag', 'style'], 'type', 'tree/gss', '*']]
    

module.exports = Engine.Document    
