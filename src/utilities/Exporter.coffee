class Exporter
  constructor: (@engine) ->
    return unless @command = location?.search.match(/export=([a-z0-9,]+)/)?[1]

    if @command.indexOf('x') > -1
      @sizes = @command.split(',')


    @engine.once 'compile', =>
      @next()
      #document.write(cssText)

  text: ''

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
        pathSelector = that.localName + ':nth-of-type(' + getIndex(that) + ')' + (if pathSelector then '>' + pathSelector else '')
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

  export: (element = document.body.parentNode, parent, fontSize = 100, unit = 'em') ->
    text = ""


    for child in element.children
      if child.tagName == 'STYLE'
        if child.type.indexOf('gss') == -1
          if child.getAttribute('scoped') != null && !element.id
            selector = getSelector(element) + ' '
          else
            selector = ''

          text += Array.prototype.map.call child.sheet.cssRules, (rule) ->
            return selector + rule.cssText + '\n'
          .join('\n')
      else 

        styles = window.getComputedStyle(child, null)
        childFontSize = parseFloat(styles['font-size'])

        if style = child.getAttribute('style')
          style = style.replace /\d+(?:.?\d*?)px/g, (m) -> 
            if m == '1px'
              return m
            else if unit == 'em'
              return parseFloat(m) / childFontSize  + 'em';
            else
              return parseFloat(m) / 16  + 'rem';
        else
          style = ''

        if fontSize != childFontSize
          if unit == 'em'
            style += 'font-size: ' + (childFontSize / fontSize) + 'em;'
          else
            style += 'font-size: ' + childFontSize / 16 + 'rem;'


        if style
          if child.id
            selector = '#' + child.id
          else
            selector = getSelector(child)
          text += selector + '{' + style + '}\n'
        text += @export(child, element, childFontSize, unit)

    return text

  next: ->
    if size = @sizes.pop()
      [width, height] = size.split('x')

      @engine.then =>
        debugger
        if @previous
          if @sizes.length
            @text += '@media (max-width: ' + width + 'px) and (min-width: ' + (@previous + 1) + 'px) {'
          else
            @text += '@media (min-width: ' + (@previous + 1) + 'px) {'
        else 
          @text += '@media (max-width: ' + width + 'px) {'

        @text += @export()
        @text += '}'
        @previous = parseInt(width)
        @next()

      @resize(parseInt(width), parseInt(height))
    else
      document.write(@text.split(/\n/g).join('<br>'))


  resize: (width, height) ->

    console.log('resize', height, width)
    @engine.data.properties['::window[height]'] = ->
      return height
    @engine.data.properties['::window[width]'] = ->
      return width
    @engine.triggerEvent('resize')


module.exports = Exporter