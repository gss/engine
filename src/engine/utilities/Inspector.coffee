class Inspector
  constructor: (@engine) ->

  toExpressionString: (operation) ->
    if operation?.push
      if operation[0] == 'get'
        path = operation[1]
        i = path.indexOf('[')
        prop = path.substring(i + 1, path.length - 1)
        if @engine.values[path.replace('[', '[intrinsic-')]? || prop.indexOf('intrinsic-') > -1
          klass = 'intrinsic'
        else if path.indexOf('"') > -1
          klass = 'virtual'
        else if i > -1
          if prop == 'x' || prop == 'y'
            klass = 'position'
          else if !(@engine.data.properties[prop]?.matcher)
            klass = 'local'
        return '<strong class="' + (klass || 'variable') + '" for="' + path + '" title="' + @engine.values[path] + '">' + path + '</strong>'
      return @toExpressionString(operation[1]) + ' <b title=\'' + operation.parent?[0]?.key+ '\'>' + operation[0] + '</b> ' + @toExpressionString(operation[2])
    else
      return operation ? ''
    
  update: () ->
    if @engine.console.level > 0
      @domains(@engine.domains)
    if @engine.console.level > 1.5 || @rulers
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
      panel {
        padding: 10px;
        left: 0
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
      panel strong[mark] {
        text-decoration: underline;
      }
      domains domain{
        padding: 5px;
        text-align: center;
        display: inline-block;
        cursor: pointer;
      }
      domain[hidden] {
        color: #999;
        background: none;
      }
      domain.singles:before {
        content: ' + ';
        display: 'inline'
      }
      domain, domain.active {
        background: #fff;
        color: #000;
      }
      domain.active {
        font-weight: bold;
      }
      domains:hover domain {
        background: none;
      }
      domains:hover domain:hover {
        background: #fff
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
      domain:hover panel, body[reaching] panel {
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
      body[inspecting][reaching] ruler.virtual.height:not(:hover) {
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
      domain panel.filtered {
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
    document.addEventListener 'mousedown', @onClick
    document.addEventListener 'mousemove', @onMouseMove
    document.addEventListener 'keydown', @onKeyDown
    document.addEventListener 'keyup', @onKeyUp
  refresh: ->
    #for domain in @engine.domains
    #  domain.distances = undefined
    values = {}
    for property, value of @engine.values
      values[property] = value
    if @rulers
      for property, value of @rulers
        unless values.hasOwnProperty(property)
          values[property] = null
    ids = @ids = []
    for property, value of values
      if (bits = property.split('[')).length > 1
        if ids.indexOf(bits[0]) == -1
          ids.push(bits[0])
    for id in ids
      @draw(id, values)

  onKeyDown: (e) =>
    if e.altKey
      document.body.setAttribute('inspecting', 'inspecting')

  onKeyUp: (e) =>
    if document.body.getAttribute('inspecting')?
      document.body.removeAttribute('inspecting')

  getDomains: (ids) ->
    domains = []
    for domain in @engine.domains
      if domain.displayName != 'Solved' && domain.constraints.length
        for own property, value of domain.values
          id = property.split('[')
          if id.length > 1
            if ids.indexOf(id[0]) > -1
              if domains.indexOf(domain) == -1
                domains.push(domain)
    return domains

  onClick: (e) =>
    if e.target.tagName?.toLowerCase() == 'domain'
      unless @rulers
        @refresh()
      @filter([e.target.getAttribute('for')], e.shiftKey || e.ctrlKey, true)
      e.preventDefault()
      e.stopPropagation()
    else
      if e.metaKey
        unless @rulers
          @refresh()

      if e.altKey || e.metaKey
        
        target = e.target
        ids = []
        inspecting = []
        while target
          if target.nodeType == 1
            if e.altKey && target._gss && target.classList.contains('virtual')
              inspecting.push target.getAttribute('for')
            else if target._gss_id
              inspecting.push target._gss_id
          target = target.parentNode
        
        domains = @getDomains(inspecting)
        ids = domains.map (d) -> String(d.uid)
        if e.altKey
          #@remap(domains[0])
          @visualize null, inspecting, e.shiftKey
          @constraints ids[0], null, inspecting, e.shiftKey
        if e.metaKey
          @filter ids, e.shiftKey

      else if (property = document.body.getAttribute('reaching')) && e.target.tagName?.toLowerCase() == 'ruler'
        domain = @reaching
        if domain && properties = domain.distances?[property]
          props = []
          for prop, distance of properties
            unless distance
              props.push(prop)
          @constraints domain.uid, null, props
      else return
      e.preventDefault()
      e.stopPropagation()

  constraints: (id, element, props, all) ->
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
      @panel.parentNode?.classList.remove('active')
      element.appendChild(@panel)

    if id == 'singles'
      domain = @singles
    else
      for d in @engine.domains
        if String(d.uid) == String(id)
          domain = d
          break

    if domain
      @panel.innerHTML = domain.constraints?.map (constraint) =>
        return @toExpressionString(constraint.operations[0])
      .filter (string) ->
        return true unless props
        for prop in props
          if string.indexOf(prop) > -1
            if !all && props.length > 1
              props.splice(1)
            return true
        return false
      .map (string) ->
        if props
          for prop in props
            prop = prop.replace(/([\[\]$])/g, '\\$1')
            string = string.replace(new RegExp('\\>(' + prop + '[\\[\\"])', 'g'), ' mark>$1')


        return string
      .join('\n')
      if props
        @panel.classList.add('filtered')
      diff = element.offsetLeft + element.offsetWidth + 10 - @panel.offsetWidth
      if diff > 0
        @panel.style.left = diff + 'px'
      else
        @panel.style.left = ''
      element.classList.add('active')

  onMouseMove: (e) =>
    target = e.target
    if target._gss
      return @visualize e.target.getAttribute('property')

    while target
      if target.nodeType == 1
        if target.tagName.toLowerCase() == 'domain'
          return @constraints(target.getAttribute('for'), target)

      target = target.parentNode

    if @panel?.parentNode
      @panel.parentNode.classList.remove('active')
      @panel.parentNode.removeChild(@panel)
    if @reaching
      @visualize()

  visualize: (property, ids, all) ->
    if !property && !ids
      if @reaching
        @reaching = undefined
        document.body.removeAttribute('reaching')
        for ruler in document.getElementsByTagName('ruler')
          ruler.classList.remove('reached')
      return 
    if !ids && document.body.getAttribute('reaching') == property
      return
    if ids
      props = []
      for property of @rulers
        for id in ids
          if property.substring(0, id.length) == id
            if property.substring(id.length, id.length + 1) == '['
              props.push(property)

              if !all && ids.length > 1
                ids.splice(1)
                break
    else
      props = [property]
      ids = [property.split('[')[0]]

    domain = @getDomains(ids)[0]

    reached = false
    for prop in props
      if domain && properties = domain.distances?[prop]
        for key, distance of properties
          unless distance
            reached = true
            @rulers[key]?.classList.add('reached')
            @reaching = domain
            document.body.setAttribute('reaching', prop || id)
  


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
      if @engine.domains[index]?
        if @indexes.indexOf(String(@engine.domains[index].uid)) == -1
          domain.setAttribute('hidden', 'hidden')
          if @panel?.parentNode == domain
            domain.classList.remove('active')
            domain.removeChild(@panel)
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
    @singles = undefined
    unless @sheet
      @stylesheet()
    unless @list
      @list = document.createElement('domains')
      @list._gss = true
      document.body.appendChild(@list)

    total = 0
    multiples = []
    for domain, index in domains by -1
      if domain.constraints.length == 1
        singles = @singles ||= {constraints: [], uid: 'singles', displayName: 'Singles'}
        singles.constraints.push(domain.constraints[0])
      else
        multiples.push(domain)

    multiples = multiples.sort (a, b) ->
      return b.constraints.length - a.constraints.length

    if singles
      multiples.push(singles)

    Inspector.uid ||= 0
    innerHTML = multiples.map (d) => 
      d.uid ||= ++Inspector.uid
      length = d.constraints?.length || 0
      total += length
      """<domain for="#{d.uid}" count="#{length}" #{@engine.console.level <= 1 && 'hidden'} class="#{d.displayName.toLowerCase()}">#{length}</domain>"""
    .join('')
    innerHTML += '<label> = <strong>' + total + '</strong></label>'
    @list.innerHTML = innerHTML

  ###remap: (domain) ->
    if !(distances = domain.distances)
      distances = domain.distances = {}
      for constraint in domain.constraints
        for a of constraint.operations[0].variables
          if a.match(/width\]|height\]|\[\x]|\[\y\]|/)
            for b of constraint.operations[0].variables
              if b.match(/width\]|height\]|\[\x]|\[\y\]|/)
                @reach distances, a, b
  ###

  ruler: (element, path, value, x, y, width, height, inside) ->

    bits = path.split('[')
    id = bits[0]
    property = bits[1].split(']')[0]
    unless ruler = (@rulers ||= {})[path]
      return unless value?
      ruler = @rulers[path] = document.createElement('ruler')
      ruler.className = property
      ruler._gss = true
      id = path.split('[')[0]
      ruler.setAttribute('for', id)
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

    #@remap domain

    unless konst = (typeof @engine.variables[path] == 'string')
      for constraint in domain.constraints
        if constraint.operations[0].variables[path] && Object.keys(constraint.operations[0].variables).length == 1
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
      unless element.offsetHeight
        element = element.parentNode

      element.appendChild(ruler)
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
        if !element.offsetHeight && !element.offsetTop
          element = element.parentNode
          scope = @engine.identify(element)
          parenting = true
        top = data[scope + '[y]'] ? 0
        left = data[scope + '[x]'] ? 0
        clientTop = data[id + '[y]'] ? 0
        clientLeft = data[id + '[x]'] ? 0
        offsetTop = top + clientTop
        offsetLeft = left + clientLeft
      else
        top = element.offsetTop
        left = element.offsetLeft

      unless parenting
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


module.exports = Inspector