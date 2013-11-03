require("customevent-polyfill")

if window.GSS then throw new Error "Only one GSS object per window"

GSS = (o) ->
  
  # if dom element, return engine
  if o is document or o is window 
    return GSS.engines.root
  if o.tagName    
    engine = GSS.get.engine(o)
    if engine then return engine
    return new GSS.Engine({scope:o})
    
  # if object, create new engine
  else if o isnt null and typeof o is 'object'
    
    # does engine exist for this scope?
    if o.scope
      engine = GSS.get.engine(o.scope)      
      if engine then return engine
  
    # return new engine for chaining
    return new GSS.Engine(o)
    
  else
    throw new Error ""

#GSS.worker = '../browser/gss-engine/worker/gss-solver.js'

# Config

GSS.config = 
  resizeDebounce: 32 # ~ 30 fps
  observe: true
  debug: false
  warn: false
  perf: false
  roundBeforeSet: false
  processBeforeSet: null # function
  useOffsetParent: true

# overwrite config if provided
if GSS_CONFIG?
  for key, val of GSS_CONFIG
    GSS.config[key] = val

# Log

#GSS.log = log = () ->
#  console?.log arguments...
  
GSS.deblog = () ->
  if GSS.config.debug then console.log(arguments...)  

GSS.warn = () ->
  if GSS.config.warn then console.warn(arguments...)  

# Requires

window.GSS = GSS
GSS._ = require("./_.js")
GSS.EventTrigger = require("./EventTrigger.js")
GSS.workerURL = require("./WorkerBlobUrl.js")
GSS.Getter = require("./dom/Getter.js")
GSS.Commander = require("./Commander.js")
GSS.Query = require("./dom/Query.js")
GSS.Setter = require("./dom/Setter.js")
GSS.Engine = require("./Engine.js")

for key, val of require("./dom/IdMixin.js")
  if GSS[key] then throw new Error "IdMixin key clash: #{key}"
  GSS[key] = val

# 

GSS.get = new GSS.Getter()

GSS.observer = require("./dom/Observer.js")

LOG_PASS = (pass, bg="green") ->
  GSS.deblog "%c#{pass}", "color:white; padding:2px; font-size:14px; background:#{bg};"
    
TIME = () ->
  if GSS.config.perf
    console.time arguments...
    
TIME_END = () ->
  if GSS.config.perf
    console.timeEnd arguments...

# Layout Runtime
# ======================

GSS.boot = () ->
  # setup root engine
  GSS({scope:GSS.Getter.getRootScope(), is_root:true})

#GSS.refresh = () ->

GSS.load = () ->
  # dirty load
  GSS.dirtyLoadEngines()
  GSS.render()
  
GSS.render = () ->
  TIME "RENDER"
  # force synchronous first two passes
  GSS.updateIfNeeded()
  GSS.layoutIfNeeded()  
  # async -> display

# Update pass
# ------------------------
#
# - updates constraint commands for engines
# - measurements
#

GSS.needsUpdate = false

GSS.setNeedsUpdate = (bool) ->
  if bool
    if !GSS.needsUpdate
      GSS._.defer GSS.updateIfNeeded
    GSS.needsUpdate = true    
  else
    GSS.needsUpdate = false

GSS.updateIfNeeded = () ->
  if GSS.needsUpdate
    LOG_PASS "Update Pass", "orange"
    TIME "update pass"
    GSS.engines.root.updateIfNeeded()
    GSS.setNeedsUpdate false
    TIME_END "update pass"
  

# Layout pass
# -------------------------
#
# - solvers solve
#

GSS.needsLayout = false

GSS.setNeedsLayout = (bool) ->  
  if bool
    if !GSS.needsLayout 
      GSS._.defer GSS.layoutIfNeeded
    GSS.needsLayout = true    
  else
    GSS.needsLayout = false
  
  
GSS.layoutIfNeeded = () ->  
  if GSS.needsLayout
    LOG_PASS "Layout Pass", "green"
    TIME "layout pass"
    GSS.engines.root.layoutIfNeeded()
    GSS.setNeedsLayout false
    TIME_END "layout pass"
  

# Display pass
# -----------------------
#
# - write to dom
#

GSS.needsDisplay = false

GSS.setNeedsDisplay = (bool) ->
  if bool
    if !GSS.needsDisplay
      GSS._.defer GSS.displayIfNeeded
    GSS.needsDisplay = true        
    #GSS.lazyDisplayIfNeeded()
  else
    GSS.needsDisplay = false

GSS.displayIfNeeded = () ->
  if GSS.needsDisplay
    LOG_PASS "Display Pass", "violet"
    TIME "display pass"
    GSS.engines.root.displayIfNeeded()
    GSS.setNeedsDisplay false
    TIME_END "display pass"
    TIME_END "RENDER"
    
#GSS.lazyDisplayIfNeeded = GSS._.debounce GSS.displayIfNeeded, 8, false # 1/2 frame (60fps)

_scopesToLoad = null

styleQuery = GSS.styleQuery = new GSS.Query
  selector:"style"
  isLive: true
  isMulti: true
  createNodeList: () ->
    return document.getElementsByTagName "style"
  afterChange: () ->
    #LOG "afterStyleChange"    
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
            if document.contains scope
              _scopesToLoad.push scope
      #
      for scope in _scopesToLoad
        engine = GSS(scope:scope) # make engine if needed
        if engine then engine.load()
        #LOG "afterUpdate scopeToLoad", scope          

GSS.dirtyLoadEngines = () ->  
  i = 0
  engine = GSS.engines[i]
  while !!engine
    if i > 0
      # destroy engines with detached scopes
      if !document.documentElement.contains engine.scope
        engine.destroyChildren()
        engine.destroy()
    # TODO(D4): update engines with modified styles
    i++
    engine = GSS.engines[i]
  # update engines with added or removed style tags
  styleQuery.update()  

