# Solves the constraints, in a worker if desired
# Document -> Thread -> Document
Engine = require('./Engine.js')

class Solver extends Engine
  Constraints: require('./output/constraints.js')

  constructor: (@input, @output, url) -> 
    super()

    # Pass input to worker when using one
    if typeof url == 'url' && "onmessage" in self
      @worker = new @Worker(url)
      @read   = @worker.postMessage.bind(@worker)
    else
      @constraints = new @Constraints(@)
      @expressions.pipe @constraints
      @constraints.pipe @output

  # Receieve message from worker
  onmessage: (e) ->
    @write e.data

  # Handle error from worker
  onerror: (e) ->
    throw new Error "#{e.message} (#{e.filename}:#{e.lineno})"

  # Initialize worker and subscribe engine to it
  Worker: (url) ->
    worker = new Worker url
    worker.addEventListener @
    return worker

# Solver inside a worker, initialized lazily
# Solver -> Solver

class Thread extends Solver
    
  write: (data) -> 
    self.postMessage(data)

  @handleEvent: (e) ->
    @instance ||= new @(e.data.config)
    @instance.read(e)

if self.window && self.window.document == undefined && "onmessage" in self
  self.addEventListener 'message', Thread


Engine.Solver = Solver

module.exports = Solver