# Polyfills
require("customevent-polyfill")
unless window.MutationObserver
  window.MutationObserver = window.JsMutationObserver

if window.GSS then throw new Error "Only one GSS object per window"

GSS = (o) ->
  
  # if dom element, return engine
  if o.tagName
    engine = GSS.getEngine(o)
    if engine then return engine
    return new Engine({container:o})
    
  # if object, create new engine
  else if o isnt null and typeof o is 'object'
    
    # does engine exist for this container?
    if o.container
      engine = GSS.getEngine(o.container)      
      if engine 
        engine.boot o
        return engine      
  
    # return new engine for chaining
    return new Engine(o)
    
  else
    throw new Error ""

GSS.worker = '../browser/gss-engine/worker/gss-solver.js'

GSS.loadAndRun = (container = document) ->
  # finds all GSS style nodes and runs their engines
  containersToLoad = []
  for node in GSS.getter.getAllStyleNodes()
    if GSS.getter.hasAST node
      container = GSS.getter.getEngineForStyleNode node
      if containersToLoad.indexOf(container) is -1
        containersToLoad.push container
  for container in containersToLoad
    GSS(container).loadAndRun()


# marshal in plugin

#if window.GSS?
#  for key,val of window.GSS
#    GSS[key] = val

window.GSS = GSS
GSS.Getter = require("./dom/Getter.js")
GSS.observer = require("./dom/Observer.js")
GSS.Commander = require("./Commander.js")
GSS.Query = require("./dom/Query.js")
GSS.Setter = require("./dom/Setter.js")
GSS.Engine = require("./Engine.js")

GSS.getter = new GSS.Getter()
getter = GSS.getter

# engines

GSS.getEngine = (el) ->
  return GSS.engines.byId[@getId(el)]

# ids

GSS._id_counter = 1

GSS._byIdCache = []

GSS._ids_killed = (ids) ->
  for id in ids
    delete GSS._byIdCache[id]

GSS.getById = (id) ->
  if GSS._byIdCache[id] then return GSS._byIdCache[id]
  # TODO: move to getter
  el = document.querySelector '[data-gss-id="' + id + '"]'
  # returns null if none found
  # store in cache if found?
  if el then GSS._byIdCache[id] = el
  return el

GSS.setupContainerId = (el) ->
  el._gss_is_container = true
  return GSS.setupId el

GSS.setupId = (el) ->
  gid = getter.getId el
  if !gid?
    gid = String(GSS._id_counter++) # b/c getAttribute returns String
    # TODO: move to setter
    el.setAttribute('data-gss-id', gid)
  GSS._byIdCache[gid] = el
  return gid

GSS.getId = (el) ->
  getter.getId el