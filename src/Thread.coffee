# Solves the constraints, in a worker if desired
# Document -> (opt: Thread) -> Expressions -> Solutions -> Document

Engine = require('./Engine')

class Engine.Thread extends Engine

  Spaces:
    Linear: require('./constraints/Linear'),
    Finite: require('./constraints/Finite')

  constructor: (@input, @output, url) -> 
    return context if context = super()

    # Leave the hard stuff for worker when possible
    unless @useWorker(url)
      @linear = new @Linear(@)
      @finite = new @Finite(@)
      
  getPath: (scope, property) ->
    return scope || property unless scope && property
    return (scope || '') + '[' + (property || '') + ']'

# Solver inside a worker, initialized lazily on first message

class Engine.Worker extends Engine.Thread
  constructor: ->
    if (context = super()) && context != this
      return context
    @provide = (data) -> 
      self.postMessage(data)

  @handleEvent: (e) ->
    @instance ||= new Engine.Thread
    @instance.solve(e.data)

if !self.window && self.onmessage != undefined
  self.addEventListener 'message', (e) ->
    Engine.Worker.handleEvent(e)

module.exports = Engine.Thread