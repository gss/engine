###

Root commands, if bound to a dom query, will spawn commands
to match live results of query.

###

bindRoot = (root, query) ->
  root._is_bound = true
  if !root._binds?
    root._binds = []
    root._boundSelectors = []
  if root._binds.indexOf(query) is -1
    root._binds.push query
    root._boundSelectors.push query.selector
    if query.isMulti
      if root._binds.multi
        throw new Error "Multi el queries only allowed once per statement"
      root._binds.multi = query

cloneBinds = (from, to) ->
  if from._is_bound = true
    for query in from._binds
      bindRoot to, query
  return to

# - preload cache for pass-throughs
# - global cache, kinda dangerous?
# TODO:
# - replace with smarter parser
_templateVarIdCache = {
  "::window[width]":"::window[width]"
  "::window[height]":"::window[height]"
  "::window[x]":"::window[x]"
  "::window[y]":"::window[y]"
  "::window[center-x]":"::window[center-x]"
  "::window[center-y]":"::window[center-y]"
}
window._templateVarIdCache = _templateVarIdCache

makeTemplateFromVarId = (varId) ->
  # Ad Hoc Templating!
  if _templateVarIdCache[varId] then return _templateVarIdCache[varId]
  #if varId.indexOf("::window") is 0 then return varId
  #
  templ = varId
  y = varId.split("[")
  if y[0].length > 1
    # template just the last []'s, to protect prop selectors
    y[y.length-2] += "%%"
    templ = "%%" + y.join("[")
    _templateVarIdCache[varId] = templ
  return templ


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
  
  # `var` & `varexp` cache binds for `get`
  _checkCache: (root,cacheKey) =>
    binds = @bindCache[cacheKey]
    if binds?
      for bind in binds
        bindRoot root, bind

  execute: (commands) ->
    for command in commands
      @_execute command, command

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

  registerSpawn: (root, varid, prop, intrinsicQuery, checkInstrinsics) ->    
    if !root._is_bound
      # just pass root through
      @engine.registerCommand root
    else
      if varid
        @bindCache[varid] = root._binds
      root._template = JSON.stringify(root)
      root._varid = varid
      root._prop = prop
      if checkInstrinsics
        root._checkInstrinsics = checkInstrinsics
        root._intrinsicQuery = intrinsicQuery
      @spawnableRoots.push root
      @spawn root

  handleRemoves: (removes) ->
    if (removes.length < 1) then return @    
    @engine.registerCommand ['remove', removes...]
    for varid in removes
      delete @intrinsicRegistersById[varid]
    @

  handleSelectorsWithAdds: (selectorsWithAdds) ->
    if (selectorsWithAdds.length < 1) then return @
    for root in @spawnableRoots
      for boundSelector in root._boundSelectors
        if selectorsWithAdds.indexOf(boundSelector) isnt -1
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

  spawn: (root) ->
    queries = root._binds
    rootString = root._template
    replaces = {}
    ready = true

    for q in queries
      if q.lastAddedIds.length <= 0
        ready = false
        break
      if q isnt queries.multi
        replaces[q.selector] = q.lastAddedIds[0] # only should be 1 el

    if ready

      # generate commands bound to plural selector
      if queries.multi
        template = rootString.split "%%" + queries.multi.selector + "%%"
        for id in queries.multi.lastAddedIds
          command = template.join "$" + id
          for splitter, joiner of replaces
            command = command.split "%%" + splitter + "%%"
            command = command.join "$" + joiner
          @engine.registerCommand eval command

      # generate command bound to singular selector
      else
        command = rootString
        for splitter, joiner of replaces
          command = command.split "%%" + splitter + "%%"
          command = command.join "$" + joiner
        @engine.registerCommand eval command        
    
    # generate intrinsic commands
    @spawnMeasurements root
    @
    

  # Variable Commands
  # ------------------------------------------------

  'var': (self, varId, prop, query) =>    
    # clean all but first two
    self.splice(2,10)
    if self._is_bound # query?
      # mark for gssId replacement
      self[1] = makeTemplateFromVarId varId
      # add selector to end of command & tag
      # for tracking w/in Cassowary Thread
      self.push "%%" + query.selector + "%%"
    @registerSpawn(self, varId, prop, query, true)
    if query
      if query is 'window'
        @bindToWindow prop
        query = null
      else if query.__is_scope
        @bindToScope prop

  'varexp': (self, varId, expression, zzz) =>
    # clean all but first three
    self.splice(3,10)
    # mark for gssId replacement
    self[1] = makeTemplateFromVarId varId
    @registerSpawn(self, varId)

  'get': (root, varId, tracker) =>
    @_checkCache root, varId
    if tracker and (tracker isnt "::window")
      return ['get', makeTemplateFromVarId(varId),tracker+"%%"+tracker+"%%"]
    else if root._is_bound
      return ['get', makeTemplateFromVarId(varId)]
    else
      return ['get', varId]

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
  
  'gte-chain': (root,head,tail) =>
    return @_chainer('gte',head,tail,s,w)
  
  'lt-chain': (root,head,tail) =>
    return @_chainer('lt',head,tail,s,w)
  
  'gt-chain': (root,head,tail) =>
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
    
    else if sel is 'this' or sel is 'scope'
      engine = @engine
      query = @engine.registerDomQuery selector:"::"+sel, isMulti:false, isLive:true, createNodeList:() ->
        return [engine.scope]
      query.__is_scope = true       
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
