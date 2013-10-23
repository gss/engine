# IdMixin 
#
# - Composes its props onto the `GSS` object
# - Handles ID handling for DOM
#

IdMixin = 
  
  _id_counter: 1

  _byIdCache: []

  _ids_killed: (ids) ->
    for id in ids
      delete @_byIdCache[id]

  getById: (id) ->
    if @_byIdCache[id] then return @_byIdCache[id]
    # TODO: move to getter
    el = document.querySelector '[data-gss-id="' + id + '"]'
    # returns null if none found
    # store in cache if found?
    if el then @_byIdCache[id] = el
    return el

  setupContainerId: (el) ->
    el._gss_is_container = true
    return @setupId el

  setupId: (el) ->
    gid = @getId el
    if !gid?
      gid = String(@_id_counter++) # b/c getAttribute returns String
      # TODO: move to setter
      el.setAttribute('data-gss-id', gid)
      el.style['box-sizing'] = 'border-box'
      el._gss_id = gid
    @_byIdCache[gid] = el
    return gid

  getId: (el) ->
    if el?._gss_id then return el?._gss_id
    if el?.getAttribute? then return el.getAttribute('data-gss-id')
    return null

module.exports = IdMixin