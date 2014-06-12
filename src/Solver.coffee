# Solves the constraints, in a worker if desired
# Document -> Thread -> Document
Engine = require('./Engine.js')
class Solver extends Engine
  Constraints: require('./output/constraints.js')

  constructor: (url) -> 
    super()
    if typeof url == 'url' && "onmessage" in self
      @process = new @Worker(url)
    else
      @process = new @Constraints

  onmessage: (e) ->
    @write e.data

  onerror: (e) ->
    throw new Error "#{e.message} (#{e.filename}:#{e.lineno})"

  Worker: (url) ->
    worker = new Worker url
    worker.addEventListener @
    return worker.postMessage.bind(this)


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
