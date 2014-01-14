
###

Encapsulates Dom Queries used in GSS rules

JSPerf debunking *big* perf gain from liveNodeLists: 

- http://jsperf.com/getelementsbyclassname-vs-queryselectorall/70
- http://jsperf.com/queryselectorall-vs-getelementsbytagname/77

###

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
  GSS.deblog "Query", arguments...

class Query extends GSS.EventTrigger
  
  isQuery: true
    
  constructor: (o={}) ->
    super 
    @selector = o.selector or throw new Error "GssQuery must have a selector"
    @createNodeList = o.createNodeList or throw new Error "GssQuery must implement createNodeList()"
    @isMulti = o.isMulti or false
    @isLive = o.isLive or false # needs to recall createNodeList?
    #@isReserved = o.isReserved or false
    #@isImmutable = o.isImmutable or true
    @ids = o.ids or []
    @lastAddedIds = []
    @lastRemovedIds = []
    LOG "constructor() @", @    
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
      @trigger 'afterChange'
    @
  
  forEach: (callback) ->
    for el in @nodeList
      callback.call @, el
      
  first: () ->
    return @nodeList[0]
  
  last: () ->
    return @nodeList[@nodeList.length-1]
  
  next: (el) ->
    return @nodeList[@indexOf(el)+1]
    
  prev: (el) ->
    return @nodeList[@indexOf(el)-1]
  
  indexOf: (el) ->
    return Array.prototype.indexOf.call(@nodeList,el)    
  
  is_destroyed: false
  
  destroy: () ->
    @offAll()
    @is_destroyed       = true
    @ids                = null
    @lastAddedIds       = null
    @lastRemovedIds     = null
    @createNodeList     = null
    @nodeList           = null
    @changedLastUpdate  = null    

module.exports = Query
