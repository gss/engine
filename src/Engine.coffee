require("customevent-polyfill")
require("./GSS-id.js")
Query = require("./Query.js")
Get = require("./dom/Getter.js")
Set = require("./dom/Setter.js")
Command = require("./Command.js")



arrayAddsRemoves = (old, neu, removesFromContainer) ->
  adds = []
  removes = []
  for n in neu
    if old.indexOf(n) is -1
      adds.push n
  for o in old
    if neu.indexOf(o) is -1
      # don't include in removes if already in removesFromContainer
      if removesFromContainer.indexOf(o) isnt -1
        removes.push o
  return {adds:adds,removes:removes}



class Engine
  
  constructor: (@workerPath, @container) ->
    @container = document unless @container
    @commander = new Command(@)
    @worker = null
    @getter = new Get(@container)
    @setter = new Set(@container)
    #
    @commandsForWorker = []
    @lastCommandsForWorker = null
    @queryCache = {}
    
    # MutationObserver
    # 
    # - removed in stop
    #
    @observer = new MutationObserver (mutations) =>
      
      trigger = false
      
      # els removed from container
      removesFromContainer = []
      for m in mutations
        if m.removedNodes.lenght > 0 # nodelist are weird?
          for node in m.removedNodes
            gid = GSS.getId node
            if gid? 
              if GSS.getById gid
                removesFromContainer.push gid
                trigger = true
      GSS._ids_killed removesFromContainer

      # els added or removed from queries
      selectorsWithAdds = []
      addsBySelector = {}
      removesBySelector = {}
      # selectorsWithShuffles = []
      # shufflesByQuery = {} ?
      for selector, query of @queryCache
        query.update()
        if query.changedLastUpdate
          if query.lastAddedIds.length > 0
            trigger = true
            selectorsWithAdds.push selector
            addsBySelector[selector] = query.lastAddedIds
          if query.lastRemovedIds.length > 0
            trigger = true
            removesBySelector[selector] = query.lastRemovedIds
      ###
      if trigger
        e = new CustomEvent "solverinvalidated",
          detail:
            addsBySelector: addsBySelector
            removesBySelector: removesBySelector
            removesFromContainer: removesFromContainer
            selectorsWithAdds: selectorsWithAdds
            engine: @
          bubbles: true
          cancelable: true
        @container.dispatchEvent e
      ###
      if trigger
        @commander.handleAddsToSelectors selectorsWithAdds
        @solve()
      #console.log "query.observer selector:#{selector}, mutations:", mutations
      #console.log "removesFromContainer:", removesFromContainer, ", addsBySelector:", addsBySelector, ", removesBySelector:", removesBySelector, ", selectorsWithAdds:", selectorsWithAdds
        
    @observer.observe(@container, {subtree: true, childList: true, attributes: true, characterData: true})

  # boot
  run: (ast) -> 
    @execute ast.commands    
    @solve()

  measure: (el, prop) =>
    return @getter.measure(el, prop)

  measureByGssId: (id, prop) ->
    el = GSS.getById id
    @measure el, prop
    
  resetCommandsForWorker: () =>
    @lastCommandsForWorker = @commandsForWorker
    @commandsForWorker = []

  handleWorkerMessage: (message) =>    
    values = message.data.values
    for key of values
      if key[0] is "$"
        gid = key.substring(1, key.indexOf("["))
        dimension = key.substring(key.indexOf("[")+1, key.indexOf("]"))
        element = GSS.getById gid
        if element
          @setter.set element, dimension, values[key]
        else
          console.log "Element wasn't found"

    @dispatch_solved values    

  dispatch_solved: (values) =>
    e = new CustomEvent "solved",
      detail:
        values: values
        engine: @
      bubbles: true
      cancelable: true
    @container.dispatchEvent e

  handleError: (error) ->
    return @onError error if @onError
    throw new Error "#{event.message} (#{event.filename}:#{event.lineno})"

  solve: () ->
    ast = {commands:@commandsForWorker}
    unless @worker
      @worker = new Worker @workerPath
      @worker.addEventListener "message", @handleWorkerMessage, false
      @worker.addEventListener "error", @handleError, false    
    @worker.postMessage
      ast: ast
    @resetCommandsForWorker()
    
      
  stopped: false
  stop: ->
    if @stopped then return @
    @observer.disconnect()
    if @worker
      @worker.terminate()
    for selector, query of @queryCache      
      delete query.nodeList
      delete query.ids
      delete @query
    @stopped = true
  
  # digestCommands
  execute: (commands) =>
    for command in commands
      @_execute command, command

  _execute: (command, root) => # Not DRY, see Thread.coffee, design pattern WIP
    node = command
    func = @commander[node[0]]
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
    
  registerCommands: (commands) ->
    for command in commands
      @registerCommand command
            
  registerCommand: (command) ->
    # TODO: treat commands as strings and check cache for dups?
    @commandsForWorker.push command

  registerDomQuery: (o) ->
    selector = o.selector
    if @queryCache[selector]?
      return @queryCache[selector]
    else
      query = new Query(o)
      @queryCache[selector] = query
      return query

  onElementsAdded: (nodelist, callback) ->
    # need to listen to nodelist...
    newEls = ['TBD...']
    callback.apply @, newEls

  getVarsFromVarId: (id) ->
    # ...


module.exports = Engine
