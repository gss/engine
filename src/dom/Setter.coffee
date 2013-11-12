# Encapsulates DOM writes

class Setter

  constructor: (@scope) ->
    @scope = document unless @scope
  
  clean: () ->
  
  destroy: () ->    
  
  setOLD: (vars) ->
    if GSS.config.processBeforeSet then vars = GSS.config.processBeforeSet(vars)
    vars = @cleanVarsForDisplay vars
    for key,val of vars
      if key[0] is "$"
        gid = key.substring(1, key.indexOf("["))
        dimension = key.substring(key.indexOf("[")+1, key.indexOf("]"))
        element = GSS.getById gid
        if element
          #element.style[dimension] = val
          if GSS.config.roundBeforeSet then val = Math.round(val)
          @elementSet element, dimension, val
        else
          console.log "Element wasn't found"
  
  set: (vars) ->
    if GSS.config.processBeforeSet then vars = GSS.config.processBeforeSet(vars)
    varsById = @varsByViewId @cleanVarsForDisplay vars
    # batch potential DOM reads
    for id, obj of varsById
      GSS.View.byId[id]?.setCSS?(obj)
    # batch DOM writes
    for id, obj of varsById
      GSS.View.byId[id]?.display?()
  
  varsByViewId: (vars) ->
    varsById = {}
    for key,val of vars
      if key[0] is "$"
        gid = key.substring(1, key.indexOf("["))
        if !varsById[gid] then varsById[gid] = {}
        prop = key.substring(key.indexOf("[")+1, key.indexOf("]"))
        varsById[gid][prop] = val
    return varsById
      
  cleanVarsForDisplay: (vars) ->
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

  elementSet: (element, dimension, value) ->
    offsets = null
    switch dimension
      when 'width', 'w'
        @setWidth element, value
      when 'height', 'h'
        @setHeight element, value
      when 'left', 'x'        
        @setLeft element, value
      when 'top', 'y'
        @setTop element, value
  
  makePositioned: (element) ->
    return if element._gss_posititioned
    element._gss_posititioned = true
    element.style.position = 'absolute'
    element.style.margin = '0px'

  getOffsets: (element) ->
    if !GSS.config.useOffsetParent 
      return { 
        x:0
        y:0
      }
    offsets =
      x: 0
      y: 0
    return offsets unless element.offsetParent
    element = element.offsetParent
    loop
      offsets.x += element.offsetLeft
      offsets.y += element.offsetTop
      break unless element.offsetParent
      element = element.offsetParent
    return offsets  

  setWidth: (element, value) ->
    element.style.width = "#{value}px"

  setHeight: (element, value) ->
    element.style.height = "#{value}px"

  setLeft: (element, value, offsets) ->
    @makePositioned element
    offsets = @getOffsets element
    element.style.left = "#{value - offsets.x}px"

  setTop: (element, value, offsets) ->
    @makePositioned element    
    offsets = @getOffsets element
    element.style.top = "#{value - offsets.y}px"

  ###
  setwithStyleTag: (vars) =>
    if !@_has_setVars_styleTag
      @_has_setVars_styleTag = true
      @scope.insertAdjacentHTML('afterbegin','<style data-gss-generated></style>')
      @generatedStyle = @scope.childNodes[0]
    html = ""
    for key of vars
      if key[0] is "$"
        gid = key.substring(1, key.indexOf("["))
        dimension = key.substring(key.indexOf("[")+1, key.indexOf("]"))
        html += "[data-gss-id=\"#{gid}\"]{#{dimension}:#{vars[key]}px !important;}"
    #@generatedStyle.textContent = html
    @generatedStyle.innerHTML = html
    #console.log @scope.childNodes
    #@scope.insertAdjacentHTML 'afterbegin', html
  ###

module.exports = Setter
