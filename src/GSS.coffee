require "customevent-polyfill"
require "cassowary"

if window.GSS then throw new Error "Only one GSS object per window"

# GSS
# =================================================

GSS = window.GSS = (o) ->
  
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

# Config
# ------------------------------------------------

GSS.config = 
  defaultStrength: 'weak'
  defaultWeight: 0
  verticalScroll: true
  horizontalScroll: false
  resizeDebounce: 32 # ~ 30 fps
  defaultMatrixType: 'mat4' # 'mat2d'
  observe: true
  observerOptions: {subtree: true, childList: true, attributes: true, characterData: true}
  debug: false
  warn: false
  perf: false  
  fractionalPixels: true
  readyClass: true
  processBeforeSet: null # function  
  maxDisplayRecursionDepth: 30
  useWorker: !!window.Worker
  worker: '../dist/worker.js'
  # not being used correctly:
  useOffsetParent: true


# overwrite config if provided
if GSS_CONFIG?  
  for key, val of GSS_CONFIG
    GSS.config[key] = val
    
# Debuging
# ------------------------------------------------
  
GSS.deblog = () ->
  if GSS.config.debug then console.log(arguments...)  

GSS.warn = () ->
  if GSS.config.warn then console.warn(arguments...)  
  
LOG_PASS = (pass, bg="green") ->
  GSS.deblog "%c#{pass}", "color:white; padding:2px; font-size:14px; background:#{bg};"
    
TIME = () ->
  if GSS.config.perf
    console.time arguments...
    
TIME_END = () ->
  if GSS.config.perf
    console.timeEnd arguments...

# Modules
# ------------------------------------------------

GSS._             = require("./_.js")
GSS.glMatrix      = require '../vendor/gl-matrix'
GSS.EventTrigger  = require("./EventTrigger.js")
GSS.Getter        = require("./dom/Getter.js")
GSS.Commander     = require("./Commander.js")
GSS.Query         = require("./dom/Query.js")
GSS.Thread        = require("./Thread.js")
GSS.Engine        = require("./Engine.js")
GSS.View          = require("./dom/View.js")
GSS.Rule          = require("./gssom/Rule.js")

require("./gssom/StyleSheet.js")

for key, val of require("./dom/IdMixin.js")
  if GSS[key] then throw new Error "IdMixin key clash: #{key}"
  GSS[key] = val

GSS.EventTrigger.make(GSS)

GSS.get = new GSS.Getter()

GSS.observer = require("./dom/Observer.js")


# Runtime
# ------------------------------------------------

GSS.boot = () ->  
  GSS.body = document.body or GSS.getElementsByTagName('body')[0]
  GSS.html = html = GSS.body.parentNode
  
  # setup root engine
  GSS({scope:GSS.Getter.getRootScope(), is_root:true})
  
  # GSS object is ready for action
  document.dispatchEvent new CustomEvent 'GSS', {detail:GSS, bubbles:false, cancelable: false}
  
  GSS.setupObserver()    
  GSS.update()
  GSS.observe()
  GSS.trigger "afterLoaded"




# Update pass
# ------------------------------------------------
#
# - stylesheet commands get installed into engines
# - triggered automatically when engine registers new styleSheet
# - Asynchronously top down through engine hierarchy

GSS.update = () ->
  GSS.styleSheets.find()
  # synchronously trigger passes to speed up initial passes
  GSS.updateIfNeeded()
  GSS.layoutIfNeeded()

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
# ------------------------------------------------
#
# - solvers compute values
# - triggered automatically when engine registers new command
# - Synchronously top down through engine hierarchy
#
# once solved, an engine will immediedately display it's results, 
# top down: from the engine scope's view downward
#
# TODO: 
# - when an engine has depenedence on a parent one, asynchronously
#   wait for parent engine to solve before solving...


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
# ------------------------------------------------
#
# - write computed values to dom
# - top down through view hierarchy
###
GSS.needsDisplay = false

GSS.setNeedsDisplay = (bool) ->
  if bool
    if !GSS.needsDisplay
      GSS._.defer GSS.displayIfNeeded
    GSS.needsDisplay = true        
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
###


