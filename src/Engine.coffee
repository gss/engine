require("customevent-polyfill")
Get = require("./dom/Getter.js")
Set = require("./dom/Setter.js")
Command = require("./Command.js")

class Engine
  constructor: (@workerPath, @container) ->
    @container = document unless @container
    @commands = new Command(@)
    @elements = {}
    @variables = {}
    @dimensions = {}
    @worker = null
    @getter = new Get(@container)
    @setter = new Set(@container)
    #
    @commandsForWorker = []
    @queryCache = {}
    @elsByGssId = {}

  run: (ast) ->
    @execute ast.commands
    astForWorker = {commands:@commandsForWorker}
    @solve astForWorker

  measure: (el, prop) =>
    return @getter.measure(el, prop)

  measureByGssId: (id, prop) ->
    el = @elsByGssId[id]
    @measure el, prop

  process: (message) =>
    values = message.data.values
    for key of values
      if key[0] is "$"
        gid = key.substring(1, key.indexOf("["))
        dimension = key.substring(key.indexOf("[")+1, key.indexOf("]"))
        element = @elsByGssId[gid]
        if element
          @setter.set element, dimension, values[key]
        else
          console.log "Element wasn't found"

    @dispatch_solved values

  dispatch_solved: (values) ->
    e = new CustomEvent "solved",
      detail:
        values: values
      bubbles: true
      cancelable: true
    @container.dispatchEvent e

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

  _current_gid: 1

  gssId: (el) ->
    gid = el.getAttribute('data-gss-id')
    if !gid?
      gid = @_current_gid++
      el.setAttribute('data-gss-id', gid)
    # cache, TODO: REMOVE FROM CACHE!!
    @elsByGssId[gid] = el
    return gid

  execute: (commands) =>
    for command in commands
      @_execute command, command

  _execute: (command, root) => # Not DRY, see Thread.coffee, design pattern WIP
    node = command
    func = @commands[node[0]]
    if !func?
      throw new Error("Engine Commands broke, couldn't find method: #{node[0]}")

    #recursive excution
    for sub, i in node[1..node.length]
      if sub instanceof Array # then recurse
        node.splice i+1,1,@_execute sub, root

    #console.log node[0...node.length]
    return func.call @, root, node[1...node.length]...

  _addVarCommandsForElements: (elements) ->
    @commandsForWorker.push "var", el.id + prop


  registerCommand: (command) ->
    # TODO: treat commands as strings and check cache for dups?
    @commandsForWorker.push command

  registerDomQuery: (selector, isMulti, isLive, createNodeList) ->
    if @queryCache[selector]?
      return @queryCache[selector]
    else
      query = {}
      query.selector = selector
      query.isQuery = true
      query.isMulti = isMulti
      query.isLive  = isLive
      # query.isPriority for querySelectorAll?
      nodeList = createNodeList()
      query.nodeList = nodeList
      # ids
      query.ids = []
      for el in nodeList
        id = @gssId(el)
        if query.ids.indexOf(id) is -1 then query.ids.push(id)
      #
      query.observer = new PathObserver nodeList, 'length', (newval, oldval) ->
        alert 'handle nodelist change'
      @queryCache[selector] = query
      return query

  onElementsAdded: (nodelist, callback) ->
    # need to listen to nodelist...
    newEls = ['TBD...']
    callback.apply @, newEls

  getVarsFromVarId: (id) ->
    # ...


module.exports = Engine
