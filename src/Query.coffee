arrayAddsRemoves = (old, neu, removesFromContainer) ->
  adds = []
  removes = []
  for n in neu
    if old.indexOf(n) is -1
      adds.push n
  for o in old
    if neu.indexOf(o) is -1
      # don't include in removes if already in removesFromContainer
      if removesFromContainer?.indexOf?(o) isnt -1
        removes.push o
  return {adds:adds,removes:removes}

class Query  
  
  isQuery: true
    
  constructor: (o={}) ->    
    @selector = o.selector or throw new Error "GssQuery must have a selector"
    @createNodeList = o.createNodeList or throw new Error "GssQuery must implement createNodeList()"
    @isMulti = o.isMulti or false
    @isLive = o.isLive or false
    @ids = []
    @lastAddedIds = []
    @lastRemovedIds = []
    @lastLocalRemovedIds = []
    @update()
    @
  
  _updated_once: false
  
  changedLastUpdate: false
  
  update: () ->
    @changedLastUpdate = false
    if !@isLive or !@_updated_once
      @nodeList = @createNodeList()
    oldIds = @ids
    newIds = []
    for el in @nodeList
      id = GSS.setupId(el)
      newIds.push(id)
    {adds,removes} = arrayAddsRemoves oldIds, newIds
    if adds.length > 0
      @changedLastUpdate = true
      @lastAddedIds = adds
    if removes.length > 0
      @changedLastUpdate = true
      @lastRemovedIds = removes
    @ids = newIds
    @
    

module.exports = Query