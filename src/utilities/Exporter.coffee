# Export page solution into static CSS, 
# Uses (r)em unit to scale the whole thing

class Exporter
  constructor: (@engine) ->
    return unless @command = location?.search.match(/export=([a-z0-9,]+)/)?[1]

    if states = location?.search.match(/export-states=([a-z0-9,_-]+)/)?[1].split(',')
      @states = states


    if @command.indexOf('x') > -1
      @sizes = @command.split(',')

    window.addEventListener 'load', =>
      @nextSize()

  text: ''
  states: []

  getSelector = (_context) ->
    index = undefined
    localName = undefined
    pathSelector = undefined
    that = _context
    node = undefined
    if that == 'null'
      throw 'not an  dom reference'
    index = getIndex(that)
    while that.tagName
      if that.id
        pathSelector = '#' + that.id + (if pathSelector then '>' + pathSelector else '')
        break
      else
        tag = that.localName
        if tag != 'body' && tag != 'html'
          tag += ':nth-of-type(' + getIndex(that) + ')'
        pathSelector = tag + (if pathSelector then '>' + pathSelector else '')
        that = that.parentNode
    pathSelector

  getIndex = (node) ->
    i = 1
    tagName = node.tagName
    while node.previousSibling
      node = node.previousSibling
      if node.nodeType == 1 and tagName.toLowerCase() == node.tagName.toLowerCase()
        i++
    i

  serialize: (element = @engine.scope, prefix = '', fontSize, unit = 'rem', baseFontSize = 100, linebreaks) ->
    if element.nodeType == 9
      element = element.documentElement

    text = ""
    for child in element.childNodes
      if child.nodeType == 1
        if child.tagName == 'STYLE'
          if child.assignments #type.indexOf('gss') == -1
            if child.getAttribute('scoped') != null && !element.id
              selector = getSelector(element) + ' '
            else
              selector = ''

            text += Array.prototype.map.call child.sheet.cssRules, (rule) ->
              return selector + rule.cssText + '\n'
            .join('\n')
        else unless child.tagName == 'SCRIPT'
          if child.offsetParent
            unless fontSize?
              styles = window.getComputedStyle(element, null)
              fontSize = parseFloat(styles['font-size'])

            styles = window.getComputedStyle(child, null)
            childFontSize = parseFloat(styles['font-size'])

            if style = child.getAttribute('style')
              style = style.replace /\d+(?:.?\d*?)px/g, (m) -> 
                if m == '1px'
                  return m
                else if unit == 'em'
                  return (parseFloat(m) / childFontSize).toFixed(4) + unit;
                else
                  return (parseFloat(m) / baseFontSize).toFixed(4) + unit;
              style += ';'
            else
              style = ''
          else
            childFontSize = fontSize

          if fontSize != childFontSize
            if unit == 'em'
              style += 'font-size: ' + (childFontSize / fontSize).toFixed(4) + unit + ';'
            else
              style += 'font-size: ' + (childFontSize / baseFontSize).toFixed(4) + unit + ';'



          if !linebreaks && child.className.indexOf('layout-system') > -1
            breaking = true
            linebreaks = []
            linebreaks.counter = 0

          if unit == 'em'
            exported = @serialize(child, prefix, childFontSize, unit, baseFontSize, linebreaks)
          else
            exported = @serialize(child, prefix, baseFontSize, unit, baseFontSize, linebreaks)


          if style
            if child.id
              selector = prefix + '#' + child.id
            else
              selector = prefix + getSelector(child)
            if text
              text += '\n'
            text += selector + '{' + style + '}\n'

            if breaking
              text += selector + ':before{content: "' + linebreaks.join(',') + '"; display: none;}\n'

          if breaking
            linebreaks = breaking = undefined

          text += exported

      # Text node
      else if linebreaks && child.nodeType == 3 && child.parentNode.tagName != 'STYLE' && child.parentNode.tagName != 'SCRIPT'
        counter = 0
        content = child.textContent
        top = 0
        while counter < content.length
          char = content.charAt(counter)
          range = document.createRange()
          range.setStart(child, counter)
          range.setEnd(child, counter + 1)
          rect = range.getBoundingClientRect()
          if rect.width && rect.top && rect.top != top
            if top
              linebreaks.push(linebreaks.counter)
            top = rect.top

          counter++
          linebreaks.counter++

    return text

  output: (text) ->
    document.write(text.split(/\n/g).join('<br>'))

  nextSize: ->
    if size = @sizes.pop()
      [width, height] = size.split('x')


      @engine.then =>
        text = ''
        if @previous
          if @sizes.length
            text += '\n@media (max-width: ' + width + 'px) and (min-width: ' + (@previous + 1) + 'px) {\n'
          else
            text += '\n@media (min-width: ' + (@previous + 1) + 'px) {\n'
        else 
          text += '\n@media (max-width: ' + width + 'px) {\n'

        @base = @serialize()
        console.error('BASIS', width, height)
        text += @base
        @previous = parseInt(width)
        @text += text

        if @states.length
          @uncomputed = @states.slice()

        @next()

      @resize(parseInt(width), parseInt(height))
      return true

  endRule: (rule, text) ->
    semicolon = text.indexOf(';')
    curly = text.indexOf('}')
    if semicolon > -1 && curly > -1
      rule += text.substring(0, Math.min(semicolon, curly))
    else if semicolon > -1
      last = text.lastIndexOf(';') 
      if last != semicolon
        rule += text.substring(0, semicolon)
        rule += text.substring(last)
      else
        rule += text
    else if curly > -1
      rule += text.substring(0, curly)
    else
      rule += text

    if curly > -1
      rule += '}\n'

    return rule



  next: ->
    unless @nextState()
      @text += '\n}'
      unless @nextSize()
        @output(@text)

  nextState: ->
    return unless @uncomputed
    # Load diff match patch library
    if !@differ
      script = document.createElement('script')
      script.onload = =>
        @differ = new diff_match_patch();
        @nextState()
      script.src = 'http://cdn.rawgit.com/tanaka-de-silva/google-diff-match-patch-js/master/diff_match_patch.js'
      document.body.appendChild(script)
      return true

    if state = @uncomputed.pop()

      setTimeout =>
        document.documentElement.classList.add(state)

        @engine.then =>
          result = @serialize()
          prefix = 'html.' + state + ' '

          diff = @differ.diff_main(@base, result)
          @differ.diff_cleanupSemantic(diff)

          console.log(diff)

          selector = undefined
          property = undefined
          value = undefined
          rule = ''
          overlay = ''

          z = 0;
          for change in diff
            text = change[1]
            if change[0] == 0
              if rule
                rule = @endRule(rule, text)
                if text.indexOf('}') > -1
                  overlay += rule
                  rule = ''
                  z++
              if (end = text.lastIndexOf('{')) > -1
                #if (start = text.lastIndexOf('}')) > -1 && start < end
                start = text.lastIndexOf('}')
                selector = text.substring(start + 1, end).trim()
                rest = text.substring(end + 1)
                if match = rest.match(/(?:;|^)\s*([^;{]+):\s*([^;}]+)$/)
                  property = match[1]
                  value = match[2]
                start = end = undefined

            else if change[0] == 1
              if selector
                rule = prefix + selector + '{'
                selector = undefined

              if property
                rule += property + ':'
                property = undefined

              if value?
                rule += value
                value = undefined

              rule += change[1].trim()

              if rule.charAt(rule.length - 1) == '}'
                rule = ''

          @text += overlay

          setTimeout =>
            document.documentElement.classList.remove(state)
            @engine.then =>
              @next()
          , 100
      , 100
      return true


  resize: (width, height) ->

    console.log('resize', height, width)
    @engine.data.properties['::window[height]'] = ->
      return height
    @engine.data.properties['::window[width]'] = ->
      return width
    #document.documentElement.style.width = width + 'px'
    @engine.triggerEvent('resize')


module.exports = Exporter