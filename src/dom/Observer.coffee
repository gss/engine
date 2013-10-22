# Encapsulates observing DOM & knowing when to look for GSS styles

# Polyfill
unless window.MutationObserver
  window.MutationObserver = window.JsMutationObserver

observer = new MutationObserver (mutations) ->
  #console.log "mutations: ", mutations
  #GSS.checkAllStyleNodes()
  
  containersToLoad = []
  
  for m in mutations
    # els removed from container
    if m.removedNodes.length > 0 # nodelist are weird?
      for node in m.removedNodes
        # destroy engines
        if node._gss_is_container
          GSS.getEngine(node).destroy()      
        # containers with removed ASTs
        if GSS.getter.hasAST node
          container = GSS.getter.getEngineForStyleNode node
          if containersToLoad.indexOf(container) is -1 and container
            containersToLoad.push container  
        
        
    # els removed from container
    if m.addedNodes.length > 0 # nodelist are weird?
      for node in m.addedNodes
        # containers with new ASTs
        if GSS.getter.hasAST node
          container = GSS.getter.getEngineForStyleNode node
          if containersToLoad.indexOf(container) is -1
            containersToLoad.push container
    
    for container in containersToLoad
      console.log container
      GSS(container).loadAndRun()

# read all styles when shit is ready
document.addEventListener "DOMContentLoaded", (e) ->
  # The event "DOMContentLoaded" will be fired when the document has been parsed completely, that is without stylesheets* and additional images. If you need to wait for images and stylesheets, use "load" instead.
  observer.observe(document, {subtree: true, childList: true, attributes: false, characterData: false})
  GSS.loadAndRun()

module.exports = observer