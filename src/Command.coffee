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
  if !root._binds? then root._binds = []
  if root._binds.indexOf(query) is -1
    root._binds.push query
    if query.isMulti
      if root._binds.multi
        throw new Error "Multi el queries only allowed once per statement"
      root._binds.multi = query

spawnCommands = (root, engine, cacheKey) ->
  if !root._is_bound
    # just pass root through
    engine.registerCommand root
  else
    if cacheKey
      bindCache[cacheKey] = root._binds
    queries = root._binds
    srcString = JSON.stringify root
    #
    replaces = {}
    ready = true
    for q in queries
      if q.ids.length < 0
        ready = false
        break
      if q isnt queries.multi
        replaces[q.selector] = q.ids[0] # only should be 1 el
    if ready
      if queries.multi
        multiSplit = queries.multi.selector + "["
        for id in queries.multi.ids
          command = srcString.split multiSplit
          command = command.join "$" + id + "["
          for splitter, joiner of replaces
            command = command.split splitter + "["
            command = command.join "$" + joiner + "["
          engine.registerCommand eval command
      else
        command = srcString
        for splitter, joiner of replaces
          command = command.split splitter + "["
          command = command.join "$" + joiner + "["
        engine.registerCommand eval command
        

class Command
  constructor: (engine) ->
    @engine = engine
  
  # Variable Commands
  # ------------------------
  
  'var': (self, varId, prop, zzz) =>
    self.splice(2,10) # clean all but first two
    spawnCommands(self, @engine, varId)
  
  'varexp': (self, varId, expression, zzz) =>
    self.splice(3,10) # clean all but first three
    spawnCommands(self, @engine, varId)
    
  'get': (root, varId) =>
    checkCache root, varId
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
    
  'eq': (self,e1,e2,s,w) =>
    spawnCommands(self, @engine)
  
  'lte': (self,e1,e2,s,w) =>
    spawnCommands(self, @engine)
  
  'gte': (self,e1,e2,s,w) =>
    spawnCommands(self, @engine)
  
  'lt': (self,e1,e2,s,w) =>
    spawnCommands(self, @engine)
  
  'gt': (self,e1,e2,s,w) =>
    spawnCommands(self, @engine)
  
  'stay': (self) =>
    spawnCommands(self, @engine)
    
  'strength': (root,s) =>
    return ['strength', s]
  
  # Selector Commands
  # ------------------------
  
  # mutli
  '$class': (root,sel) =>
    query = @engine.registerDomQuery "." + sel, true, true, () =>
      return @engine.container.getElementsByClassName(sel)
    bindRoot root, query
    return null
  
  # mutli
  '$tag': (root,sel) =>
    query = @engine.registerDomQuery sel, true, true, () =>
      return @engine.container.getElementsByTagName(sel)
    bindRoot root, query
    return null
  
  # singular
  '$reserved': (root,sel) =>
    return null
  
  # singular
  '$id': (root,sel) =>
    query = @engine.registerDomQuery "#" + sel, false, false, () =>
      # TODO: handle container.getElementById for web components?
      el = document.getElementById(sel)
      return [el]
    bindRoot root, query
    return null


module.exports = Command
