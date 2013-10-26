# Encapsulates Dom Queries used in GSS rules

arrayAddsRemoves = (old, neu) ->
  adds = []
  removes = []
  for n in neu
    if old.indexOf(n) is -1
      adds.push n
  for o in old
    if neu.indexOf(o) is -1
      removes.push o
  return {adds:adds,removes:removes}

LOG = () ->
  if GSS.config.debug
    console.log "Query::", arguments...

class Query
  
  isQuery: true
    
  constructor: (o={}) ->    
    @selector = o.selector or throw new Error "GssQuery must have a selector"
    @createNodeList = o.createNodeList or throw new Error "GssQuery must implement createNodeList()"
    @afterChange = o.afterChange or null
    @isMulti = o.isMulti or false
    @isLive = o.isLive or false # needs to recall createNodeList?
    #@isReserved = o.isReserved or false
    #@isImmutable = o.isImmutable or true
    @ids = o.ids or []
    @lastAddedIds = []
    @lastRemovedIds = []
    LOG "constructor() @", @
    #@lastLocalRemovedIds = []
    #@update() # have to manuall call update
    @
  
  _updated_once: false
  
  changedLastUpdate: false
  
  update: () ->
    LOG "update() @", @
    if @is_destroyed then throw new Error "Can't update destroyed query: #{selector}"
    @changedLastUpdate = false    
    if !@isLive or !@_updated_once          
      @nodeList = @createNodeList()
      @_updated_once = true
    oldIds = @ids
    newIds = []
    for el in @nodeList
      id = GSS.setupId(el)
      if id
        newIds.push(id)
    {adds,removes} = arrayAddsRemoves oldIds, newIds
    if adds.length > 0
      @changedLastUpdate = true
    @lastAddedIds = adds
    if removes.length > 0
      @changedLastUpdate = true
    @lastRemovedIds = removes
    @ids = newIds
    if @changedLastUpdate
      if @afterChange then @afterChange.call @
    @
  
  is_destroyed: false
  
  destroy: () ->
    @is_destroyed       = true
    @ids                = null
    @lastAddedIds       = null
    @lastRemovedIds     = null
    @createNodeList     = null
    @nodeList           = null
    @changedLastUpdate  = null    
    

module.exports = Query
