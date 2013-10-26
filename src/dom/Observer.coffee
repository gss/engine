# Encapsulates observing DOM & knowing when to look for GSS styles

LOG = () ->
  if GSS.config.debug
    console.log "Observer", arguments...

_containersToLoad = null

styleQuery = GSS.styleQuery = new GSS.Query
  selector:"style"
  isLive: true
  isMulti: true
  createNodeList: () ->
    return document.getElementsByTagName "style"
  afterChange: () ->
    LOG "afterChange"    
    _containersToLoad = []
    if @changedLastUpdate
      for id in @lastAddedIds
        node = GSS.getById id
        if GSS.getter.isStyleNode node
          container = GSS.getter.getEngineContainerForStyleNode node
          if _containersToLoad.indexOf(container) is -1 and container
            _containersToLoad.push GSS.getter.getEngineContainerForStyleNode node
      for id in @lastRemovedIds
        node = GSS.getById id
        if GSS.getter.isStyleNode node
          container = GSS.getter.getEngineContainerForStyleNode node
          if _containersToLoad.indexOf(container) is -1 and container?.parentNode?
            _containersToLoad.push container
      #
      for container in _containersToLoad
        LOG "afterUpdate containerToLoad", container
        GSS(container).loadAndRun()
                     

# Polyfill
unless window.MutationObserver
  window.MutationObserver = window.JsMutationObserver

observer = new MutationObserver (mutations) ->
  LOG "MutationObserver"
  #LOG "observer(mutations)",mutations
  #GSS.checkAllStyleNodes()
  
  #containersToLoad = []
  
  for m in mutations
    # els removed from container
    if m.removedNodes.length > 0 # nodelist are weird?
      for node in m.removedNodes
        # destroy engines
        if node._gss_is_container
          GSS.getEngine(node).destroy()      
        ###
        # containers with removed ASTs
        if GSS.getter.isStyleNode node
          container = GSS.getter.getEngineContainerForStyleNode node
          if containersToLoad.indexOf(container) is -1 and container
            containersToLoad.push container  
        ###
        
    ###
    # els removed from container
    if m.addedNodes.length > 0 # nodelist are weird?
      for node in m.addedNodes        
        # containers with new ASTs        
        if GSS.getter.isStyleNode node
          container = GSS.getter.getEngineContainerForStyleNode node
          if containersToLoad.indexOf(container) is -1
            containersToLoad.push container

    for container in containersToLoad
      GSS(container).loadAndRun()
    ###
  # end for mutation
  styleQuery.update()

GSS.loadAndRun = () ->
  # finds all GSS style nodes and runs their engines
  containersToLoad = []
  for node in GSS.getter.getAllStyleNodes()
    if GSS.getter.isStyleNode node
      container = GSS.getter.getEngineContainerForStyleNode node
      if containersToLoad.indexOf(container) is -1
        containersToLoad.push container
  for container in containersToLoad
    GSS(container).loadAndRun()

# read all styles when shit is ready
document.addEventListener "DOMContentLoaded", (e) ->
  LOG "DOMContentLoaded"
  # The event "DOMContentLoaded" will be fired when the document has been parsed completely, that is without stylesheets* and additional images. If you need to wait for images and stylesheets, use "load" instead.
  observer.observe(document, {subtree: true, childList: true, attributes: false, characterData: false})
  #GSS.loadAndRun()
  styleQuery.update()
  



module.exports = observer