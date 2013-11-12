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
    #@varKeysByTacker = {}
    #@varKeys = []
    if !@scope then new Error "Scope required for Engine"      
    #  @scope = 
    if @scope.tagName is "HEAD" then @scope = document    
    @workerURL = GSS.config.workerURL               unless @workerURL
    # id is always gssid of scope
    @id        = GSS.setupScopeId @scope
    @commander = new GSS.Commander(@)
    @worker    = null
    #    
    @workerCommands = []
    @workerMessageHistory = []
    @lastWorkerCommands = null
    @queryCache = {}    
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
  
  isDescendantOf: (engine) ->
    parentEngine = @parentEngine
    while parentEngine
      if parentEngine is engine
        return true
      parentEngine = parentEngine.parentEngine
    return false
  
  isAscendantOf: (engine) ->
    # todo
  
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
    if ast.commands
      @execute ast.commands    
    if ast.css      
      @cssToDump = ast.css
      # When is best time to dump css?
      # Early in prep for intrinsics?
      # Or, should intrinsics be deferred any way?      
      @dumpCSSIfNeeded()
    
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
  

  # Trigger event on self then GSS.engines.
  # Allows ev delegation for engine lifecycle.
  hoistedTrigger: (ev,obj) ->
    @trigger ev, obj
    GSS.trigger "engine:"+ev, obj
  
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
    @hoistedTrigger "beforeLayout", @
    @is_running = true    
    @solve()
    @setNeedsLayout false
    #@hoistedTrigger "afterLayout", @
    
  layoutIfNeeded: () ->    
    LOG @id,".layoutIfNeeded()"
    # if commands were found & executed
    if @needsLayout # @workerCommands.length > 0
      @waitingToLayoutSubtree = true
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
  # -----------------------
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
  
  displayIfNeeded: () ->
    #console.log @, "displayIfNeeded"
    if @needsDisplay #@workerCommands.length > 0
      @display()      
      @setNeedsDisplay false
    for child in @childEngines
      child.displayIfNeeded()
      
  display: () ->
    LOG @id,".display()"
    @hoistedTrigger "beforeDisplay", @    
    GSS.unobserve()
    #@dumpCSSIfNeeded()
    
    @setter.set @vars
    
    @validate()    
    
    GSS.observe()
    @dispatch "solved", {values:@vars}    
    TIME_END "#{@id} DISPLAY PASS"
    #    
    #@layoutSubTreeIfNeeded()    
  
  validate: ->
    # TODO: 
    # - validate only when intrinsic opposites change?
    # - batch validations
    @commander.validateMeasures()    
  
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
    #
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
    #@varKeysByTacker = {}
    #@varKeys = []
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
    @hoistedTrigger "beforeDestroy", @
    # kill all descdendant el tracking b/c memory
    descdendants = GSS.get.descdendantNodes @scope
    for d in descdendants
      kill = d._gss_id
      if kill then GSS._id_killed kill
              
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
    #@varKeysByTacker = null
    #@varKeys = null
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
  
  measureByGssId: (id, prop) ->    
    el = GSS.getById id
    val = @getter.measure(el, prop)
    LOG @id,".measureByGssId()", id, prop, val
    return val              
  
  handleWorkerMessage: (message) =>
    LOG @id,".handleWorkerMessage()",@workerCommands    
    #cleanAndSnatch message.data.values, @vars
    @vars = message.data.values
    
    #@setNeedsDisplay(true)
    @display()
    
    #@setter.set @vars

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
    
  registerCommand: (command) ->    
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
      query = new GSS.Query(o)
      query.update()
      @queryCache[selector] = query
      return query
  
  
  # Constraint Creation Helpers
  # ----------------------------------------
  
  elVar: (el,key,selector,tracker2) ->
    gid = GSS.getId el    
    # normalize key names
    if key is 'left'
      key = 'x'
    else if key is 'top' 
      key = 'y'
    varid = "$"+gid+"[#{key}]"
    # varexps
    if key is 'bottom'
      @registerCommand ['varexp', varid, @plus(@elVar(el,'y',selector),@elVar(el,'height',selector))] 
    else if key is 'right'      
      @registerCommand ['varexp', varid, @plus(@elVar(el,'x',selector),@elVar(el,'width',selector))] 
    else if key is 'center-y'
      @registerCommand ['varexp', 
        varid,
        @plus(
          @elVar(el,'y',selector), 
          @divide(@elVar(el,'height',selector),2)
        )
      ]
    else if key is 'center-x'
      @registerCommand ['varexp',
        varid,
        @plus(
          @elVar(el,'x',selector), 
          @divide(@elVar(el,'width',selector),2)
        )
      ] 
    else
      @registerCommand ['var', varid, "$"+gid]
    #
    ast = ['get',varid]
    if selector 
      ast.push selector+"$"+gid
    if tracker2
      ast.push tracker2
    return ast
    
  var: (key) ->    
    @registerCommand ['var', key]
    return ['get',key]
  
  varexp: (key, exp, tracker) ->
    @registerCommand ['varexp', exp, tracker]
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
