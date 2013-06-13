Get = require("./dom/Getter.js")
Set = require("./dom/Setter.js")

class Engine
  constructor: (@workerPath, @container) ->
    @container = document unless @container
    @elements = {}
    @variables = {}
    @dimensions = {}
    @worker = null
    @getter = new Get(@container)
    @setter = new Set(@container)
    @onSolved = null

  run: (ast) ->
    # Get elements for variables
    ast.vars.forEach @measure
    
    # Clean up variables for solving
    for variable, index in ast.vars
      ast.vars[index] = ['var', variable[1]]

    # Add constraints to AST
    for identifier, value of @variables
      ast.constraints.unshift [
        'gte',
        ['get', identifier],
        ['number', value]
      ]
    
    @solve ast

  measure: (variable) =>
    identifier = variable[1]
    dimension = variable[2]
    selector = variable[3]
    
    # Skip variables that are not on DOM
    return unless selector

    @dimensions[identifier] = dimension
    
    # Read element from DOM
    @elements[identifier] = @getter.get(selector) unless @elements[identifier]
    return unless @elements[identifier]
    
    # Measure the element
    @variables[identifier] = @getter.measure(@elements[identifier], dimension)

  process: (message) =>
    values = message.data.values
    for identifier of values
      dimension = @dimensions[identifier]
      element = @elements[identifier]
      @setter.set element, dimension, values[identifier]

    # Run callback
    @onSolved values if @onSolved

  handleError: (error) ->
    return @onError error if @onError
    throw new Error "#{event.message} (#{event.filename}:#{event.lineno})"

  solve: (ast) ->
    unless @worker
      @worker = new Worker @workerPath
      @worker.addEventListener "message", @process, false
      @worker.addEventListener "error", @handleError, false
    @worker.postMessage
      ast: ast

  stop: ->
    return unless @worker
    @worker.terminate()

module.exports = Engine
