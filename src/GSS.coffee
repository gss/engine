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
    return new GSS.Engine({container:o})
    
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

# Config

GSS.config = 
  resizeDebounce: 100


# Engines

GSS.getEngine = (el) ->
  return GSS.engines.byId[@getId(el)]


# IDs

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


# Utils

GSS._ = {}

getTime = Date.now or ->
  return new Date().getTime()

# Returns a function, that, as long as it continues to be invoked, will not
# be triggered. The function will be called after it stops being called for
# N milliseconds. If `immediate` is passed, trigger the function on the
# leading edge, instead of the trailing.
GSS._.debounce = (func, wait, immediate) ->
  timeout = undefined
  args = undefined
  context = undefined
  timestamp = undefined
  result = undefined
  ->
    context = this
    args = [arguments...]
    timestamp = getTime()
    later = ->
      last = getTime() - timestamp
      if last < wait
        timeout = setTimeout(later, wait - last)
      else
        timeout = null
        result = func.apply(context, args)  unless immediate

    callNow = immediate and not timeout
    timeout = setTimeout(later, wait)  unless timeout
    result = func.apply(context, args)  if callNow
    result

# Requires

window.GSS = GSS
GSS.Getter = require("./dom/Getter.js")
GSS.observer = require("./dom/Observer.js")
GSS.Commander = require("./Commander.js")
GSS.Query = require("./dom/Query.js")
GSS.Setter = require("./dom/Setter.js")
GSS.Engine = require("./Engine.js")

GSS.getter = new GSS.Getter()
getter = GSS.getter