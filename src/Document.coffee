# A single HTML document that observes mutations
# Mutations -> Solver -> Styles

class Document extends Engine
  Mutations:   require('../input/Mutations.js')
  Mutations:   require('../input/Measurements.js')
  Styles:      require('../output/Styles.js')

  constructor: (scope) ->
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
    @process.pipe @styles

    if @scope.nodeType == 9
      @scope.addEventListener 'DOMContentLoaded', @

  onDOMContentLoaded: ->
    @scope.removeEventListener 'DOMContentLoaded', @
        

# Register DOM context, includes selectors and DOM properties

Document::Context = class Context
  Rules:        require('./input/Measurements.js')
  Rules:        require('./input/Rules.js')
  Selectors:    require('./input/Selectors.js')
  constructor: (@engine) ->

DOM::[prop] = value for prop, value of DOM::Measurements::
DOM::[prop] = value for prop, value of DOM::Selectors::

module.exports = Document