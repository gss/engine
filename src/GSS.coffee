# Polyfills
require("customevent-polyfill")

unless window.MutationObserver
  window.MutationObserver = window.JsMutationObserver

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

# overwrite config if provided
if GSS_CONFIG?
  for key, val of GSS_CONFIG
    GSS.config[key] = val
    

# Requires

window.GSS = GSS
GSS._ = require("./_.js")
GSS.workerURL = require("./WorkerBlobUrl.js")
GSS.Getter = require("./dom/Getter.js")
GSS.Commander = require("./Commander.js")
GSS.Query = require("./dom/Query.js")
GSS.Setter = require("./dom/Setter.js")
GSS.Engine = require("./Engine.js")

# ID stuff

for key, val of require("./dom/IdMixin.js")
  if GSS[key] then throw new Error "IdMixin key clash: #{key}"
  GSS[key] = val

# 

GSS.getter = new GSS.Getter()
getter = GSS.getter
GSS.get = GSS.getter

GSS.observer = require("./dom/Observer.js")


# Layout run time

GSS.boot = () ->
  # setup root engine
  GSS({scope:GSS.Getter.getRootScope(), is_root:true})

GSS.update = () ->

GSS.updateEngines = () ->