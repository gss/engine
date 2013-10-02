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
  # TODO
  # - Respawn by observing query.ids
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
        multiSplit = queries.multi.selector
        for id in queries.multi.ids
          command = srcString.split "%%" + multiSplit + "%%"
          command = command.join "$" + id
          for splitter, joiner of replaces
            command = command.split "%%" + splitter + "%%"
            command = command.join "$" + joiner
          engine.registerCommand eval command
      else
        command = srcString
        for splitter, joiner of replaces
          command = command.split "%%" + splitter + "%%"
          command = command.join "$" + joiner
        engine.registerCommand eval command

getSuggestValueCommand = (gssId, prop, val) ->
  return ['suggestvalue', ['get', "$#{gssId}[#{prop}]"], ['number', val]]

checkIntrinsics = (root, engine, varId, prop, query) ->
  # TODO
  # - Respawn by observing query.ids
  # - dedup when el matches mult selectors with intrinsics
  if query? # only if bound to dom query
    if prop.indexOf("intrinsic-") is 0
      for id in query.ids
        val = engine.measureByGssId(id, prop.split("intrinsic-")[1])
        engine.registerCommand getSuggestValueCommand id, prop, val

#_templateVarIdCache = {}
makeTemplateFromVarId = (varId) ->
  # Ad Hoc Templating!
  #if _templateVarIdCache[varId] then return _templateVarIdCache[varId]
  templ = varId
  y = varId.split("[")
  if y[0].length > 1
    y[y.length-2] += "%%"
    templ = "%%" + y.join("[")
    #_templateVarIdCache[varId] = templ
  return templ

class Command
  constructor: (engine) ->
    @engine = engine

  # Variable Commands
  # ------------------------

  'var': (self, varId, prop, query) =>
    # clean all but first two
    self.splice(2,10)
    # mark for gssId replacement
    self[1] = makeTemplateFromVarId varId
    if self._is_bound # query?
      # add selector to end of command & tag
      # for tracking w/in Cassowary Thread
      self.push "%%" + query.selector + "%%"
    spawnCommands(self, @engine, varId)
    checkIntrinsics(self, @engine, varId, prop, query)

  'varexp': (self, varId, expression, zzz) =>
    # clean all but first three
    self.splice(3,10)
    # mark for gssId replacement
    self[1] = makeTemplateFromVarId varId
    spawnCommands(self, @engine, varId)

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
    return query

  # mutli
  '$tag': (root,sel) =>
    query = @engine.registerDomQuery sel, true, true, () =>
      return @engine.container.getElementsByTagName(sel)
    bindRoot root, query
    return query

  # singular
  '$reserved': (root,sel) =>
    return query

  # singular
  '$id': (root,sel) =>
    query = @engine.registerDomQuery "#" + sel, false, false, () =>
      # TODO: handle container.getElementById for web components?
      el = document.getElementById(sel)
      return [el]
    bindRoot root, query
    return query


module.exports = Command
