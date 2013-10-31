# Encapsulates DOM writes

class Setter

  constructor: (@scope) ->
    @scope = document unless @scope
  
  clean: () ->
  
  destroy: () ->
    
  set: (vars) ->
    for key,val of vars
      if key[0] is "$"
        gid = key.substring(1, key.indexOf("["))
        dimension = key.substring(key.indexOf("[")+1, key.indexOf("]"))
        element = GSS.getById gid
        if element
          #element.style[dimension] = val
          @elementSet element, dimension, val
        else
          console.log "Element wasn't found"

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
    element.style.position = 'absolute'
    element.style.margin = '0px'    

  getOffsets: (element) ->
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
