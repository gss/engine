# Solves the constraints, in a worker if desired
# Document -> (opt: Thread) -> Expressions -> Solutions -> Document

Engine = require('./Engine.js')

class Engine.Solver extends Engine
  Solutions: 
    require('./output/Solutions.js')
  Context: Engine.include(
    require('./context/Properties.js')
    require('./context/Constraints.js')
  )
  
  constructor: (@input, @output, url) -> 
    super()

    # Leave the hard stuff for worker when possible
    unless @useWorker(url)
      # Use solver to produce solutions
      @solutions = new @Solutions(@, @output)
      # Pass constraints to a solver engine
      @expressions.output = @solutions

  # Hook: Remove everything related to an id
  remove: (id) ->
    @solutions.remove(id)

  # Receieve message from worker
  onmessage: (e) ->
    @write e.data

  # Handle error from worker
  onerror: (e) ->
    throw new Error "#{e.message} (#{e.filename}:#{e.lineno})"

  # Initialize new worker and subscribe engine to its events
  useWorker: (url) ->
    return unless typeof url == 'string' && "onmessage" in self
    @worker = new @getWorker(url)
    @worker.addEventListener @
    @read   = @worker.postMessage.bind(@worker)
    return @worker

  getWorker: (url) ->
    return new Worker url


# Solver inside a worker, initialized lazily on first message
# Solver -> Solver

class Engine.Thread extends Engine.Solver
    
  write: (data) -> 
    self.postMessage(data)

  @handleEvent: (e) ->
    @instance ||= new Engine.Thread
    @instance.read(e.data)

if self.window && self.window.document == undefined && "onmessage" in self
  self.addEventListener 'message', Thread

module.exports = Engine.Solver