# Encapsulates observing DOM & knowing when to look for GSS styles

LOG = () ->
  if GSS.config.debug
    console.log "Observer", arguments...

_scopesToLoad = null

styleQuery = GSS.styleQuery = new GSS.Query
  selector:"style"
  isLive: true
  isMulti: true
  createNodeList: () ->
    return document.getElementsByTagName "style"
  afterChange: () ->
    LOG "afterChange"    
    _scopesToLoad = []
    if @changedLastUpdate
      for id in @lastAddedIds
        node = GSS.getById id
        if GSS.get.isStyleNode node
          scope = GSS.get.scopeForStyleNode node
          if _scopesToLoad.indexOf(scope) is -1 and scope
            _scopesToLoad.push GSS.get.scopeForStyleNode node
      for id in @lastRemovedIds
        node = GSS.getById id
        if GSS.get.isStyleNode node
          scope = GSS.get.scopeForStyleNode node
          if _scopesToLoad.indexOf(scope) is -1 and scope?.parentNode?
            _scopesToLoad.push scope
      #
      for scope in _scopesToLoad
        LOG "afterUpdate scopeToLoad", scope
        GSS(scope).loadAndRun()
                     

# Polyfill
unless window.MutationObserver
  window.MutationObserver = window.JsMutationObserver

observer = new MutationObserver (mutations) ->
  LOG "MutationObserver"
  #LOG "observer(mutations)",mutations
  #GSS.checkAllStyleNodes()
  
  #scopesToLoad = []
  
  for m in mutations
    # els removed from scope
    if m.removedNodes.length > 0 # nodelist are weird?
      for node in m.removedNodes
        # destroy engines
        if node._gss_is_scope
          GSS.getEngine(node).destroy()      
        ###
        # scopes with removed ASTs
        if GSS.get.isStyleNode node
          scope = GSS.get.scopeForStyleNode node
          if scopesToLoad.indexOf(scope) is -1 and scope
            scopesToLoad.push scope  
        ###
        
    ###
    # els removed from scope
    if m.addedNodes.length > 0 # nodelist are weird?
      for node in m.addedNodes        
        # scopes with new ASTs        
        if GSS.get.isStyleNode node
          scope = GSS.get.scopeForStyleNode node
          if scopesToLoad.indexOf(scope) is -1
            scopesToLoad.push scope

    for scope in scopesToLoad
      GSS(scope).loadAndRun()
    ###
  # end for mutation
  styleQuery.update()

GSS.loadAndRun = () ->
  # finds all GSS style nodes and runs their engines
  scopesToLoad = []
  for node in GSS.get.getAllStyleNodes()
    if GSS.get.isStyleNode node
      scope = GSS.get.scopeForStyleNode node
      if scopesToLoad.indexOf(scope) is -1
        scopesToLoad.push scope
  for scope in scopesToLoad
    GSS(scope).loadAndRun()
  


# read all styles when shit is ready
document.addEventListener "DOMContentLoaded", (e) ->
  GSS.boot()
  LOG "DOMContentLoaded"
  # The event "DOMContentLoaded" will be fired when the document has been parsed completely, that is without stylesheets* and additional images. If you need to wait for images and stylesheets, use "load" instead.
  observer.observe(document, {subtree: true, childList: true, attributes: false, characterData: false})
  #GSS.loadAndRun()
  styleQuery.update()
  



module.exports = observer