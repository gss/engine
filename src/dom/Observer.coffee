# Encapsulates observing DOM & knowing when to look for GSS styles

LOG = () ->
  GSS.deblog "Observer", arguments...                     

# Mutation Observing
# ====================================================

observer = null

GSS.is_observing = false
  
GSS.observe = () ->
  if !GSS.is_observing and GSS.config.observe
    observer.observe(document.body, GSS.config.observerOptions)
    GSS.is_observing = true

GSS.unobserve = () ->  
  observer.disconnect()
  GSS.is_observing = false

GSS._unobservedElements = _unobservedElements = []

GSS.observeElement = (el) ->
  _unobservedElements.push(el) if _unobservedElements.indexOf(el) is -1
  
GSS.unobserveElement = (el) ->
  i = _unobservedElements.indexOf(el)
  _unobservedElements.splice( i, 1 ) if i > -1

setupObserver = () ->

  # Polyfill
  unless window.MutationObserver
    if window.WebKitMutationObserver
      window.MutationObserver = window.WebKitMutationObserver
    else
      window.MutationObserver = window.JsMutationObserver

  observer = new MutationObserver (mutations) ->
    LOG "MutationObserver", mutations
    enginesToReset = []
    nodesToIgnore = []
    needsUpdateQueries = []
    invalidMeasureIds = []
    
    observableMutation = false
    
    for m in mutations
      if _unobservedElements.indexOf(m.target) isnt -1
        continue
      else
        observableMutation = true
      
      # style tag was modified then stop & reload everything
      if m.type is "characterData"
        continue unless m.target.parentElement
        sheet =  m.target.parentElement.gssStyleSheet
        if sheet
          sheet.reinstall()
          e = sheet.engine
          if enginesToReset.indexOf(e) is -1
            enginesToReset.push e
        
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
    
    # only continue if mutation should be observed
    return null if !observableMutation
    
    # sheets that should be removed b/c no longer in dom
    removed = GSS.styleSheets.findAllRemoved()
    for sheet in removed
      sheet.destroy()
      e = sheet.engine
      if enginesToReset.indexOf(e) is -1
        enginesToReset.push e
    
    # destroy engines with detached scopes
    i = 0
    engine = GSS.engines[i]
    while !!engine
      if i > 0
        if engine.scope
          # destroy engines with detached scopes
          if !document.documentElement.contains engine.scope
            engine.destroyChildren()
            engine.destroy()
      # TODO(D4): update engines with modified styles
      i++
      engine = GSS.engines[i]
    
    for e in enginesToReset
      if !e.is_destroyed    
        e.reset()
    
    for scope in needsUpdateQueries
      e = GSS.get.engine(scope)
      if e
        if !e.is_destroyed
          if enginesToReset.indexOf(e) is -1 # don't updateQueries if loading
            e.updateQueries()
    
    if invalidMeasureIds.length > 0
      for e in GSS.engines
        if !e.is_destroyed
          e.commander.handleInvalidMeasures invalidMeasureIds    
    
    enginesToReset = null
    nodesToIgnore = null
    needsUpdateQueries = null
    invalidMeasureIds = null
        
    GSS.load()
  
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
      


# On Display
# ====================================================

GSS.isDisplayed = false

GSS.onDisplay = ->
  GSS.trigger "display"
  return if GSS.isDisplayed
  GSS.isDisplayed = true
  
  # Ready Class
  # ------------------------------------------------
  if GSS.config.readyClass
    GSS.html.classList.add "gss-ready"
    GSS.html.classList.remove "gss-not-ready"


# On Document Ready
# ====================================================

# read all styles when shit is ready
document.addEventListener "DOMContentLoaded", (e) ->
  
  GSS.body = document.body or GSS.getElementsByTagName('body')[0]
  GSS.html = html = GSS.body.parentNode
  
  # GSS object is ready for action
  document.dispatchEvent new CustomEvent 'GSS', {detail:GSS, bubbles:false, cancelable: false}
  
  setupObserver()
  GSS.boot()
  LOG "DOMContentLoaded"
  # The event "DOMContentLoaded" will be fired when the document has been parsed completely, that is without stylesheets* and additional images. If you need to wait for images and stylesheets, use "load" instead.  
  #GSS.loadAndRun()
  GSS.load()
  GSS.observe()
  GSS.trigger "afterLoaded"
  



module.exports = observer
