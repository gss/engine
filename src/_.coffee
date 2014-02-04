getTime = Date.now or ->
  return new Date().getTime()

#transformPrefix = Modernizr.prefixed('transform')

# from: http://blogs.msdn.com/b/ie/archive/2011/10/28/a-best-practice-for-programming-with-vendor-prefixes.aspx

tempDiv = document.createElement("div")
firstSupportedStylePrefix = (prefixedPropertyNames) ->
  for name in prefixedPropertyNames
    if (typeof tempDiv.style[name] != 'undefined')
      return name
  return null

_ = 
  
  transformPrefix: firstSupportedStylePrefix(["transform", "WebkitTransform", "MozTransform", "OTransform", "msTransform"])
  
  boxSizingPrefix: firstSupportedStylePrefix(["boxSizing", "WebkitBoxSizing", "MozBoxSizing", "OBoxSizing", "msBoxSizing"])
  
  defer: (func) ->
    setTimeout func, 1
    
  # Returns a function, that, as long as it continues to be invoked, will not
  # be triggered. The function will be called after it stops being called for
  # N milliseconds. If `immediate` is passed, trigger the function on the
  # leading edge, instead of the trailing.
  debounce: (func, wait, immediate) ->
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
  
  cloneDeep: (obj) ->
    return JSON.parse(JSON.stringify(obj))
  
  cloneObject: (obj) ->
    target = {}
    for i of obj
      if obj.hasOwnProperty(i)
        target[i] = obj[i]
    return target
      
  filterVarsForDisplay: (vars) ->
    obj = {}
    # if has intrinsic-width, don't set width
    keysToKill = []
    for key, val of vars      
      idx = key.indexOf "intrinsic-"
      if idx isnt -1
        keysToKill.push key.replace("intrinsic-","")
      else
        obj[key] = val
    for k in keysToKill
      delete obj[k]
    return obj
  
  varsByViewId: (vars) ->
    varsById = {}
    for key,val of vars
      if key[0] is "$"
        gid = key.substring(1, key.indexOf("["))
        if !varsById[gid] then varsById[gid] = {}
        prop = key.substring(key.indexOf("[")+1, key.indexOf("]"))
        varsById[gid][prop] = val
    return varsById
  
  #
  # Matix
  #
  
  mat4ToCSS: (a) ->
    return 'matrix3d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
      a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
      a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + 
      a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')'
  
  mat2dToCSS: (a) ->
    return 'matrix(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
      a[3] + ', ' + a[4] + ', ' + a[5] + ')'
      
  #
  # String
  #
  
  camelize: (s) ->
    result = s.replace /[-_\s]+(.)?/g, (match, c) ->
      (if c then c.toUpperCase() else "")
    result
  
  #
  #cleanAndSnatch = (frm, to) ->
  #  # - `to` object cleans itself & steals props from & deletes the `frm` object
  #  # - useful for keeping single object in memory for getters & setters
  #  # - FYI, getters & setters for `o.key` work after `delete o.key`
  #  for key, val of to
  #    # delete if not on `frm` object
  #    if !frm[key]?
  #      delete to[key]
  #    # snatch shared keys
  #    else      
  #      to[key] = frm[key]
  #      delete frm[key]
  #  # snatch new keys
  #  for key, val of frm    
  #    to[key] = frm[key]
  #    #delete frm[key]
  #  frm = undefined
  #  return to
  ##
  
module.exports = _
