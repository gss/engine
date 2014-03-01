###

Root commands, if bound to a dom query, will spawn commands
to match live results of query.

###

bindRoot = (root, query) ->
  root.isQueryBound = true    
  
  if !root.queries 
    root.queries = [query]
  else if root.queries.indexOf(query) is -1
    root.queries.push query  
  return root 
  
bindRootAsMulti = (root, query) ->
  bindRoot(root, query)
  
  if root.queries.multi and root.queries.multi isnt query then throw new Error "bindRoot:: only one multiquery per statement"
  root.queries.multi = query
  
bindRootAsContext = (root, query) ->
  bindRoot(root, query)
  
  root.isContextBound = true


# Commander
# ======================================================== 
#
# transforms & generates needed commands for engine

class Commander
  
  constructor: (@engine) ->
    @lazySpawnForWindowSize = GSS._.debounce @spawnForWindowSize, GSS.config.resizeDebounce, false
    @cleanVars()    
  
  clean: () ->
    @cleanVars()
    @unlisten()
  
  cleanVars: () ->
    @spawnableRoots = []
    @intrinsicRegistersById = {}
    @boundWindowProps = []
    @get$cache = {}
    @queryCommandCache = {}
  
  destroy: () ->
    @spawnableRoots = null
    @intrinsicRegistersById = null
    @boundWindowProps = null
    @get$cache = null
    @queryCommandCache = null
    @unlisten()

  execute: (ast) ->
    # is statement
    if ast.commands?
      for command in ast.commands     
        if ast.isRule          
          command.parentRule = ast
        @_execute command, command
    # is block
    ###
    if ast.rules?
      for rule in ast.rules
        @execute rule   
    ###

  _execute: (command, root) => # Not DRY, see Thread.coffee, design pattern WIP
    node = command
    func = @[node[0]]
    if !func?
      throw new Error("Engine Commands broke, couldn't find method: #{node[0]}")
    # recursive excution
    for sub, i in node[1..node.length]
      if sub instanceof Array # then recurse
        node.splice i+1,1,@_execute sub, root
    return func.call @engine, root, node[1...node.length]...

  unlisten: ->
    if !@_bound_to_window_resize
      window.removeEventListener("resize", @lazySpawnForWindowSize, false)
    @_bound_to_window_resize = false

  _bound_to_window_resize: false
  
  spawnForWindowWidth: () ->
    w = window.innerWidth
    w = w - GSS.get.scrollbarWidth() if GSS.config.verticalScroll
    if @engine.vars["::window[width]"] isnt w
      @engine.registerCommand ['suggest', ['get', "::window[width]"], ['number', w], 'required']
      #@engine.registerCommand ['stay', ['get', "::window[width]"]]

  spawnForWindowHeight: () ->
    h = window.innerHeight 
    h = h - GSS.get.scrollbarWidth() if GSS.config.horizontalScroll
    if @engine.vars["::window[height]"] isnt h
      @engine.registerCommand ['suggest', ['get', "::window[height]"], ['number', h], 'required']
      #@engine.registerCommand ['stay', ['get', "::window[width]"]]

  spawnForWindowSize: () =>
    if @_bound_to_window_resize
      if @boundWindowProps.indexOf('width') isnt -1 then @spawnForWindowWidth()
      if @boundWindowProps.indexOf('height') isnt -1 then @spawnForWindowHeight()
      @engine.solve()

  bindToWindow: (prop) ->
    if prop is "center-x" 
      @bindToWindow("width")
      #@bindToWindow("x")
      @engine.registerCommand ['eq', ['get','::window[center-x]'], ['divide',['get','::window[width]'],2], 'required']
      return null
    else if prop is "right"
      @bindToWindow("width")
      #@bindToWindow("x")
      @engine.registerCommand ['eq', ['get','::window[right]'], ['get','::window[width]'], 'required']
      return null
    else if prop is "center-y" 
      @bindToWindow("height")
      #@bindToWindow("y")
      @engine.registerCommand ['eq', ['get','::window[center-y]'], ['divide',['get','::window[height]'],2], 'required']
      return null
    else if prop is "bottom"
      @bindToWindow("width")
      #@bindToWindow("x")
      @engine.registerCommand ['eq', ['get','::window[bottom]'], ['get','::window[height]'], 'required']
      return null
      
    if @boundWindowProps.indexOf(prop) is -1
      @boundWindowProps.push prop
    if prop is 'width' or prop is 'height'
      if prop is 'width' then @spawnForWindowWidth() else @spawnForWindowHeight()
      if !@_bound_to_window_resize
        window.addEventListener("resize", @lazySpawnForWindowSize, false)
        @_bound_to_window_resize = true
    else if prop is 'x'
      @engine.registerCommand ['eq', ['get', '::window[x]'], ['number', 0], 'required']      
    else if prop is 'y'
      @engine.registerCommand ['eq', ['get', '::window[y]'], ['number', 0], 'required']
    #else
    #  throw new Error "Not sure how to bind to window prop: #{prop}"
  

  spawnForScope: (prop) ->  
    key = "$"+@engine.id+"[#{prop}]"
    thisEngine = @engine
    # TODO:
    # - only listen once, not for each prop
    # - use get$?
    GSS.on "engine:beforeDisplay", (engine) ->
      val = engine.vars[key]
      if val?
        if thisEngine.isDescendantOf engine
          thisEngine.registerCommand ['suggest', ['get', key], ['number', val], 'required']
      
  bindToScope: (prop) ->    
    @spawnForScope(prop)
    
    #if @boundScopeProps.indexOf(prop) is -1
    #  @boundScopeProps.push prop
    ###
    if prop is 'width' or prop is 'height'
      if prop is 'width' then @spawnForScopeWidth() else @spawnForScopeHeight()
    else if prop is 'x'
      @engine.registerCommand ['eq', ['get', '::scope[x]'], ['number', 0], 'required']      
    else if prop is 'y'
      @engine.registerCommand ['eq', ['get', '::scope[y]'], ['number', 0], 'required']
    #else
    #  throw new Error "Not sure how to bind to window prop: #{prop}"
    ###


  handleRemoves: (removes) ->
    if (removes.length < 1) then return @    
    @engine.registerCommand ['remove', removes...]
    for varid in removes
      delete @intrinsicRegistersById[varid]
    @

  handleSelectorsWithAdds: (selectorsWithAdds) ->
    if (selectorsWithAdds.length < 1) then return @
    # TODO: cache lookup, can be many spawnableRoots
    for root in @spawnableRoots
      for query in root.queries
        if selectorsWithAdds.indexOf(query.selector) isnt -1
          @spawn root
          break
    @
      
  validateMeasures: () ->
    ids = []
    for id of @intrinsicRegistersById
      ids.push id
    @handleInvalidMeasures(ids)
      
  handleInvalidMeasures: (invalidMeasures) ->
    if (invalidMeasures.length < 1) then return @
    for id in invalidMeasures
      registersByProp = @intrinsicRegistersById[id]
      if registersByProp
        for prop,register of registersByProp
          register.call @
    @
        
  
  
  # Command Spawning
  # ------------------------------------------------
  
  ###
  getWhereCommandIfNeeded: (rule) ->    
    
    # Condtional Bound`
    if rule
      if rule.isCondtionalBound & !rule.isConditional
        whereCommand = ["where"]
        for cond in rule.boundConditionals
          whereCommand.push cond.getClauseTracker()
        return whereCommand
    else 
      return null
  ###
  
  registerSpawn: (node) ->      
    
    # TODO: REGISTER FOR CONDITIONAL ITSELF????
    
    # Condtional Bound
    #whereCommand = @getWhereCommandIfNeeded node.parentRule
    #if whereCommand then node.push whereCommand
    
    if !node.isQueryBound
      # just pass root through      
      # TODO: not have to clone...
      newCommand = []
      for part in node
        newCommand.push part
      @engine.registerCommand newCommand
    else
      @spawnableRoots.push node
      @spawn node    
  
  spawn: (node) ->
    queries = node.queries
    ready = true
    for q in queries
      if q.lastAddedIds.length <= 0
        ready = false
        break        
    
    if ready      
      rule = node.parentRule 
      
      # Context Bound
      if node.isContextBound
        contextQuery = rule.getContextQuery()
        
        for contextId in contextQuery.lastAddedIds            
          @engine.registerCommands @expandSpawnable node, true, contextId
          #@installCommandFromBase node, context_id
        
      
      # Not Context Bound                    
      else
        @engine.registerCommands @expandSpawnable node, true
        #@installCommandFromBase node
          
  
  #uninstallCommandFromBase: (node, context_id, tracker) ->
  
  expandSpawnable: (command, isRoot, contextId, tracker) ->
  
    newCommand = []
    commands = []
    hasPlural = false
    pluralPartLookup = {}
    plural = null
    pluralLength = 0

    for part, i in command
      if part
        if part.spawn?
          newPart = part.spawn(  contextId  )
          newCommand.push newPart
          if part.isPlural
            hasPlural = true
            pluralPartLookup[i] = newPart
            pluralLength = newPart.length
        else
          newCommand.push part        
  
    if isRoot
      if tracker then newCommand.push tracker
           
    if hasPlural      
      for j in [0...pluralLength]
        pluralCommand = []
        for part, i in newCommand
          if pluralPartLookup[i]
            pluralCommand.push pluralPartLookup[i][j]
          else
            pluralCommand.push part
        commands.push pluralCommand
      return commands        
    
    else      
      if isRoot 
        return [newCommand]
      return newCommand
  
  makeNonRootSpawnableIfNeeded: (command) ->
    isPlural = false
    for part in command
      if part
        if part.spawn?
          isSpawnable = true
          if part.isPlural
            isPlural = true  
  
    if !isSpawnable
      return command    
  
    return {
      isPlural: isPlural
      spawn: (contextId) =>
        return @expandSpawnable command, false, contextId
    }
  
  
  # Variable Commands
  # ------------------------------------------------
  
  'get': (root, varId, tracker) =>
    command = ['get', varId]
    if tracker 
      command.push tracker
    return command
    
  'get$':(root, prop, queryObject) =>
    key = queryObject.selectorKey
    if !key then key = queryObject.selector
    key += prop
    val = @get$cache[key]
    if !val
      val = @_get$(root, prop, queryObject)
      @get$cache[key] = val
    return val
    
  '_get$':(root, prop, queryObject) =>  
    # runs only once for a given selector + prop
    
    query = queryObject.query
    selector = queryObject.selector
    
    # window  
    if selector is 'window'
      @bindToWindow prop
      return ['get',"::window[#{prop}]"] 
    
    isMulti = query.isMulti    
    
    isContextBound = queryObject.isContextBound    
    isScopeBound = queryObject.isScopeBound    
    
    
    # scope
    if isScopeBound
      @bindToScope prop         
    
    # intrinsics
    if prop.indexOf("intrinsic-") is 0
      query.lastAddedIds.forEach (id) =>
        gid = "$" + id
        if !@intrinsicRegistersById[gid] then @intrinsicRegistersById[gid] = {}              
        # only register intrinsic prop once per id          
        if !@intrinsicRegistersById[gid][prop]
          elProp = prop.split("intrinsic-")[1]
          k = "#{gid}[#{prop}]"
          engine = @engine
          register = () ->
            val = engine.measureByGssId(id, elProp)
            # don't spawn intrinsic if val is unchanged
            if engine.vars[k] isnt val
              engine.registerCommand ['suggest', ['get$', prop, gid, selector], ['number', val], 'required']              
              #@engine.registerCommand ['stay', ['get', "#{gid}[#{prop}]"]]
            
            # intrinsics always need remeasurement
            engine.setNeedsMeasure true
            
          @intrinsicRegistersById[gid][prop] = register
          
          #@engine.setNeedsMeasure true
          # should call intrinsics here? b/c invalid until first pass anyway...
          register.call @    
    
    if isContextBound
      idProcessor = queryObject.idProcessor
      return {
        isQueryBound: true
        isPlural: false
        query: query      
        spawn: (id) ->
          if idProcessor
            id = idProcessor(id)
          return ['get$', prop, "$"+id, selector]
      }
      
    return {
      isQueryBound: true
      isPlural: isMulti
      query: query      
      spawn: () ->
        if !isMulti
          id = query.lastAddedIds[query.lastAddedIds.length-1]
          return ['get$', prop, "$"+id, selector]
        nodes = []
        for id in query.lastAddedIds
          nodes.push ['get$', prop, "$"+id, selector]
        return nodes
      }      
  
  'number': (root, num) ->
    return ['number', num]

  'plus': (root, e1, e2) =>
    return @makeNonRootSpawnableIfNeeded ['plus', e1, e2]
  
  'minus' : (root, e1,e2) =>
    return @makeNonRootSpawnableIfNeeded ['minus', e1, e2]

  'multiply': (root, e1,e2) =>
    return @makeNonRootSpawnableIfNeeded ['multiply', e1, e2]

  'divide': (root, e1,e2,s,w) =>
    return @makeNonRootSpawnableIfNeeded ['divide', e1, e2]

    
  # Conditional Commands
  # ------------------------------------------------
  
  "cond": (self) =>  
    @registerSpawn self
    #args = [arguments...]
    #@engine.registerCommand ['cond', args[1...args.length]...]
  
  ###
  "where": (root,name) =>
    return ['where',name]
  
  "clause": (root,cond,label) =>
    return @makeNonRootSpawnableIfNeeded ["clause",cond,label]
  ###
  
  "where": (root,name) =>
    if root.isContextBound
      command = [
        "where",
        name,
        # TODO: somehow make less brain mushy
        # name suffix that is optionally tracked...
        {
          spawn: (contextId)->
            return "-context-" + contextId
        }
      ]
    else
      command = ["where",name]
    return @makeNonRootSpawnableIfNeeded command
  
  "clause": (root,cond,name) =>
    if root.isContextBound
      command = [
        "clause",
        cond,
        {
          spawn: (contextId)->
            if contextId
              return name + "-context-" + contextId
            return name          
        }
      ]
    else
      command = ["clause",cond,name]
    return @makeNonRootSpawnableIfNeeded command
  
  "?>=": (root,e1,e2) =>
    return @makeNonRootSpawnableIfNeeded ["?>=",e1,e2]
  
  "?<=": (root,e1,e2) =>
    return @makeNonRootSpawnableIfNeeded ["?<=",e1,e2]
  
  "?==": (root,e1,e2) =>
    return @makeNonRootSpawnableIfNeeded ["?==",e1,e2]
    
  "?!=": (root,e1,e2) =>
    return @makeNonRootSpawnableIfNeeded ["?!=",e1,e2]
  
  "?>": (root,e1,e2) =>
    return @makeNonRootSpawnableIfNeeded ["?>",e1,e2]
  
  "?<": (root,e1,e2) =>
    return @makeNonRootSpawnableIfNeeded ["?<",e1,e2]
    
  "&&": (root,e1,e2) =>
    return @makeNonRootSpawnableIfNeeded ["&&",e1,e2]
  
  "||": (root,e1,e2) =>
    return @makeNonRootSpawnableIfNeeded ["||",e1,e2]
    
  # Constraint Commands
  # ------------------------------------------------
  
  'strength': (root,s) =>
    return ['strength', s]
  
  'suggest': () =>
    # pass through
    args = [arguments...]
    @engine.registerCommand ['suggest', args[1...args.length]...]                
  
  'eq': (self,e1,e2,s,w) =>
    @registerSpawn(self)

  'lte': (self,e1,e2,s,w) =>
    @registerSpawn(self)

  'gte': (self,e1,e2,s,w) =>
    @registerSpawn(self)

  'lt': (self,e1,e2,s,w) =>
    @registerSpawn(self)

  'gt': (self,e1,e2,s,w) =>
    @registerSpawn(self)

  'stay': (self) =>
    @registerSpawn(self)
    ###
    if !self._is_bound then return @registerSpawn(self)
    # break up stays to allow multiple plural queries
    args = [arguments...]
    gets = args[1...args.length]    
    for get in gets
      stay = ['stay']
      stay.push get
      cloneBinds self, stay
      @registerSpawn(stay)
    ###      
  

  # Selector Commands
  # ------------------------------------------------

  # mutli
  '$class': (root,sel) =>
    selector = "."+sel
    o = @queryCommandCache[selector]
    if !o
      query = @engine.registerDomQuery selector:selector, isMulti:true, isLive:false, createNodeList:() =>
        #return @engine.queryScope.querySelectorAll("."+sel)
        return @engine.queryScope.getElementsByClassName(sel)    
      o = {
        query:query
        selector:selector
      }
      @queryCommandCache[selector] = o
    bindRootAsMulti root, o.query
    return o

  # mutli
  '$tag': (root,sel) =>    
    selector = sel
    o = @queryCommandCache[selector]
    if !o
      query = @engine.registerDomQuery selector:selector, isMulti:true, isLive:false, createNodeList:() =>
        return @engine.queryScope.getElementsByTagName(sel)
      o = {
        query:query
        selector:selector
      }
      @queryCommandCache[selector] = o
    bindRootAsMulti root, o.query
    return o
  
  '$id': (root,sel) =>
    selector = "#"+sel
    o = @queryCommandCache[selector]
    if !o
      query = @engine.registerDomQuery selector:selector, isMulti:false, isLive:false, createNodeList:() =>
        # TODO: handle scope.getElementById for web components?
        el = document.getElementById(sel)
        if el then return [el] else return []    
      o = {
        query:query
        selector:selector
      }
      @queryCommandCache[selector] = o
    bindRoot root, o.query
    return o
  
  # 
  '$reserved': (root, sel) =>

    if sel is 'window'
      selector = 'window'
      o = @queryCommandCache[selector]
      if !o        
        o = {
          selector:selector    
          query: null
        }
        @queryCommandCache[selector] = o
      # bindRoot() not needed
      return o
    
    engine = @engine
    
    if sel is '::this' or sel is 'this'      
      parentRule = root.parentRule
      if !parentRule then throw new Error "::this query requires parent rule for context"    
      query = parentRule.getContextQuery()            
      selector = query.selector
      selectorKey = selector+"::this"
      o = @queryCommandCache[selectorKey]
      if !o
        o = {
          query:query
          selector:selector
          selectorKey:selectorKey
          isContextBound: true
        }
        @queryCommandCache[selectorKey] = o
      bindRootAsContext root, query
      return o
    
    else if sel is '::parent' or sel is 'parent'
      parentRule = root.parentRule
      if !parentRule then throw new Error "::this query requires parent rule for context"    
      query = parentRule.getContextQuery()
      selector = query.selector + "::parent"      
      o = @queryCommandCache[selector]
      if !o
        o = {
          query:query
          selector:selector
          isContextBound: true
          idProcessor: (id) ->
            # TODO... fix this shit
            return GSS.setupId(GSS.getById(id).parentElement)
        }      
        @queryCommandCache[selector] = o
      bindRootAsContext root, query
      return o
    
    else if sel is 'scope'
      selector = "::"+sel
      o = @queryCommandCache[selector]
      if !o
        query = engine.registerDomQuery selector:selector, isMulti:false, isLive:true, createNodeList:() ->
          return [engine.scope]
        o = {
          query:query
          selector:selector
          isScopeBound: true
        }
        @queryCommandCache[selector] = o
      bindRoot root, o.query
      return o
      
    
    throw new Error "$reserved selectors not yet handled: #{sel}"          
  
      
  
  
  # Chains
  # ------------------------------------------------
  
  'chain': (root,queryObject,bridgessssss) =>    
    query = queryObject.query
    args = [arguments...]
    bridges = [args[2...args.length]...]
    engine = @engine
    
    more = null
    #whereCommand = @getWhereCommandIfNeeded root.parentRule
    #if whereCommand 
    #  more = [whereCommand]    
    
    # TODO: dangerous... what if bridge is a spawn object?
    for bridge in bridges
      if typeof bridge isnt "function"
        more = [] if !more
        more.push bridge
        bridges.splice bridges.indexOf(bridge), 1

    for bridge in bridges
      bridge.call(engine,query,engine,more)
      
    query.on 'afterChange', () ->
      for bridge in bridges
        bridge.call(engine,query,engine,more)
    
  'eq-chain': (root,head,tail,s,w) =>
    return @_chainer('eq',head,tail,s,w)
  
  'lte-chain': (root,head,tail,s,w) =>
    return @_chainer('lte',head,tail,s,w)
  
  'gte-chain': (root,head,tail,s,w) =>
    return @_chainer('gte',head,tail,s,w)
  
  'lt-chain': (root,head,tail,s,w) =>
    return @_chainer('lt',head,tail,s,w)
  
  'gt-chain': (root,head,tail,s,w) =>
    return @_chainer('gt',head,tail,s,w) 
  
  _chainer: (op,head,tail,s,w) =>
    tracker = "eq-chain-" + GSS.uid()
    engine = @engine
    _e_for_chain = @_e_for_chain  
    
    # return query 'afterChange' callback
    return (query,e,more) ->
      
      # refresh when query changes 
      e.remove tracker            
      
      # add constraints to each element
      query.forEach (el) ->
        nextEl = query.next(el)
        return unless nextEl        
        e1 = _e_for_chain( el,     head, query, tracker, el, nextEl)
        e2 = _e_for_chain( nextEl, tail, query, tracker, el, nextEl)
        e[op] e1, e2, s, w, more
  
  'plus-chain': (root,head,tail) =>    
    return @_chainer_math(head,tail,'plus')
  
  'minus-chain': (root,head,tail) =>
    return @_chainer_math(head,tail,'minus')
  
  'multiply-chain': (root,head,tail) =>
    return @_chainer_math(head,tail,'multiply')
  
  'divide-chain': (root,head,tail) =>
    return @_chainer_math(head,tail,'divide')
  
  _chainer_math: (head, tail, op) =>
    # hoisted vars
    # - `el`
    # - `nextEl`
    engine = @engine
    _e_for_chain = @_e_for_chain
    return (el, nextEl, query, tracker) ->
      e1 = _e_for_chain( el,     head, query, tracker)
      e2 = _e_for_chain( nextEl, tail, query, tracker)
      return engine[op] e1, e2
  
  
  _e_for_chain: (el, exp, query, tracker, currentEl, nextEl) =>
    if typeof exp is "string"
      e1 = @engine.elVar(el,exp,query.selector)
    else if typeof exp is "function" # chainer-math
      e1 = exp.call(@, currentEl, nextEl, query, tracker)
    else
      e1 = exp
    return e1
    
  
  # JavaScript for-loop hooks
  # ------------------------------------------------
  
  'for-each': (root,queryObject,callback) =>
    query = queryObject.query
    for el in query.nodeList
      callback.call(@engine, el, query, @engine)
    query.on 'afterChange', () ->
      for el in query.nodeList
        callback.call(@engine, el, query)
  
  'for-all': (root,queryObject,callback) =>
    query = queryObject.query
    callback.call(@engine, query, @engine)
    query.on 'afterChange', () =>
      callback.call(@engine, query, @engine)
    
  'js': (root,js) =>
    eval "var callback =" + js
    return callback


module.exports = Commander
