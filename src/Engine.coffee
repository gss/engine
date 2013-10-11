require("customevent-polyfill")
require("./GSS-id.js")
Query = require("./Query.js")
Get = require("./dom/Getter.js")
Set = require("./dom/Setter.js")
Command = require("./Command.js")

# Polyfill
unless window.MutationObserver
  window.MutationObserver = window.JsMutationObserver

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
      trigger_removes = false
      trigger_removesFromContainer = false
      trigger_addsToSelectors = false
      
      removes = []
      
      # els removed from container
      removesFromContainer = []
      for m in mutations
        if m.removedNodes.length > 0 # nodelist are weird?
          for node in m.removedNodes
            gid = GSS.getId node
            if gid?
              if GSS.getById gid
                removes.push("$" + gid)
                trigger = true
                trigger_removesFromContainer = true
                trigger_removes = true
                
                
      GSS._ids_killed removes

      # els added or removed from queries
      selectorsWithAdds = []
      addsBySelector = {}
      # removesBySelector = {}
      # selectorsWithShuffles = []
      # shufflesByQuery = {} ?
      for selector, query of @queryCache
        query.update()
        # TODO: callback?
        if query.changedLastUpdate
          if query.lastAddedIds.length > 0
            selectorsWithAdds.push selector
            addsBySelector[selector] = query.lastAddedIds
            trigger = true
            trigger_addsToSelectors = true
          if query.lastRemovedIds.length > 0
            trigger = true
            trigger_removes = true
            removedIds = query.lastRemovedIds
            # ignore redudant removes
            for rid in removedIds
              rid = "$" + rid
              if trigger_removesFromContainer
                if removes.indexOf(rid) is -1
                  removes.push(selector + rid) # .box$3454
              else
                removes.push(selector + rid)
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

      if trigger_removes
        @commander.handleRemoves removes
      if trigger_addsToSelectors
        @commander.handleAddsToSelectors selectorsWithAdds
      if trigger
        @solve()
      #console.log "query.observer selector:#{selector}, mutations:", mutations
      #console.log "removesFromContainer:", removesFromContainer, ", addsBySelector:", addsBySelector, ", removesBySelector:", removesBySelector, ", selectorsWithAdds:", selectorsWithAdds
        
  _is_observing: false
  
  observe:() ->
    if !@_is_observing
      @observer.observe(@container, {subtree: true, childList: true, attributes: true, characterData: false})
      @_is_observing = true
      
  unobserve: () ->
    @_is_observing = false
    @observer.disconnect()

  # boot
  run: (ast) ->
    @execute ast.commands
    @solve()
    @observe()
  
  teardown: ->
    # stop observer
    # stop commands

  measure: (el, prop) =>
    return @getter.measure(el, prop)

  measureByGssId: (id, prop) ->
    el = GSS.getById id
    @measure el, prop
    
  resetCommandsForWorker: () =>
    @lastCommandsForWorker = @commandsForWorker
    @commandsForWorker = []

  handleWorkerMessage: (message) =>
    @unobserve()
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
    @observe()
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
    @unobserve()
    if @worker
      @worker.terminate()
    for selector, query of @queryCache
      delete query.nodeList
      delete query.ids
      delete @query
    @stopped = true
  
  # digestCommands
  execute: (commands) =>
    @commander.execute commands

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

module.exports = Engine
