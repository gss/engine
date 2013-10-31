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
  
  parentEngineWithVarId: (key) ->
    parentEngine = @engine.parentEngine
    while parentEngine
      if parentEngine.varKeys.indexOf(key) > -1
        return parentEngine
      parentEngine = parentEngine.parentEngine
    return null
  
  spawnForScope: (prop) ->  
    key = "$"+GSS.getId(@engine.scope)+"[#{prop}]"
    framingEngine = @parentEngineWithVarId key      
    if framingEngine      
      val = framingEngine.vars[key]
      if val        
        @engine.registerCommand ['suggest', ['get', key], ['number', val], 'required']
      @engine.beforeLayout = =>
        val = framingEngine.vars[key]
        @engine.registerCommand ['suggest', ['get', key], ['number', val], 'required']      
      #framingEngine.scope.addEventListener "solved", =>
      #  console.log "framingEngine.scope.addEventListener _____=++++   #{framingEngine.vars[key]}"
      #  val = framingEngine.vars[key]
      #  @engine.registerCommand ['suggest', ['get', key], ['number', val], 'required']
      
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
  
  handleInvalidMeasures: (invalidMeasures) ->
    if (invalidMeasures.length < 1) then return @
    for id in invalidMeasures
      registersByProp = @intrinsicRegistersById[id]
      if registersByProp
        for prop,register of registersByProp
          register.call @
    @
    
  
  
  spawnIntrinsicSuggests: (root) =>
    # only if bound to dom query
    if root._checkInstrinsics and root._intrinsicQuery?
      prop = root._prop
      if prop.indexOf("intrinsic-") is 0
        # closure for inner `register` callback vars
        root._intrinsicQuery.lastAddedIds.forEach (id) =>          
          gid = "$" + id
          if !@intrinsicRegistersById[gid] then @intrinsicRegistersById[gid] = {}              
          # only register intrinsic prop once per id          
          if !@intrinsicRegistersById[gid][prop]
            register = () ->
              val = @engine.measureByGssId(id, prop.split("intrinsic-")[1])        
              # TODO(D4): make required suggestions work      
              @engine.registerCommand ['suggest', ['get', "#{gid}[#{prop}]"], ['number', val], 'required']              
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
      if q.lastAddedIds.length < 0
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
    @spawnIntrinsicSuggests root


  # Variable Commands
  # ------------------------

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

  # Constraints Commands
  # ------------------------

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
      

  'strength': (root,s) =>
    return ['strength', s]

  # Selector Commands
  # ------------------------

  # mutli
  '$class': (root,sel) =>
    query = @engine.registerDomQuery selector:"."+sel, isMulti:true, isLive:true, createNodeList:() =>
      return @engine.queryScope.getElementsByClassName(sel)
    bindRoot root, query
    return query

  # mutli
  '$tag': (root,sel) =>
    query = @engine.registerDomQuery selector:sel, isMulti:true, isLive:true, createNodeList:() =>
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
      return [el]
    bindRoot root, query
    return query


module.exports = Commander
