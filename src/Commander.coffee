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
  else
    return root # already setup
  
  isMulti = query.isMulti
  isContextBound = query.isContextBound
  
  if isMulti and !isContextBound
    if root.queries.multi and root.queries.multi isnt query then throw new Error "bindRoot:: only one multiquery per statement"
    root.queries.multi = query
  
  if isContextBound
    root.isContextBound = true
    
  return root


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
    @bindCache = {}
  
  destroy: () ->
    @spawnableRoots = null
    @intrinsicRegistersById = null
    @boundWindowProps = null
    @bindCache = null
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
    if @engine.vars["::window[width]"] isnt w
      @engine.registerCommand ['suggest', ['get', "::window[width]"], ['number', w], 'required']
      #@engine.registerCommand ['stay', ['get', "::window[width]"]]

  spawnForWindowHeight: () ->
    h = window.innerHeight
    if @engine.vars["::window[height]"] isnt h
      @engine.registerCommand ['suggest', ['get', "::window[height]"], ['number', h], 'required']
      #@engine.registerCommand ['stay', ['get', "::window[width]"]]

  spawnForWindowSize: () =>
    if @_bound_to_window_resize
      if @boundWindowProps.indexOf('width') isnt -1 then @spawnForWindowWidth()
      if @boundWindowProps.indexOf('height') isnt -1 then @spawnForWindowHeight()
      @engine.solve()

  bindToWindow: (prop) ->
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
        
  spawnMeasurements: (root) =>
    # only if bound to dom query
    return unless root._intrinsicQuery?
    
    prop = root._prop

    # intrinsic measurements
    if root._checkInstrinsics      
      if prop.indexOf("intrinsic-") is 0
        # closure for inner `register` callback vars
        root._intrinsicQuery.lastAddedIds.forEach (id) =>          
          gid = "$" + id
          if !@intrinsicRegistersById[gid] then @intrinsicRegistersById[gid] = {}              
          # only register intrinsic prop once per id          
          if !@intrinsicRegistersById[gid][prop]
            elProp = prop.split("intrinsic-")[1]
            k = "#{gid}[#{prop}]"
            register = () ->
              val = @engine.measureByGssId(id, elProp)              
              # don't spawn intrinsic if val is unchanged
              if @engine.vars[k] isnt val                
                @engine.registerCommand ['suggest', ['get', k], ['number', val], 'required']              
                #@engine.registerCommand ['stay', ['get', "#{gid}[#{prop}]"]]

            @intrinsicRegistersById[gid][prop] = register
            register.call @
    @
  
  
  # Command Spawning
  # ------------------------------------------------
  
  registerSpawn: (node) ->
    if !node.isQueryBound
      # just pass root through
      @engine.registerCommand node
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
      if node.isContextBound        
        for context_id in node.parentRule.getContextQuery().lastAddedIds
          @_spawnCommandFromBase node, context_id
      else
        @_spawnCommandFromBase node
    
    # generate intrinsic commands
    ### TODO
    @spawnMeasurements node
    @
    ###
                            
  _spawnCommandFromBase: (command, contextId) ->
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
               
    if hasPlural      
      for j in [0...pluralLength]
        pluralCommand = []
        for part, i in newCommand
          if pluralPartLookup[i]
            pluralCommand.push pluralPartLookup[i][j]
          else
            pluralCommand.push part
        commands.push pluralCommand
      return @engine.registerCommands commands        
    else
      return @engine.registerCommand newCommand
    

  
  # Variable Commands
  # ------------------------------------------------
  
  'get': (root, varId, tracker) =>
    command = ['get', varId]
    if tracker 
      command.push tracker
    return command
  
  
  'get$':(root, prop, query) =>        
            
    # TODO: cache returned objects by prop & selector
    
    # window  
    if query is 'window'
      @bindToWindow prop
      return ['get',"::window[#{prop}]"] 
    
    # scope
    if query.isScopeBound
      @bindToScope prop
    
    # 
    selector = query.selector
    isMulti = query.isMulti
    isContextBound = query.isContextBound
    
    # intrinsics
    # TODO: should be called only once
    if prop.indexOf("intrinsic-") is 0
      query.lastAddedIds.forEach (id) =>
        gid = "$" + id
        if !@intrinsicRegistersById[gid] then @intrinsicRegistersById[gid] = {}              
        # only register intrinsic prop once per id          
        if !@intrinsicRegistersById[gid][prop]
          elProp = prop.split("intrinsic-")[1]
          k = "#{gid}[#{prop}]"
          register = () ->
            val = @engine.measureByGssId(id, elProp)              
            # don't spawn intrinsic if val is unchanged
            if @engine.vars[k] isnt val                
              @engine.registerCommand ['suggest', ['get$', prop, gid, selector], ['number', val], 'required']              
              #@engine.registerCommand ['stay', ['get', "#{gid}[#{prop}]"]]

          @intrinsicRegistersById[gid][prop] = register
          register.call @    
        
    if isContextBound
      return {
        isQueryBound: true
        isPlural: false
        query: query      
        spawn: (id) ->
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

  'plus': (root, e1, e2) ->
    return ['plus', e1, e2]

  'minus' : (root, e1,e2) ->
    return ['minus', e1, e2]

  'multiply': (root, e1,e2) ->
    return ['multiply', e1, e2]

  'divide': (root, e1,e2,s,w) ->
    return ['divide', e1, e2]


  # Constraint Commands
  # ------------------------------------------------

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
    
  # Chains
  # ------------------------------------------------
  
  'chain': (root,query,bridgessssss) =>    
    args = [arguments...]
    bridges = [args[2...args.length]...]
    engine = @engine
    for bridge in bridges
      bridge.call(engine,query,engine)
    query.on 'afterChange', () ->
      for bridge in bridges
        bridge.call(engine,query,engine)
    
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
    return (query,e) ->
      
      # refresh when query changes 
      e.remove tracker            
      
      # add constraints to each element
      query.forEach (el) ->
        nextEl = query.next(el)
        return unless nextEl        
        e1 = _e_for_chain( el,     head, query, tracker, el, nextEl)
        e2 = _e_for_chain( nextEl, tail, query, tracker, el, nextEl)
        e[op] e1, e2, s, w
  
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
  
  'for-each': (root,query,callback) =>
    for el in query.nodeList
      callback.call(@engine, el, query, @engine)
    query.on 'afterChange', () ->
      for el in query.nodeList
        callback.call(@engine, el, query)
  
  'for-all': (root,query,callback) =>
    callback.call(@engine, query, @engine)
    query.on 'afterChange', () =>
      callback.call(@engine, query, @engine)
    
  'js': (root,js) =>
    eval "var callback =" + js
    return callback

  'strength': (root,s) =>
    return ['strength', s]

  # Selector Commands
  # ------------------------------------------------

  # mutli
  '$class': (root,sel) =>
    query = @engine.registerDomQuery selector:"."+sel, isMulti:true, isLive:false, createNodeList:() =>
      #return @engine.queryScope.querySelectorAll("."+sel)
      return @engine.queryScope.getElementsByClassName(sel)
    bindRoot root, query
    return query

  # mutli
  '$tag': (root,sel) =>
    query = @engine.registerDomQuery selector:sel, isMulti:true, isLive:false, createNodeList:() =>
      return @engine.queryScope.getElementsByTagName(sel)
    bindRoot root, query
    return query

  # singular
  '$reserved': (root, sel) =>
    query = null
    if sel is 'window'
      return 'window'    
      #query = @engine.registerDomQuery selector:"::"+"window", isMulti:false, isImmutable:true, ids:['$::window'], createNodeList:() =>
      #  return ""
    else if sel is '::this' or sel is 'this'
      engine = @engine
      parentRule = root.parentRule
      if !parentRule
        throw new Error "::this query requires parent rule for context"    
      query = parentRule.getContextQuery()
      query.isContextBound = true
      bindRoot root, query
      return query

    else if sel is 'scope'
      engine = @engine
      query = @engine.registerDomQuery selector:"::"+sel, isMulti:false, isLive:true, createNodeList:() ->
        return [engine.scope]
      query.isScopeBound = true       
      bindRoot root, query
      return query
    else
      throw new Error "$reserved selectors not yet handled: #{sel}"
    return query

  # singular
  '$id': (root,sel) =>
    query = @engine.registerDomQuery selector:"#"+sel, isMulti:false, isLive:false, createNodeList:() =>
      # TODO: handle scope.getElementById for web components?
      el = document.getElementById(sel)
      if el then return [el] else return []
    bindRoot root, query
    return query


module.exports = Commander
