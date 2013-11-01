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


TIME = () ->
  if GSS.config.perf
    console.time arguments...
    
TIME_END = () ->
  if GSS.config.perf
    console.timeEnd arguments...

LOG= () ->
  GSS.deblog "Engine", arguments...

GSS.engines = engines = []
engines.byId = {}
engines.root = null

class Engine extends GSS.EventTrigger

  constructor: (o) ->
    super
    {@scope, @workerURL, @vars, @getter, @setter, @is_root} = o
    @vars      = {}                          unless @vars
    @varKeysByTacker = {}
    @varKeys = []
    if !@scope then new Error "Scope required for Engine"      
    #  @scope = 
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
    @observer = new MutationObserver @handleMutations    
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
  
  run: (asts) ->
    LOG @id,".run(asts)",asts
    # if array, batch execute then solve
    if asts instanceof Array
      for ast in asts        
        @_run ast
    else 
      @_run asts   
    #@layoutIfNeeded()
      
  _run: (ast) ->
    if ast.css      
      @cssToDump = ast.css
      # When is best time to dump css?
      # Early in prep for intrinsics?
      # Or, should intrinsics be deferred any way?      
    if ast.commands
      @execute ast.commands    
    
  execute: (commands) =>
    # digests or transforms commands
    @commander.execute commands
  
  # CSSDumper
  # -----------------------
  
  cssToDump: null
  
  cssDump: null
  
  setupCSSDumpIfNeeded: () ->
    if !@cssDump
      #@scope.insertAdjacentHTML "afterbegin", ""
      @cssDump = document.createElement "style"
      @cssDump.id = "gss-css-dump-" + @id 
      @scope.appendChild @cssDump
      #@cssDump.classList.add("gss-css-dump")     
  
  dumpCSSIfNeeded: () ->
    if @cssToDump
      @setupCSSDumpIfNeeded()
      @cssDump.insertAdjacentHTML "beforeend", @cssToDump
      @cssToDump = null

  CSSDumper_clean: () ->    
    @cssToDump = null
    @cssDump?.innerHTML = ""
  
  CSSDumper_destroy: () ->
    @cssToDump = null
    #@cssDump?.remove()
    @cssDump = null
              
  
  # Update pass
  # ------------------------
  #
  # - updates constraint commands for engines
  # - measurements
  #
  
  needsUpdate: false
  
  setNeedsUpdate: (bool) ->
    LOG @id,".setNeedsUpdate( #{bool} )"
    if bool
      GSS.setNeedsUpdate true
      @needsUpdate = true
    else
      @needsUpdate = false
  
  updateIfNeeded: () ->
    LOG @id,".updateIfNeeded()"    
    if @needsUpdate
      if @ASTs # then digest ASTs
        @run @ASTs
        @ASTs = null      
      @setNeedsUpdate false
    for child in @childEngines
      child.updateIfNeeded()  
  
  # Layout pass
  # -------------------------
  #
  # - solvers solve
  #
      
  needsLayout: false
  
  setNeedsLayout: (bool) ->
    LOG @id,".setNeedsLayout( #{bool} )"
    if bool 
      if !@needsLayout
        GSS.setNeedsLayout true
        @needsLayout = true
    else
      @needsLayout = false
  
  _beforeLayoutCalls:null
  
  layout: () ->
    LOG @id,".layout()"
    @trigger "beforeLayout", @
    @is_running = true    
    @solve()
    @setNeedsLayout false
    #@trigger "afterLayout", @
    
  layoutIfNeeded: () ->    
    LOG @id,".layoutIfNeeded()"
    # if commands were found & executed
    if @needsLayout # @workerCommands.length > 0
      @waitingToLayoutSubtree = true
      @layout()      
    else if !@waitingToLayoutSubtree
      @layoutSubTreeIfNeeded()
  
  waitingToLayoutSubtree: false
  
  layoutSubTreeIfNeeded: () ->
    @waitingToLayoutSubtree = false
    for child in @childEngines
      child.layoutIfNeeded()
  
  # Display pass
  # -----------------------
  #
  # - write to dom
  #
  
  needsDisplay: false
  
  setNeedsDisplay: (bool) ->
    LOG @id,".setNeedsDisplay( #{bool} )"
    if bool
      GSS.setNeedsDisplay true
      @needsDisplay = true
    else
      @needsDisplay = false
  
  displayIfNeeded: () ->
    #console.log @, "displayIfNeeded"
    if @needsDisplay #@workerCommands.length > 0
      @display()      
      @setNeedsDisplay false
    for child in @childEngines
      child.displayIfNeeded()
      
  display: () ->
    LOG @id,".display()"
    @dumpCSSIfNeeded()
    @setter.set @vars
    # TODO!!!!!!!!!!!!!!!!!!
    # move css dumping here!
    @observe()
    @dispatch "solved", {values:@vars}
    TIME_END "#{@id} DISPLAY PASS"
    #    
    @layoutSubTreeIfNeeded()    
    
  
  load: () =>
    LOG @id,".loadASTs()"
    if @is_running
      @clean()
    #@run( @getter.readAllASTs() )
    ASTs = []
    for node in @getter.getAllStyleNodes()
      # TODO: coordinate with global style query better
      if @scope is GSS.get.scopeForStyleNode node
        AST = @getter.readAST node
        if AST then ASTs.push AST
    @ASTs = ASTs
    #
    @setNeedsUpdate true
    #@run ASTs
    @
    
  # clean when scope insides changes, but if scope changes must destroy
  clean: () ->
    LOG @id,".clean()"
    # event listeners
    @offAll()
    #
    @setNeedsLayout  false
    @setNeedsDisplay false
    @setNeedsLayout  false
    @waitingToLayoutSubtree = false
    #@unobserve()
    @commander.clean()
    @getter.clean?() 
    @setter.clean?()
    #
    @CSSDumper_clean()
    # clean vars
    @workerCommands = []
    #@workerMessageHistory = [] keep history
    @lastWorkerCommands = null    
    #
    for key, val of @vars
      delete @vars[key]
    @varKeysByTacker = {}
    @varKeys = []
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
    console.warn "Stop deprecated for destroy"
    @destroy()
    @
  
  is_destroyed: false
  
  destroyChildren: () ->
    for e in @childEngines
      if !e.is_destroyed
        e.destroy()
  
  destroy: ->
    LOG @id,".destroy()"
    # cascade destruction?
    #@destroyChildren()
    # event listeners
    @offAll()
    #
    @setNeedsLayout  false
    @setNeedsDisplay false
    @setNeedsLayout  false
    @waitingToLayoutSubtree = false
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
    @CSSDumper_destroy()
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
    @varKeysByTacker = null
    @varKeys = null
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
    LOG @id,".solve()", @workerCommands
    TIME "#{@id} DISPLAY PASS"
    workerMessage = {commands:@workerCommands}
    @workerMessageHistory.push workerMessage
    unless @worker
      @worker = new Worker @workerURL
      @worker.addEventListener "message", @handleWorkerMessage, false
      @worker.addEventListener "error", @handleError, false
    @worker.postMessage workerMessage
    # resetWorkerCommands
    @lastWorkerCommands = @workerCommands
    @workerCommands = []
  
  # els added or removed from queries
  updateChildList: =>        
    selectorsWithAdds = []
    removes = []
    globalRemoves = []
    trigger = false
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
          for rid in removedIds
            # prevent redundant removes...
            if globalRemoves.indexOf(rid) is -1
              el = GSS.getById(rid)
              # el removed completely
              if document.documentElement.contains el
                globalRemoves.push rid
                removes.push( selector + "$" + rid ) # .box$3454
              else # el removed just from selector
                removes.push( "$" + rid )      
      # clean up ids
      GSS._ids_killed globalRemoves
      if trigger
        @commander.handleRemoves removes
        @commander.handleSelectorsWithAdds selectorsWithAdds
      return trigger
    
  handleMutations: (mutations=[]) =>
    LOG @id,".handleMutations()", mutations
    trigger = false
    triggerUpdateChildList = false
    invalidMeasures = []
    
    for m in mutations
      
      # style tag was modified then stop & reload everything
      if m.type is "characterData" 
        if @getter.isStyleNode(m.target.parentElement)
          @load()
          return null #@update()
      
      if m.type is "attributes" or m.type is "childList"
        triggerUpdateChildList = true
      #
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
      #
    
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
    
    # TODO: Make smarter!!!!!!!!!!!!
    if !GSS.needsDisplay and !GSS.needsLayout and !GSS.needsDisplay
      if trigger
        @commander.handleInvalidMeasures invalidMeasures
      if triggerUpdateChildList
        childListTrigger = @updateChildList()        

  measureByGssId: (id, prop) ->
    LOG @id,".measureByGssId()",@workerCommands
    el = GSS.getById id
    @getter.measure(el, prop)

  handleWorkerMessage: (message) =>
    LOG @id,".handleWorkerMessage()",@workerCommands
    @unobserve()
    cleanAndSnatch message.data.values, @vars
    
    #@setNeedsDisplay(true)
    @display()
    
    #@setter.set @vars
    #@observe()
    #@dispatch "solved", {values:@vars}  

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

  registerCommands: (commands) ->
    for command in commands
      @registerCommand command

  handleRemoves: (removes) ->
    keys = null
    i = null
    for tracker in removes
      keys = @varKeysByTacker[tracker] 
      if keys
        for key in keys
          i = @varKeys.indexOf key
          if i > -1 then @varKeys.splice(i,1)          
      @varKeysByTacker[tracker] = null
    
  registerCommand: (command) ->    
    if command[0] is 'var'
      key = command[1]
      @varKeys.push key
      tracker = command[2]
      if tracker
        if !@varKeysByTacker[tracker] then @varKeysByTacker[tracker] = []
        @varKeysByTacker[tracker].push key
    else if command[0] is 'remove' 
      @handleRemoves command[1...command.length]...
    # TODO: treat commands as strings and check cache for dups?
    @workerCommands.push command
    #
    @setNeedsLayout true
    @

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

module.exports = Engine
