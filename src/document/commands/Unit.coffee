Variable = require('../../engine/commands/Variable')

class Unit extends Variable
  
  signature: [
    value: ['Variable', 'Number']
  ]

  # Dynamic lengths

  getProperty: (operation) ->
    parent = operation
    while parent = parent.parent
      if parent.command.type == 'Assignment'
        return parent[1]

  Dependencies:
    'margin-top':            'containing-width'
    'margin-top':            'containing-width'
    'margin-right':          'containing-width'
    'margin-left':           'containing-width'
    'padding-top':           'containing-width'
    'padding-top':           'containing-width'
    'padding-right':         'containing-width'
    'padding-left':          'containing-width'
    'left':                  'containing-width'
    'right':                 'containing-width'
    'width':                 'containing-width'
    'min-width':             'containing-width'
    'max-width':             'containing-width'
    'text-width':            'containing-width'
    'top':                   'containing-height'
    'bottom':                'containing-height'
    'height':                'containing-height'
    'font-size':             'containing-font-size'
    'vertical-align':        'line-height'
    'background-position-x': 'width'
    'background-position-y': 'height'
  
  @define
    '%': (value, engine, operation, continuation, scope) ->
      property = @Dependencies[@getProperty(operation)] || 'containing-width'
      path = engine.getPath(scope, property)
      return ['*', ['px', value] , ['get', path]]

    em: (value, engine, operation, continuation, scope) ->
      path = engine.getPath(scope, 'computed-font-size')
      return ['*', ['px', value] , ['get', path]]
    
    rem: (value, engine, operation, continuation, scope) ->
      path = @engine.getPath(engine.scope._gss_id, 'computed-font-size')
      return ['*', ['px', value] , ['get', path]]

    vw: (value, engine, operation, continuation, scope) ->
      return ['*', ['/', ['px', value], 100] , ['get', '::window[width]']]

    vh: (value, engine, operation, continuation, scope) ->
      return ['*', ['/', ['px', value], 100] , ['get', '::window[height]']]

    vmin: (value, engine, operation, continuation, scope) ->
      return ['*', ['/', ['px', value], 100] , ['min', ['get', '::window[height]'], ['get', '::window[width]']]]
      
    vmax: (value, engine, operation, continuation, scope) ->
      return ['*', ['/', ['px', value], 100] , ['max', ['get', '::window[height]'], ['get', '::window[width]']]]

module.exports = Unit