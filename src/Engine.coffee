Get = require("./dom/Getter.js")
Set = require("./dom/Setter.js")

class Engine
  constructor: (container) ->
    @container = (if container then container else document)
    @elements = {}
    @variables = {}
    @worker = null
    @getter = new Get(@container)
    @setter = new Set(@container)

  run: (ast) ->
    # Get elements for variables
    ast.vars.forEach @measure
    
    #for identifier of @variables
    # Add constraints to AST
    
    @solve ast.constraints

  measure: (variable) =>
    identifier = variable[1]
    dimension = variable[2]
    selector = variable[3]
    
    # Skip variables that are not on DOM
    return  unless selector
    
    # Read element from DOM
    @elements[identifier] = @getter.get(selector)  unless @elements[identifier]
    
    # Measure the element
    @variables[identifier] = @getter.measure(@elements[identifier], dimension)

  process: (values) =>
    for identifier of values
      dimension = ""
      element = @elements(identifier)
      @setter.set element, dimension, values[identifier]

  solve: (constraints) ->
    unless @worker
      @worker = new Worker("some-file")
      @worker.addEventListener "message", @process
    @worker.postMessage constraints

module.exports = Engine
