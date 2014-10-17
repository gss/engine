class Debugger
  constructor: (@engine) ->

  update: () ->
    if @engine.console.level > 0
      @domains(@engine.domains)
    if @engine.console.level > 1
      @refresh()

  stylesheet: ->
    @sheet = sheet = document.createElement('style')
    sheet.textContent = sheet.innerText = """
      domains {
        display: block;
        position: fixed;
        z-index: 999999;
        top: 0;
        left: 0;
        background: rgba(255,255,255,0.76);
        font-family: Helvetica, Arial;
      }
      domain {
        -webkit-user-select: none;  /* Chrome all / Safari all */
        -moz-user-select: none;     /* Firefox all */
        -ms-user-select: none;      /* IE 10+ */

        user-select: none;     
      }
      panel strong, panel b{
        font-weight: normal;
      }
      panel em {
        color: red;
      }
      panel strong {
        color: MidnightBlue;
      }
      panel strong.virtual {
        color: green;
      }
      panel strong.intrinsic {
        color: red;
      }
      panel strong.local {
        color: black;
      }
      panel strong.position {
        color: olive;
      }
      domains domain{
        padding: 5px;
        text-align: center;
        display: inline-block;
        cursor: pointer;
      }
      domain.intrinsic {
        background: rgba(255, 0, 0, 0.3)
      }
      domain[hidden] {
        color: #666;
      }
      domain panel {
        display: block;
        position: absolute;
        background: #fff;
        text-align: left;
        white-space: pre;
        line-height: 18px;
        font-size: 13px;
        font-family: monospace, serif;
      }
      domain panel {
        display: none;
      }
      domain:hover panel {
        display: block;
      }
      ruler {
        display: block;
        position: absolute;
        z-index: 99999;
        border-width: 0;
      }
      ruler[hidden] {
        display: none;
      }
      ruler.x {
        border-bottom: 1px dotted orange;
      }
      ruler.y {
        border-right: 1px dotted orange;
      }
      ruler.width {
        border-bottom: 1px dashed blue;
      }
      ruler.height {
        border-right: 1px dashed blue;
      }
      ruler.virtual {
        border-color: green;
      }
      ruler.virtual.height {
        z-index: 99998;
      }
      body:not([inspecting]) ruler.virtual.height {
        width: 0px !important;
      }
      ruler.virtual.height:hover, body[inspecting]:not([reaching]) ruler.virtual.height {
        background: rgba(0,255,0,0.15);
      }
      ruler.constant {
        border-style: solid;
      }
      ruler.intrinsic {
        border-color: red;
      }
      ruler:before {
        content: "";
        display: block;
        position: absolute;
        right: 0;
        top: 0;
        left: 0;
        bottom: 0;
        cursor: pointer;
      }
      ruler.y:before, ruler.height:before, ruler.intrinsic-height:before {
        left: -10px;
        right: -10px;
      }
      ruler.x:before, ruler.width:before, ruler.intrinsic-width:before {
        top: -10px;
        bottom: -10px;
      }
      body[reaching] domain panel.filtered {
        display: block
      }
      body[reaching] ruler {
        opacity: 0.2
      }
      body[reaching] ruler.reached {
        opacity: 1
      }
    """
    document.body.appendChild(sheet)
    document.addEventListener 'click', @onClick
    document.addEventListener 'mousemove', @onMouseMove
    document.addEventListener 'keydown', @onKeyDown
    document.addEventListener 'keyup', @onKeyUp
  refresh: ->
    for domain in @engine.domains
      domain.distances = undefined
    values = {}
    for property, value of @engine.values
      values[property] = value
    if @updated
      for property, value of @updated?.solution
        unless value?
          values[property] = value
    ids = @ids = []
    for property, value of values
      if (bits = property.split('[')).length > 1
        if ids.indexOf(bits[0]) == -1
          ids.push(bits[0])
    for id in ids
      @draw(id, values)

  onKeyDown: (e) =>
    if e.ctrlKey || e.metaKey
      document.body.setAttribute('inspecting', 'inspecting')

  onKeyUp: (e) =>
    if document.body.getAttribute('inspecting')?
      document.body.removeAttribute('inspecting')

  onClick: (e) =>
    if e.target.tagName?.toLowerCase() == 'domain'
      unless @rulers
        @refresh()
      @filter([e.target.getAttribute('for')], e.shiftKey || e.ctrlKey, true)
      e.preventDefault()
      e.stopPropagation()
    else

      if (property = document.body.getAttribute('reaching')) && e.target.tagName?.toLowerCase() == 'ruler'
        domain = @reaching
        if domain && properties = domain.distances[property]
          props = []
          for prop, distance of properties
            unless distance
              props.push(prop)
          @constraints domain.uid, null, props
          @panel.classList.add('filtered')
      else if e.ctrlKey || e.metaKey
        
        unless @rulers
          @refresh()
        target = e.target
        ids = []
        while target
          if target.nodeType == 1
            if target._gss_id
              if @ids.indexOf(target._gss_id) > -1
                for node in document.querySelectorAll('ruler[for="' + target._gss_id + '"]')
                  d = node.getAttribute('domain')
                  if ids.indexOf(d) == -1
                    ids.push(d)
          target = target.parentNode
          
        @filter ids, e.shiftKey
      e.preventDefault()
      e.stopPropagation()

  constraints: (id, element, props) ->
    unless @panel
      @panel = document.createElement('panel')
    else
      @panel.classList.remove('filtered')
    unless element
      for el in @list.childNodes
        if el.getAttribute('for') == String(id)
          element = el
          break
      return unless element
    unless @panel.parentNode == element
      element.appendChild(@panel)

    for domain in @engine.domains
      if String(domain.uid) == String(id)

        @panel.innerHTML = domain.constraints.map (constraint) =>
          @engine.Operation.toExpressionString(constraint.operation)
        .filter (string) ->
          return true unless props
          for prop in props
            if string.indexOf(prop) > -1
              debugger
              return true
          return false
        .join('\n')


        break

  onMouseMove: (e) =>
    unless e.target._gss
      if e.target.tagName.toLowerCase() == 'domain'
        @constraints(e.target.getAttribute('for'), e.target)
      else if @panel?.parentNode
        @panel.parentNode.removeChild(@panel)
      if @reaching
        @reaching = undefined
        document.body.removeAttribute('reaching')
        for ruler in document.getElementsByTagName('ruler')
          ruler.classList.remove('reached')
      return 
    property = e.target.getAttribute('property')
    if document.body.getAttribute('reaching') == property
      return
    domain = undefined

    for other in @engine.domains
      if other.values.hasOwnProperty(property) && other.displayName != 'Solved'
        domain = other
        break
    if domain && properties = domain.distances[property]
      for prop, distance of properties
        unless distance
          @rulers[prop]?.classList.add('reached')
      @reaching = domain
      document.body.setAttribute('reaching', property)
    else
      @reaching = undefined
      document.body.removeAttribute('reaching')

  filter: (ids, all, scroll) ->
    @indexes ||= for node in @list.childNodes
      unless node.getAttribute('hidden')?
        node.getAttribute('for')

    if all
      ids = for node in @list.childNodes
        node.getAttribute('for')
      if ids.toString() == @indexes.toString()
        ids = []
      @indexes = ids || []
    else
      for id in ids
        if (i = @indexes.indexOf(id)) == -1
          @indexes.push(id)
        else
          @indexes.splice(i, 1)

    for domain, index in @list.childNodes
      if @indexes.indexOf(String(@engine.domains[index].uid)) == -1
        domain.setAttribute('hidden', 'hidden')
      else
        domain.removeAttribute('hidden')

    top = null
    for property, ruler of @rulers
      if @indexes.indexOf(ruler.getAttribute('domain')) == -1
        ruler.setAttribute('hidden', 'hidden')
      else 
        if ruler.getAttribute('hidden')?
          ruler.removeAttribute('hidden')
          offsetTop = 0
          while ruler
            offsetTop += ruler.offsetTop
            ruler = ruler.offsetParent
          if !top? || top > offsetTop
            top = offsetTop
    if top? && scroll
      window.scrollTo(0, top)


  domains: (domains) ->
    unless @sheet
      @stylesheet()
    unless @list
      @list = document.createElement('domains')
      @list._gss = true
      document.body.appendChild(@list)
    @list.innerHTML = domains.map (d) -> 
      Debugger.uid ||= 0
      d.uid ||= ++Debugger.uid
      """<domain for="#{d.uid}" #{@engine.console.level <= 1 && 'hidden'} class="#{d.displayName.toLowerCase()}">#{d.constraints.length}</domain>"""
    .join('')

  ruler: (element, path, value, x, y, width, height, inside) ->

    bits = path.split('[')
    id = bits[0]
    property = bits[1].split(']')[0]
    unless ruler = (@rulers ||= {})[path]
      return unless value?
      ruler = @rulers[path] = document.createElement('ruler')
      ruler.className = property
      ruler._gss = true
      ruler.setAttribute('for', element._gss_id)
      ruler.setAttribute('property', path)
      ruler.setAttribute('title', path)
      ruler.removeAttribute('hidden')
    else unless value?
      ruler.parentNode?.removeChild(ruler)
      delete @rulers[path]
      return
    domain = undefined

    for other in @engine.domains
      if other.values.hasOwnProperty(path) && other.displayName != 'Solved'
        domain = other
        break
    unless domain
      ruler.parentNode?.removeChild(ruler)
      return


    ruler.setAttribute('domain', domain.uid)
    if !(distances = domain.distances)
      distances = domain.distances = {}
      for constraint in domain.constraints
        for a of constraint.operation.variables
          if a.match(/width\]|height\]|\[\x]|\[\y\]|/)
            for b of constraint.operation.variables
              if b.match(/width\]|height\]|\[\x]|\[\y\]|/)
                @reach distances, a, b

    unless konst = (typeof @engine.variables[path] == 'string')
      for constraint in domain.constraints
        if constraint.operation.variables[path] && Object.keys(constraint.operation.variables).length == 1
          konst = true
          break

    if konst
      ruler.classList.add('constant')
    else
      ruler.classList.remove('constant')

    if @engine.values[path.replace('[', '[intrinsic-')]?
      ruler.classList.add('intrinsic')
    else
      ruler.classList.remove('intrinsic')

    if inside
      ruler.classList.add('virtual')
    else
      ruler.classList.remove('virtual')

    ruler.style.top = Math.floor(y) + 'px'
    ruler.style.left = Math.floor(x) + 'px'
    ruler.style.width = width + 'px'
    ruler.style.height = height + 'px'

    if inside
      element.appendChild(ruler)
      debugger
      if property == 'height' && @engine.values[id + '[width]']?
        ruler.style.width = @engine.values[id + '[width]'] + 'px'


    else
      element.parentNode.appendChild(ruler)

  reach: (distances, a, b, level = 0) ->
    (distances[a] ||= {})[b] = level
    (distances[b] ||= {})[a] = level
    for c of distances[a]
      bc = distances[b][c]
      if !bc? || bc > level + 1
        @reach(distances, b, c, level + 1)


  draw: (id, data) =>
    if (bits = id.split('"')).length > 1
      scope = bits[0]
    else
      scope = id
    if (element = @engine.identity[scope])?.nodeType == 1
      if scope != id
        top = data[scope + '[y]'] ? 0
        left = data[scope + '[x]'] ? 0
        clientTop = data[id + '[y]'] ? 0
        clientLeft = data[id + '[x]'] ? 0
        offsetTop = top + clientTop
        offsetLeft = left + clientLeft
      else
        top = element.offsetTop
        left = element.offsetLeft

      if element.offsetWidth != data[scope + '[width]'] ? data[scope + '[intrinsic-width]']
        clientLeft = left + element.clientLeft
      if element.offsetHeight != data[scope + '[height]'] ? data[scope + '[intrinsic-height]']
        clientTop = top + element.clientTop

    else
      element = document.body
      left = data[id + '[x]'] ? 0
      top = data[id + '[y]'] ? 0


    if data.hasOwnProperty(prop = id + '[width]')
      @ruler(element, prop, data[prop], clientLeft ? left, clientTop ? top, data[prop], 0, scope != id)
    if data.hasOwnProperty(prop = id + '[height]')
      @ruler(element, prop, data[prop], clientLeft ? left, clientTop ? top, 0, data[prop], scope != id)
    if data.hasOwnProperty(prop = id + '[x]')
      @ruler(element, prop, data[prop], (offsetLeft ? left) - data[prop], (offsetTop ? top), data[prop], 0, scope != id)
    if data.hasOwnProperty(prop = id + '[y]')
      @ruler(element, prop, data[prop], (offsetLeft ? left), (offsetTop ? top) - data[prop], 0, data[prop], scope != id)


module.exports = Debugger