# Encapsulates observing DOM & knowing when to look for GSS styles

LOG= () ->
  GSS.deblog "Observer", arguments...                     

observer = null

setupObserver = () ->

  # Polyfill
  unless window.MutationObserver
    if window.WebKitMutationObserver
      window.MutationObserver = window.WebKitMutationObserver
    else
      window.MutationObserver = window.JsMutationObserver

  observer = new MutationObserver (mutations) ->
    LOG "MutationObserver"
    scopesToLoad = []
    nodesToIgnore = []
    needsUpdateQueries = []
    invalidMeasureIds = []

    for m in mutations
         
      # style tag was modified then stop & reload everything
      if m.type is "characterData" 
        if GSS.get.isStyleNode(m.target.parentElement)
          scope = GSS.get.scopeForStyleNode m.target.parentElement
          if scopesToLoad.indexOf(scope) is -1
            scopesToLoad.push scope
        
      # scopes that need to updateQueries, ie update queries
      if m.type is "attributes" or m.type is "childList"
        if m.type is "attributes" and m.attributename is "data-gss-id"
          # ignore if setting up node
          # ... trusting data-gss-id is set first in setup process!
          nodesToIgnore.push m.target
        else if nodesToIgnore.indexOf(m.target) is -1
          scope = GSS.get.nearestScope m.target
          if scope
            if needsUpdateQueries.indexOf(scope) is -1        
              needsUpdateQueries.push scope
    
      gid = null
      # els that may need remeasuring      
      if m.type is "characterData" or m.type is "attributes" or m.type is "childList"      
        if m.type is "characterData"
          target = m.target.parentElement  
          gid = "$" + GSS.getId m.target.parentElement
        else if nodesToIgnore.indexOf(m.target) is -1
          gid = "$" + GSS.getId m.target
        if gid?
          if invalidMeasureIds.indexOf(gid) is -1
            invalidMeasureIds.push(gid)
  
    for scope in scopesToLoad      
      GSS.get.engine(scope).load()
    
    for scope in needsUpdateQueries
      if scopesToLoad.indexOf(scope) is -1 # don't updateQueries if loading
        GSS.get.engine(scope).updateQueries()
    
    if invalidMeasureIds.length > 0
      for engine in GSS.engines
        engine.commander.handleInvalidMeasures invalidMeasureIds
      
    scopesToLoad = null
    nodesToIgnore = null
    needsUpdateQueries = null
    invalidMeasureIds = null
  
    #LOG "observer(mutations)",mutations
    #GSS.checkAllStyleNodes()
  
    #scopesToLoad = []
    ###
    for m in mutations
      # els removed from scope
      if m.removedNodes.length > 0 # nodelist are weird?
        for node in m.removedNodes
          # destroy engines
          if node._gss_is_scope
            GSS.get.engine(node).destroy()      
        
          ## scopes with removed ASTs
          #if GSS.get.isStyleNode node
          #  scope = GSS.get.scopeForStyleNode node
          #  if scopesToLoad.indexOf(scope) is -1 and scope
          #    scopesToLoad.push scope  
          #
        
    
      ## els removed from scope
      #if m.addedNodes.length > 0 # nodelist are weird?
      #  for node in m.addedNodes        
      #    # scopes with new ASTs        
      #    if GSS.get.isStyleNode node
      #      scope = GSS.get.scopeForStyleNode node
      #      if scopesToLoad.indexOf(scope) is -1
      #        scopesToLoad.push scope
      #
      #for scope in scopesToLoad
      #  GSS(scope).load()
    ###
    
    # end for mutation
    #if GSS.observeStyleNodes
    GSS.load()  

GSS.is_observing = false
  
GSS.observe = () ->
  if !GSS.is_observing and GSS.config.observe
    observer.observe(document.body, {subtree: true, childList: true, attributes: true, characterData: true})
    GSS.is_observing = true

GSS.unobserve = () ->  
  observer.disconnect()
  GSS.is_observing = false
  
# read all styles when shit is ready
document.addEventListener "DOMContentLoaded", (e) ->
  setupObserver()
  GSS.boot()
  LOG "DOMContentLoaded"
  # The event "DOMContentLoaded" will be fired when the document has been parsed completely, that is without stylesheets* and additional images. If you need to wait for images and stylesheets, use "load" instead.  
  #GSS.loadAndRun()
  GSS.load()
  GSS.observe()
  GSS.trigger "afterLoaded"
  



module.exports = observer