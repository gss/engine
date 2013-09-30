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
    #
    @commandsForWorker = []
    #@elementsById = {}
    #@elementsBySelector = {}
    #@varsById = {}

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
    
  _current_gid:1

  _registerGssId: (el) ->
    gid = @_current_gid++
    el.setAttribute('data-gss-id', gid)
    return gid
  
  execute: (commands) =>
    for command in commands
      @_execute command

  _execute: (command) => # Not DRY, see Thread.coffee... design pattern WIP
    node = command
    func = @["command-" + node[0]]
    if !func?
      throw new Error("Thread unparse broke, couldn't find method: #{node[0]}")
    for sub, i in node[1..node.length]
      if sub instanceof Array # then recurse
        node.splice i+1,1,@_execute sub
    #console.log node[0...node.length]
    return func.apply @, node[1...node.length]
      
  # generates vars for each element
  "command-var": (id, prop, elements) ->
    newcommands = []
    if elements instanceof Array
      for el in elements
        @commandsForWorker.push "var", el.id + prop
      elements.onadd (newElements) ->
        for el in elements
          @commandsForWorker.push "var", el.id + prop
    else # pass through
      @commandsForWorker.push ["var", arguments...]
    return newcommands
  
  _addVarCommandsForElements: (elements) ->
    @commandsForWorker.push "var", el.id + prop
  
  "command-$class": (className) ->
    @_registerLiveNodeList "." + className, () =>
      return @container.getElementsByClassName(className)
  
  _registerLiveNodeList: (selector, createNodeList) ->
    if @queryCache[selector]?
      return @queryCache[selector]
    else
      query = {}
      nodeList = createNodeList()
      query.nodeList = nodeList
      # ids
      query.ids = []
      for el in nodeList
        id = @_registerGssId(el)
        if query.ids.indexOf(id) isnt -1 then query.ids.push[id]
      #
      query.observer = new PathObserver nodeList, 'length', (newval, oldval) ->
        alert 'handle nodelist change'
      @queryCache[selector] = query
      return nodeList

module.exports = Engine
