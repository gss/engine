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

  setupScopeId: (el) ->
    el._gss_is_scope = true
    return @setupId el

  setupId: (el) ->
    return null unless el
    gid = @getId el
    if !gid?       
      _id =  @_id_counter++
      # default id to el.id
      gid = String(el.id or _id) # b/c el.id returns String       
      el.setAttribute('data-gss-id', gid)
      el.style['box-sizing'] = 'border-box'
      el._gss_id = gid 
      if @_byIdCache[gid]? then console.warn "element by id cache replaced gss-id: #{gid}"
    @_byIdCache[gid] = el
    return gid

  getId: (el) ->
    if el?._gss_id then return el?._gss_id
    if el?.getAttribute? then return el.getAttribute('data-gss-id')
    return null

module.exports = IdMixin