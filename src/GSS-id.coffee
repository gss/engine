if window.GSS then GSS = window.GSS else GSS = {}

GSS._id_counter = 1

GSS._byIdCache = []

GSS._ids_killed = (ids) ->
  for id in ids
    delete GSS._byIdCache[id]

GSS.getById = (id) ->
  if GSS._byIdCache[id] then return GSS._byIdCache[id]  
  el = document.querySelector '[data-gss-id="' + id + '"]'
  # returns null if none found
  # store in cache if found?
  #if el then GSS._byIdCache[id] = el
  return el

GSS.setupId = (el) ->
  gid = el.getAttribute('data-gss-id')
  if !gid?
    gid = GSS._id_counter++
    el.setAttribute('data-gss-id', gid)
  GSS._byIdCache[gid] = el
  return gid

GSS.getId = (el) ->
  if el.getAttribute then return el.getAttribute('data-gss-id')
  return null
  
if !window.GSS then window.GSS = GSS
