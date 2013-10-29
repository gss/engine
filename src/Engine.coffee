if !GSS? then throw new Error "GSS object needed for Engine"

cleanAndSnatch = (frm, to) ->
  # - `to` object cleans itself & steals props from & deletes the `frm` object
  # - useful for keeping single object in memory for getters & setters
  # - FYI, getters & setters for `o.key` work after `delete o.key`
  for key, val of to
    # delete if not on `frm` object
    if !frm[key]?
      delete to[key]
    # snatch shared keys
    else      
      to[key] = frm[key]
      delete frm[key]
  # snatch new keys
  for key, val of frm    
    to[key] = frm[key]
    #delete frm[key]
  frm = undefined
  return to

LOG = () ->
  if GSS.config.debug
    console.log "Engine::", arguments...

GSS.engines = engines = []
engines.byId = {}
engines.root = null

class Engine

  constructor: (o) ->
    {@scope, @workerURL, @vars, @getter, @setter, @is_root} = o
    @vars      = {}                          unless @vars
    if !@scope # then new Error "Scope required for Engine"      
      @scope = GSS.getter.getRootScope()
    if @scope.tagName is "HEAD" then @scope = document    
    @workerURL = GSS.workerURL               unless @workerURL
    # id is always gssid of scope
    @id        = GSS.setupScopeId @scope
    @commander = new GSS.Commander(@)
    @worker    = null
    #    
    @workerCommands = []
    @workerMessageHistory = []
    @lastWorkerCommands = null
    @queryCache = {}    
    @observer = new MutationObserver @_handleMutations    
    #
    @cssDump = null
    LOG "constructor() @", @    
    # 
    if @scope is GSS.Getter.getRootScope()
      @queryScope = document
    else
      @queryScope = @scope
    @getter    = new GSS.Getter(@queryScope)  unless @getter
    @setter    = new GSS.Setter(@queryScope)  unless @setter
    # 
    @childEngines = [] 
    @parentEngine = null
    if @is_root
      engines.root = @
    else
      @parentEngine = GSS.get.nearestEngine @scope, true      
      if !@parentEngine
        throw new Error "ParentEngine missing, WTF"
      @parentEngine.childEngines.push @
        
    #
    GSS.engines.push @
    engines.byId[@id] = @
    
    @
  
  is_running: false
  
  ###
  run: (ast) ->
    if ast.commands
      @is_running = true
      # digest
      @execute ast.commands      
      #debounced = () =>
      @solve()
      #setTimeout debounced, 1
      @observe()
    @
  ###
  
  run: (asts) ->
    LOG @id,".run(asts)",asts
    # if array, batch execute then solve
    if asts instanceof Array
      for ast in asts        
        @_run ast
    else 
      @_run asts
    # if commands were found & executed
    if @workerCommands.length > 0
      @is_running = true
      @solve()
    
  
  _run: (ast) ->
    if ast.css      
      @unobserve()
      @setupCSSDumpIfNeeded()
      @cssDump.insertAdjacentHTML "beforeend", ast.css
      @observe()
    if ast.commands
      @execute ast.commands    
      
  setupCSSDumpIfNeeded: () ->
    if !@cssDump
      #@scope.insertAdjacentHTML "afterbegin", ""
      @cssDump = document.createElement "style"
      @cssDump.id = "gss-css-dump-" + @id 
      @scope.appendChild @cssDump
      #@cssDump.classList.add("gss-css-dump")
  
  # digests or transforms commands
  execute: (commands) =>
    @commander.execute commands
  
  loadAndRun: () ->
    LOG @id,".loadAndRun()"
    if @is_running
      @clean()
    #@run( @getter.readAllASTs() )
    ASTs = []
    for node in @getter.getAllStyleNodes()
      AST = @getter.readAST node
      if AST then ASTs.push AST
      ###
      if node.isContentEditable and !node._isFixingSelfFromBullShit
        node._isFixingSelfFromBullShit = true
        node.addEventListener "input", @onEditableStyleInput    
      ###
    @run ASTs
    @
  
  ###
  onEditableStyleInput: (e) =>
    @unobserve()
    e.target.innerHTML = e.target.innerText
    @observe()
    @loadAndRun()
  ###
    
  
  # clean when scope insides changes, but if scope changes must destroy
  clean: () ->
    LOG @id,".clean()"
    #@unobserve()
    @commander.clean()
    @getter.clean?() 
    @setter.clean?()
    #
    @cssDump?.innerHTML = ""
    # clean vars
    @workerCommands = []
    #@workerMessageHistory = [] keep history
    @lastWorkerCommands = null    
    #
    for key, val of @vars
      delete @vars[key]
    #
    if @worker
      @worker.terminate()
      @worker = null
    #
    for selector, query of @queryCache
      query.destroy()
      @queryCache[selector] = null
    @queryCache = {}
    @
  
  stopped: false
  
  stop: ->
    console.warn "Stop deprecated for destroyed"
    @destroy()
    ###
    if @stopped then return @
    @stopped = true
    @unobserve()
    if @worker
      @worker.terminate()
      delete @worker
    for selector, query of @queryCache
      query.destroy()
      @queryCache[selector] = null
    @queryCache = {}
    ###
    @
  
  is_destroyed: false
  
  destroyChildren: () ->
    for e in @childEngines
      if !e.is_destroyed
        e.destroy()
  
  destroy: ->
    # cascade destruction
    @destroyChildren()
    #
    @is_destroyed = true
    @is_running   = null
    @commander.destroy()
    @getter.destroy?() 
    @setter.destroy?()
    # update engine hierarchy
    @parentEngine.childEngines.splice(@parentEngine.childEngines.indexOf(@),1)
    @parentEngine = null
    # remove from GSS.engines
    i = engines.indexOf @
    if i > -1 then engines.splice(i, 1)
    delete engines.byId[@id]
    # release ids
    GSS._ids_killed([@id]) # TODO(D4): release children node ids?
    #
    @unobserve()
    @observer = null
    #
    #@cssDump?.remove()
    @cssDump = null
    # release vars
    @ast    = null    
    @getter = null
    @setter = null
    @scope = null
    @commander = null
    @workerCommands = null
    @workerMessageHistory = null
    @lastWorkerCommands = null
    #
    @vars   = null
    #
    if @worker
      @worker.terminate()
      @worker = null
    #
    for selector, query of @queryCache
      query.destroy()
      @queryCache[selector] = null
    @queryCache = null    
    @
  
  is_observing: false
  
  observe:() ->
    if !@is_observing
      @observer.observe(@scope, {subtree: true, childList: true, attributes: true, characterData: true})
      @is_observing = true
    @

  unobserve: () ->
    @is_observing = false
    @observer.disconnect()
    @
  
  solve: () ->
    LOG @id,".solve()",@workerCommands
    workerMessage = {commands:@workerCommands}
    @workerMessageHistory.push workerMessage
    unless @worker
      @worker = new Worker @workerURL
      @worker.addEventListener "message", @handleWorkerMessage, false
      @worker.addEventListener "error", @handleError, false
    @worker.postMessage workerMessage
    @resetWorkerCommands()

  _handleMutations: (mutations=[]) =>
    LOG @id,"._handleMutations(m)",m
    trigger = false
    trigger_scopeRemoved = false
    trigger_removes = false
    trigger_removesFromScope = false

    removes = []    
    invalidMeasures = []    

    for m in mutations
      # style tag was modified then stop & reload everything
      if m.type is "characterData" 
        if @getter.isStyleNode(m.target.parentElement)
          return @loadAndRun()
      
      # els removed from scope
      if m.removedNodes.length > 0 # nodelist are weird?
        for node in m.removedNodes
          # if scope is removed...
          if node is @scope
            console.log "handle engine scope removed"
          #
          gid = GSS.getId node
          if gid?
            if GSS.getById gid
              removes.push("$" + gid)
              trigger = true
              trigger_removesFromScope = true
      
      # clean up ids
      GSS._ids_killed removes
      
      # els that may need remeasuring      
      if m.type is "characterData" or m.type is "attributes" or m.type is "childList"
        if m.type is "characterData"
          target = m.target.parentElement          
          gid = "$" + GSS.getId m.target.parentElement
        else
          gid = "$" + GSS.getId m.target
        if gid?
          if invalidMeasures.indexOf(gid) is -1
            #if GSS.getById gid
            trigger = true
            invalidMeasures.push(gid)
        
    

    # els added or removed from queries
    selectorsWithAdds = []
    # selectorsWithShuffles = []
    # shufflesByQuery = {} ?
    for selector, query of @queryCache
      query.update()
      # TODO: callback?
      if query.changedLastUpdate
        if query.lastAddedIds.length > 0
          selectorsWithAdds.push selector
          #addsBySelector[selector] = query.lastAddedIds
          trigger = true
        if query.lastRemovedIds.length > 0
          trigger = true
          removedIds = query.lastRemovedIds
          # ignore redudant removes
          for rid in removedIds
            rid = "$" + rid
            if trigger_removesFromScope
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
          removesFromScope: removesFromScope
          selectorsWithAdds: selectorsWithAdds
          engine: @
        bubbles: true
        cancelable: true
      @scope.dispatchEvent e
    ###

    
    if trigger
      @commander.handleRemoves removes
      @commander.handleSelectorsWithAdds selectorsWithAdds
      @commander.handleInvalidMeasures invalidMeasures
      @solve()

    #console.log "query.observer selector:#{selector}, mutations:", mutations
    #console.log "removesFromScope:", removesFromScope, ", addsBySelector:", addsBySelector, ", removesBySelector:", removesBySelector, ", selectorsWithAdds:", selectorsWithAdds    

  measureByGssId: (id, prop) ->
    LOG @id,".measureByGssId()",@workerCommands
    el = GSS.getById id
    @getter.measure(el, prop)

  resetWorkerCommands: () =>
    @lastWorkerCommands = @workerCommands
    @workerCommands = []

  handleWorkerMessage: (message) =>
    LOG @id,".handleWorkerMessage()",@workerCommands
    @unobserve()
    cleanAndSnatch message.data.values, @vars
    @setter.set @vars
    @observe()
    @dispatch "solved", {values:@vars}

  dispatch: (eName, oDetail = {}, bubbles = true, cancelable = true) =>
    oDetail.engine = @
    o = {
      detail:oDetail
      bubbles: bubbles
      cancelable: cancelable
    }
    e = new CustomEvent eName, o
    @scope.dispatchEvent e

  handleError: (error) ->
    return @onError error if @onError
    throw new Error "#{event.message} (#{event.filename}:#{event.lineno})"    
    
  _addVarCommandsForElements: (elements) ->
    @workerCommands.push "var", el.id + prop

  registerCommands: (commands) ->
    for command in commands
      @registerCommand command

  registerCommand: (command) ->    
    # TODO: treat commands as strings and check cache for dups?
    @workerCommands.push command

  registerDomQuery: (o) ->    
    selector = o.selector
    if @queryCache[selector]?
      return @queryCache[selector]
    else
      @observe()
      query = new GSS.Query(o)
      query.update()
      @queryCache[selector] = query
      return query
###
Engine::loadAllASTs = () ->
  @ASTs = @getter.readAllASTs()

Engine::addAST = (ast) ->
  @ASTs.push ast
  @run ast  

Engine::removeAST = (ast) ->  
  @clean()
  @ASTs.splice @ASTs.indexOf(ast), 1
  @run @ASTs
###

module.exports = Engine
