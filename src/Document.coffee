# A single HTML document that observes mutations
# Mutations -> Solver -> Styles

class Document extends Engine
  Mutations:    require('../input/Mutations.js')
  Measurements: require('../input/Measurements.js')
  Styles:       require('../output/Styles.js')

  constructor: (scope, url) ->
    return context if context = super(scope, url)

    @context      = new @Context(@)

    @mutations    = new @Mutations(@)
    @measurements = new @Measurements(@)
    @solver       = new @Solver(@, url)
    @styles       = new @Styles(@)

    # Mutations and measurements invalidate expressions
    @mutations.pipe @expressions 
    @measurements.pipe @expressions 
    
    # Expressions generate commands and pass them to solver
    @expressions.pipe @solver
    # Solver returns data to set element styles
    @solver.pipe @styles

    # Short-circuit the cleaning hook
    @references.write = @context.clean.bind(@context)
    @references.write = @context.clean.bind(@context)
    
    if @scope.nodeType == 9
      @scope.addEventListener 'DOMContentLoaded', @

  onDOMContentLoaded: ->
    @scope.removeEventListener 'DOMContentLoaded', @
        

# Register DOM context, includes selectors and DOM properties

Document::Context = class Context
  Properties:   require('./context/Properties.js')
  Selectors:    require('./context/Selectors.js')
  Rules:        require('./context/Rules.js')
  constructor: (@engine) ->

DOM::[prop] = value for prop, value of DOM::Measurements::
DOM::[prop] = value for prop, value of DOM::Selectors::

Engine.Document = Document

module.exports = Document