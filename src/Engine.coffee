Get = require("./dom/Get.js")
Engine = (container) ->
  @container = (if container then container else document)
  @elements = {}
  @variables = {}
  @worker = null
  @getter = new Get(@container)
  @getter

Engine::run = (ast) ->
  
  # Get elements for variables
  ast.vars.forEach @measure.bind(this)
  
  #for identifier of @variables
  # Add constraints to AST
  
  @solve ast.constraints

Engine::measure = (variable) ->
  identifier = variable[1]
  dimension = variable[2]
  selector = variable[3]
  
  # Skip variables that are not on DOM
  return  unless selector
  
  # Read element from DOM
  @elements[identifier] = @getter.get(selector)  unless @elements[identifier]
  
  # Measure the element
  @variables[identifier] = @getter.measure(@elements[identifier], dimension)
  @variables[identifier]

Engine::process = (values) ->
  
  # Something
  for identifier of values
    dimension = ""
    element = @elements(identifier)
    @setter.set element, dimension, values[identifier]

Engine::solve = (constraints) ->
  unless @worker
    @worker = new Worker("some-file")
    @worker.addEventListener "message", @process.bind(this)
  @worker.postMessage constraints

module.exports = Engine