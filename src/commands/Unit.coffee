Variable = require('./Variable')

class Unit extends Variable
  
  signature: [
    value: ['Variable', 'Number']
  ]

  # Dynamic lengths

  @define
    '%': (value, engine, operation, continuation, scope) ->
      return ['*', ['px', value] , ['get', 'font-size']]

    em: (value, engine, operation, continuation, scope) ->
      return ['*', ['px', value] , ['get', 'font-size']]
    
    rem: (value, engine, operation, continuation, scope) ->
      return ['*', ['px', value] , ['get', @engine.getPath(engine.scope._gss_id, 'font-size')]]

    vw: (value, engine, operation, continuation, scope) ->
      return ['*', ['/', ['px', value], 100] , ['get', '::window[width]']]

    vh: (value, engine, operation, continuation, scope) ->
      return ['*', ['/', ['px', value], 100] , ['get', '::window[height]']]

    vmin: (value, engine, operation, continuation, scope) ->
      return ['*', ['/', ['px', value], 100] , ['min', ['get', '::window[height]'], ['get', '::window[width]']]]
      
    vmax: (value, engine, operation, continuation, scope) ->
      return ['*', ['/', ['px', value], 100] , ['max', ['get', '::window[height]'], ['get', '::window[width]']]]

    vmax: (value, engine, operation, continuation, scope) ->
      return ['*', ['/', ['px', value], 100] , ['max', ['get', '::window[height]'], ['get', '::window[width]']]]

module.exports = Unit