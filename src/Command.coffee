###

Root commands, if bound to a dom query, will spawn commands
to match live results of query.

###

# `var` & `varexp` cache binds for `get`
bindCache = {}

checkCache = (root,cacheKey) ->
  binds = bindCache[cacheKey]
  if binds?
    for bind in binds
      bindRoot root, bind

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

        
getSuggestValueCommand = (gssId, prop, val) ->
  return ['suggest', ['get', "$#{gssId}[#{prop}]"], ['number', val]]

checkIntrinsics = (root, engine, varId, prop, query) ->
  # TODO
  # - Respawn by observing query.lastAddedIds
  # - dedup when el matches mult selectors with intrinsics
  if query? # only if bound to dom query
    if prop.indexOf("intrinsic-") is 0
      for id in query.lastAddedIds
        val = engine.measureByGssId(id, prop.split("intrinsic-")[1])
        engine.registerCommand getSuggestValueCommand id, prop, val

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
    y[y.length-2] += "%%"
    templ = "%%" + y.join("[")
    _templateVarIdCache[varId] = templ
  return templ

# transforms & generates needed commands for engine
class Command
  
  constructor: (engine) ->
    @spawnableRoots = []
    @boundWindowProps = []
    @engine = engine
  
  execute: (commands) ->
    for command in commands
      @_execute command, command
  
  _execute: (command, root) => # Not DRY, see Thread.coffee, design pattern WIP
    node = command
    func = @[node[0]]
    if !func?
      throw new Error("Engine Commands broke, couldn't find method: #{node[0]}")
    #recursive excution
    for sub, i in node[1..node.length]
      if sub instanceof Array # then recurse
        node.splice i+1,1,@_execute sub, root

    #console.log node[0...node.length]
    return func.call @engine, root, node[1...node.length]...
  
  teardown: ->
    if !@_bound_to_window_resize
      window.removeEventListener("resize", @spawnForWindowSize, false)
  
  _bound_to_window_resize: false
  
  spawnForWindowWidth: () ->    
    @engine.registerCommand ['suggest', ['get', "::window[width]"], ['number', window.outerWidth]]
  
  spawnForWindowHeight: () ->    
    @engine.registerCommand ['suggest', ['get', "::window[height]"], ['number', window.outerHeight]]
  
  spawnForWindowSize: () ->
    if @_bound_to_window_resize
      if @boundWindowProps.indexOf('width') isnt -1 then @spawnForWindowWidth()
      if @boundWindowProps.indexOf('height') isnt -1 then @spawnForWindowHeight()
      
  bindToWindow: (prop) ->
    if @boundWindowProps.indexOf(prop) is -1
      @boundWindowProps.push prop
    if prop is 'width' or prop is 'height'
      if prop is 'width' then @spawnForWindowWidth() else @spawnForWindowHeight()      
      if !@_bound_to_window_resize
        window.addEventListener("resize", @spawnForWindowSize, false)      
        @_bound_to_window_resize = true
    else if prop is 'x' 
      @engine.registerCommand ['eq', ['get', '::window[x]'], ['number', 0], 'required']
    else if prop is 'y' 
      @engine.registerCommand ['eq', ['get', '::window[y]'], ['number', 0], 'required']
    #else
    #  throw new Error "Not sure how to bind to window prop: #{prop}"    
  
  registerSpawn: (root, varid, prop, intrinsicQuery, checkInstrinsics) ->
    if !root._is_bound
      # just pass root through
      @engine.registerCommand root
    else    
      if varid
        bindCache[varid] = root._binds      
      root._template = JSON.stringify(root)
      root._varid = varid
      root._prop = prop
      root._checkInstrinsics = checkInstrinsics
      root._intrinsicQuery = intrinsicQuery
      @spawnableRoots.push root
      @spawn root
  
  handleAddsToSelectors: (selectorsWithAdds) ->
    for root in @spawnableRoots
      for boundSelector in root._boundSelectors
        if selectorsWithAdds.indexOf(boundSelector) isnt -1
          @spawn root
          break
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
    # only if bound to dom query
    if root._checkInstrinsics and root._intrinsicQuery?
      prop = root._prop
      if prop.indexOf("intrinsic-") is 0
        for id in root._intrinsicQuery.lastAddedIds
          val = @engine.measureByGssId(id, prop.split("intrinsic-")[1])
          @engine.registerCommand getSuggestValueCommand id, prop, val
    
      
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
    if query is 'window'
      @bindToWindow prop
      query = null
    #checkIntrinsics(self, @engine, varId, prop, query)

  'varexp': (self, varId, expression, zzz) =>
    # clean all but first three
    self.splice(3,10)
    # mark for gssId replacement
    self[1] = makeTemplateFromVarId varId
    @registerSpawn(self, varId)

  'get': (root, varId) =>
    checkCache root, varId
    return ['get', makeTemplateFromVarId(varId)]

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

  'strength': (root,s) =>
    return ['strength', s]

  # Selector Commands
  # ------------------------

  # mutli
  '$class': (root,sel) =>
    query = @engine.registerDomQuery selector:"."+sel, isMulti:true, isLive:true, createNodeList:() =>
      return @engine.container.getElementsByClassName(sel)
    bindRoot root, query
    return query

  # mutli
  '$tag': (root,sel) =>
    query = @engine.registerDomQuery selector:sel, isMulti:true, isLive:true, createNodeList:() =>
      return @engine.container.getElementsByTagName(sel)
    bindRoot root, query
    return query

  # singular
  '$reserved': (root, sel) =>
    query = null
    if sel is 'window'
      return 'window'
      #query = @engine.registerDomQuery selector:"::"+"window", isMulti:false, isImmutable:true, ids:['$::window'], createNodeList:() =>
      #  return ""
    else
      throw new Error "$reserved selectors not yet handled: #{sel}"
    return query

  # singular
  '$id': (root,sel) =>
    query = @engine.registerDomQuery selector:"#"+sel, isMulti:false, isLive:false, createNodeList:() =>
      # TODO: handle container.getElementById for web components?
      el = document.getElementById(sel)
      return [el]
    bindRoot root, query
    return query


module.exports = Command
