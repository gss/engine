if !GSS? then throw new Error "GSS object needed for Engine"

_ = GSS._

TIME = () ->
  if GSS.config.perf
    console.time arguments...
    
TIME_END = () ->
  if GSS.config.perf
    console.timeEnd arguments...

LOG = () ->
  GSS.deblog "Engine", arguments...

GSS.engines = engines = []
engines.byId = {}
engines.root = null

class Engine extends GSS.EventTrigger

  constructor: (o={}) ->
    super    
    {@scope, @workerURL, @vars, @getter, @is_root, @useWorker} = o
    
    @vars = {} unless @vars
    
    if !GSS.config.useWorker
      @useWorker = false
    else      
      @useWorker = true unless @useWorker?
    @worker    = null
    @workerCommands = []
    @workerMessageHistory = []
    @workerURL = GSS.config.workerURL unless @workerURL

    if @scope 
      if @scope.tagName is "HEAD" then @scope = document          
      @id = GSS.setupScopeId @scope # id is always gssid of scope
      if @scope is GSS.Getter.getRootScope()
        @queryScope = document
      else
        @queryScope = @scope
    else
      @id = GSS.uid()
      @queryScope = document
      
    @getter    = new GSS.Getter(@scope) unless @getter    
    @commander = new GSS.Commander(@)    
    @lastWorkerCommands = null
    @queryCache = {}    
    @cssDump = null
    
    GSS.engines.push @
    engines.byId[@id] = @
    
    @_Hierarchy_setup()
    
    @_StyleSheets_setup()

    LOG "constructor() @", @
    @
        
      
  getVarsById: (vars) ->
    if GSS.config.processBeforeSet then vars = GSS.config.processBeforeSet(vars)
    varsById = _.varsByViewId(_.filterVarsForDisplay(vars))
  
  
  # Hierarchy
  # ------------------------------------------------
  
  isDescendantOf: (engine) ->
    parentEngine = @parentEngine
    while parentEngine
      if parentEngine is engine
        return true
      parentEngine = parentEngine.parentEngine
    return false
  
  _Hierarchy_setup: -> 
    @childEngines = [] 
    @parentEngine = null    
    if @is_root
      engines.root = @
    else if @scope
      @parentEngine = GSS.get.nearestEngine @scope, true            
    else
      @parentEngine = engines.root
    if !@parentEngine and !@is_root then throw new Error "ParentEngine missing, WTF"
    @parentEngine?.childEngines.push @
  
  _Hierarchy_destroy: ->        
    # update engine hierarchy
    @parentEngine.childEngines.splice(@parentEngine.childEngines.indexOf(@),1)
    @parentEngine = null
  
  
  # Commands
  # ------------------------------------------------
  
  is_running: false
  
  run: (asts) ->
    LOG @id,".run(asts)",asts
    if asts instanceof Array
      for ast in asts        
        @_run ast
    else 
      @_run asts   
      
  _run: (ast) ->
    # digests & transforms commands into @workerCommands    
    @commander.execute ast
    #if ast.commands      
    #  @commander.execute ast.commands
    if ast.css      
      @cssToDump = ast.css
      # When is best time to dump css?
      # Early in prep for intrinsics?
      # Or, should intrinsics be deferred any way?      
      @dumpCSSIfNeeded()                    
  
  _StyleSheets_setup: ->
    @styleSheets = []    
  
  load: ->    
    if !@scope then throw new Error "can't load scopeless engine"
    if @is_running
      @clean()
    for sheet in @styleSheets
      sheet.execute()
  
  #load: (asts) ->
  #  for s in GSS.styleSheets
  #    if s.engine is @
        
  
  reload: () =>
    # Load commands from style nodes.    
    LOG @id,".loadASTs()"
    if !@scope then throw new Error "can't load scopeless engine"
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
  
  registerCommands: (commands) ->
    for command in commands
      @registerCommand command
    
  registerCommand: (command) ->    
    # TODO: treat commands as strings and check cache for dups?
    @workerCommands.push command
    #
    @setNeedsLayout true
    @
  
  
  # CSSDumper
  # ------------------------------------------------
  
  cssToDump: null
  
  cssDump: null
  
  setupCSSDumpIfNeeded: () ->
    dumpNode = @scope or document.body
    if !@cssDump
      #@scope.insertAdjacentHTML "afterbegin", ""
      @cssDump = document.createElement "style"
      @cssDump.id = "gss-css-dump-" + @id 
      dumpNode.appendChild @cssDump
      #@cssDump.classList.add("gss-css-dump")     
  
  dumpCSSIfNeeded: () ->
    if @cssToDump
      @setupCSSDumpIfNeeded()
      @cssDump.insertAdjacentHTML "beforeend", @cssToDump
      @cssToDump = null

  _CSSDumper_clean: () ->    
    @cssToDump = null
    @cssDump?.innerHTML = ""
  
  _CSSDumper_destroy: () ->
    @cssToDump = null
    #@cssDump?.remove()
    @cssDump = null    
  
  
  # Update pass
  # ------------------------------------------------
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
  # ------------------------------------------------
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
    @hoistedTrigger "beforeLayout", @
    @is_running = true
    TIME "#{@id} LAYOUT & DISPLAY"
    @solve()
    @setNeedsLayout false
    #@hoistedTrigger "afterLayout", @
    
  layoutIfNeeded: () ->    
    LOG @id,".layoutIfNeeded()"
    # if commands were found & executed
    if @needsLayout # @workerCommands.length > 0
      #@waitingToLayoutSubtree = true
      @layout()      
    #else if !@waitingToLayoutSubtree
    #  @layoutSubTreeIfNeeded()
    @layoutSubTreeIfNeeded()
  
  waitingToLayoutSubtree: false
  
  layoutSubTreeIfNeeded: () ->
    @waitingToLayoutSubtree = false
    for child in @childEngines
      child.layoutIfNeeded()
  
  
  # Display pass
  # ------------------------------------------------
  #
  # - write to dom
  #
  
  needsDisplay: false
  
  setNeedsDisplay: (bool) ->    
    if bool
      LOG @id,".setNeedsDisplay( #{bool} )"
      GSS.setNeedsDisplay true
      @needsDisplay = true
    else
      LOG @id,".setNeedsDisplay( #{bool} )"
      @needsDisplay = false
  
  ###
  displayIfNeeded: () ->
    LOG @, "displayIfNeeded"
    if @needsDisplay #@workerCommands.length > 0
      @display(@vars)      
      @setNeedsDisplay false
    for child in @childEngines
      child.displayIfNeeded()
  ###
   
  display: (vars, forceViewCacheById=false) ->
    LOG @id,".display()"
    @hoistedTrigger "beforeDisplay", @        
    GSS.unobserve()
    
    #@dumpCSSIfNeeded()
    
    varsById = @getVarsById(vars)
    
    # batch potential DOM reads
    needsToDisplayViews = false
    for id, obj of varsById
      needsToDisplayViews = true
      if forceViewCacheById
        el = document.getElementById(id)
        if el
          GSS.setupId el
      GSS.View.byId[id]?.updateValues?(obj)      
    
    # batch DOM writes top -> down
    if needsToDisplayViews
      if @scope 
        GSS.get.view(@scope).displayIfNeeded()
    # else, w/o scope, engine does not write, just read    
    
    @validate()    
    
    GSS.observe()    
    @dispatchedTrigger "solved", {values:vars} 
    TIME_END "#{@id} LAYOUT & DISPLAY"
        
    #@layoutSubTreeIfNeeded()    
    
    @
  
  forceDisplay: (vars) ->
    
  
  # Measurement
  # ------------------------------------------------
  
  validate: ->
    # TODO: 
    # - validate only when intrinsic opposites change?
    # - batch validations
    @commander.validateMeasures()
  
  measureByGssId: (id, prop) ->    
    el = GSS.getById id
    val = @getter.measure(el, prop)
    LOG @id,".measureByGssId()", id, prop, val
    return val
    
  
  # Worker
  # ------------------------------------------------
  
  solve: () ->
    if @useWorker then @solveWithWorker() else @solveWithoutWorker()
    
  solveWithWorker: () ->
    LOG @id,".solveWithWorker()", @workerCommands
    
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
  
  solveWithoutWorker: () ->
    LOG @id,".solveWithoutWorker()", @workerCommands
    workerMessage = {commands:@workerCommands}
    @workerMessageHistory.push workerMessage    
    unless @worker
      @worker = new GSS.Thread()
    @worker.postMessage _.cloneDeep workerMessage
    _.defer => # must simulate asynch for life cycle to work
      if @worker
        @handleWorkerMessage {data:values:@worker.getValues()}
    # resetWorkerCommands
    @lastWorkerCommands = @workerCommands
    @workerCommands = []
  
  handleWorkerMessage: (message) =>
    LOG @id,".handleWorkerMessage()",@workerCommands    
        
    @vars = message.data.values
    
    #@setNeedsDisplay(true)
    
    @display(@vars)    

    #@dispatch "solved", {values:@vars} 
  
  handleError: (event) ->
    return @onError event if @onError
    throw new Error "#{event.message} (#{event.filename}:#{event.lineno})"
  
  _Worker_destroy: () ->
    if @worker
      @worker.terminate()
      @worker = null
    @workerCommands = null
    @workerMessageHistory = null
    @lastWorkerCommands = null
  
  _Worker_clean: () ->
    @workerCommands = []
    #@workerMessageHistory = [] keep history
    @lastWorkerCommands = null
    if @worker
      @worker.terminate()
      @worker = null
    
  
  # Queries
  # ----------------------------------------
  
  registerDomQuery: (o) ->    
    selector = o.selector
    if @queryCache[selector]?
      return @queryCache[selector]
    else      
      query = new GSS.Query(o)
      query.update()
      @queryCache[selector] = query
      return query
    
  updateQueries: =>        
    # els added or removed from queries
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
  
  _Queries_destroy: () ->
    for selector, query of @queryCache
      query.destroy()
      @queryCache[selector] = null
    @queryCache = null
  
  _Queries_clean: () ->    
    for selector, query of @queryCache
      query.destroy()
      @queryCache[selector] = null
    @queryCache = {}
  
  # Events
  # ----------------------------------------
    
  hoistedTrigger: (ev,obj) ->
    # Trigger event on self then GSS.engines.
    # Allows ev delegation for engine lifecycle.
    @trigger ev, obj
    GSS.trigger "engine:"+ev, obj
  
  dispatchedTrigger: (e, o, b, c)->
    @trigger e, o
    @dispatch e, o, b, c
  
  dispatch: (eName, oDetail = {}, bubbles = true, cancelable = true) =>
    return unless @scope
    oDetail.engine = @
    o = {
      detail:oDetail
      bubbles: bubbles
      cancelable: cancelable
    }
    e = new CustomEvent eName, o
    @scope.dispatchEvent e  
  
  
  # Clean
  # ------------------------------------------------
  #
  # clean when scope insides changes, but if scope changes must destroy
  
  clean: () ->    
    LOG @id,".clean()"
    
    # event listeners
    @offAll()
    
    for key, val of @vars
      delete @vars[key]

    @setNeedsLayout  false
    @setNeedsDisplay false
    @setNeedsLayout  false
    @waitingToLayoutSubtree = false        
    
    @commander.clean()
    @getter.clean?()
    
    @_CSSDumper_clean()
    @_Worker_clean()
    @_Queries_clean()
        
    @
  
  # Destruction
  # ------------------------------------------------
  
  is_destroyed: false
  
  destroyChildren: () ->
    for e in @childEngines
      if !e.is_destroyed
        e.destroy()
  
  destroy: ->
    LOG @id,".destroy()"
    @hoistedTrigger "beforeDestroy", @        
    
    # release ids
    GSS._ids_killed([@id]) # TODO(D4): release children node ids?
    
    # release children ids
    if @scope
      descdendants = GSS.get.descdendantNodes @scope
      for d in descdendants
        kill = d._gss_id
        if kill then GSS._id_killed kill
    
    # remove from GSS.engines
    i = engines.indexOf @
    if i > -1 then engines.splice(i, 1)
    delete engines.byId[@id]
        
    # cascade destruction?
    #@destroyChildren()        
              
    # event listeners
    @offAll()
    
    @setNeedsLayout  false
    @setNeedsDisplay false
    @setNeedsLayout  false
    @waitingToLayoutSubtree = false    
    
    @commander.destroy()    
    @getter.destroy?()     
            
    @vars   = null
    @ast    = null    
    @getter = null
    @scope = null
    @commander = null    
    
    @_Hierarchy_destroy()
    @_CSSDumper_destroy()
    @_Worker_destroy()
    @_Queries_destroy()
    
    @is_running   = null
    @is_destroyed = true
      
    @
    
  
  # Constraint Creation Helpers
  # ----------------------------------------
  
  elVar: (el,key,selector,tracker2) ->
    gid = "$" + GSS.getId el    
    # normalize key names
    if key is 'left'
      key = 'x'
    else if key is 'top' 
      key = 'y'
    varid = gid+"[#{key}]"
    #
    ast = ['get$',key,gid,selector]
    if tracker2
      ast.push tracker2
    return ast
    
  var: (key) ->    
    #@registerCommand ['var', key]
    return ['get',key]
  
  varexp: (key, exp, tracker) ->
    #@registerCommand ['varexp', exp, tracker]
    return ['get',key]
  
  __e: (key) ->
    if key instanceof Array then return key
    if !!Number(key) or (Number(key) is 0) then return ['number',key]
    return @var key
  
  eq: (e1,e2,s,w) ->
    e1 = @__e e1
    e2 = @__e e2
    @registerCommand ['eq', e1, e2, s, w]
  
  lte: (e1,e2,s,w) ->
    e1 = @__e e1
    e2 = @__e e2
    @registerCommand ['lte', e1, e2, s, w]
  
  gte: (e1,e2,s,w) ->
    e1 = @__e e1
    e2 = @__e e2
    @registerCommand ['gte', e1, e2, s, w]
  
  suggest: (v, val, strength = 'required') ->    
    v = @__e v
    @registerCommand ['suggest', v, ['number', val], strength]
  
  stay: (v) ->    
    v = @__e v
    @registerCommand ['stay', v]
  
  remove: (tracker) ->
    @registerCommand ['remove', tracker]
  
  'number': (num) ->
    return ['number', num]

  'plus': (e1, e2) ->
    e1 = @__e e1
    e2 = @__e e2
    return ['plus', e1, e2]

  'minus' : (e1,e2) ->
    e1 = @__e e1
    e2 = @__e e2
    return ['minus', e1, e2]

  'multiply': (e1,e2) ->
    e1 = @__e e1
    e2 = @__e e2
    return ['multiply', e1, e2]

  'divide': (e1,e2,s,w) ->    
    e1 = @__e e1
    e2 = @__e e2
    return ['divide', e1, e2]
  
  

module.exports = Engine
