# Export page solution into static CSS, 
# Uses (r)em unit to scale the whole thing

class Exporter
  constructor: (@engine) ->
    @logs = ['init']
    @engine.export = (callback) ->
      @exporter.logs.push('export()')
      if callback
        if @result
          return callback(@result)
        else
          @once('export', callback)


    return unless command = location?.search.match(/export=([a-z0-9,]+)/)?[1]

    states = location?.search.match(/export-states=([a-z0-9,_-]+)/)?[1]
    @deinherit = location?.search.match(/export-deinherit=([a-z0-9,_-]+)/)?[1]?.split(',')
    @schedule(command, states)


  schedule: (query, states = 'animations')->
    @logs.push('schedule')
    if (@sizes = query.split(',')).length
      @states = states.split(',')
      @sizes = @sizes.map((size) -> size.split('x').map((v) -> parseInt(v)))
      last = @sizes[@sizes.length - 1]
      #@record()
      @engine.once 'compile', =>
        @override('::window[width]', last[0])
        @override('::window[height]', last[1])
        # Nothing's visible initially
        @override('::document[height]', -10000)
        @override('::document[scroll-top]', -10000)

    if document.readyState == 'complete'
      @logs.push('complete')
      @nextSize()
    else
      @logs.push('wait')
      document.addEventListener 'readystatechange', =>
        @logs.push('loaded')
        if document.readyState == 'complete'
          @nextSize()





  text: ''
  states: []
  overriden: {}

  handlers:
    animations: (height, scroll) ->
      @override '::document[scroll-top]', scroll ? 0
      @override '::document[height]', height ? document.documentElement.scrollHeight

      callback = =>
        @engine.precomputing ||= {}
        if @frequency
          @engine.precomputing.timestamp ||= 0  
        else
          @engine.precomputing.timestamp = @engine.console.getTime()

        frames = 0

        @record()

        @initial = {}
        for property, value in @engine.values
          @initial[property] = value

        #@engine.solve 'Transition', ->
        #  @updating.ranges = false
        #  return

        while @engine.ranges
          if ++frames > 100
            # Animations are taking too many frames to finish :'(
            break

          @record()

          @engine.solve 'Transition', ->
            @updating.ranges = true
            return

        @stop()

      @engine.once('finish', callback)
      @engine.solve ->
        @data.verify '::document[height]'
        @data.verify '::document[scroll-top]'
        @data.commit()
      #@engine.triggerEvent('resize')



  frequency: 64
  threshold: 0

  record: (soft) ->
    old = @engine.precomputing

    @engine.precomputing = {
      timestamp: 0#@frequency
    }
    if @frequency && old?.timestamp?
      @engine.precomputing.timestamp = old.timestamp + @frequency

    (@frames ||= []).push @engine.precomputing

  stop: ->
    unless @appeared

      @appeared = true

      @animate()

      @engine.precomputing = undefined
      @record()

      @phase = 'disappearance'
      setTimeout =>
        @handlers.animations.call(@, -10000, -10000)
      , 10
    else
      @animate()

      document.documentElement.classList.remove('animations')
      @phase = @appeared = undefined

      @engine.once 'finish', =>
        # @final = undefined
        @next()

  sequence: (id, frames, prefix = '')->
    h = document.documentElement.scrollHeight
    y = Math.floor((1000 * @engine.values[id + '[absolute-y]'] / h).toFixed(4))
    h = Math.floor((1000 * @engine.values[id + '[computed-height]'] / h).toFixed(4))

    phase = @phase || 'appearance'
    name = phase + '-' + id.substring(1) + '-' + h + '-' + y + '-' + @engine.values['::window[width]']

    text = ''
    last = null
    for frame in frames
      if !last? || frame.progress - last.progress > @threshold || frame.progress == 1
        last = frame
        text += parseFloat((frame.progress * 100).toFixed(3)) + '% {'
        properties = {}
        for property, value of frame
          if property != 'timestamp' && property != 'progress' && property != 'duration'
            if property == 'transform'
              property = prefix + property
            text += property + ':' + value + ';'
        text += '}\n'
    text += '}\n'

    if other = @keyframes?[prefix + text]
      text = ''
    else
      (@keyframes || = {})[prefix + text] = name
      text = '@' + prefix + 'keyframes ' + name + ' {' + text

    selector = getSelector(engine.identity[id]) 
    text += '.' + name + ' ' + selector + ' {\n' 
    text += prefix + 'animation: ' + (other || name) + ' ' + Math.round(last.duration) + 'ms'
    #if @phase == 'disappearance'
    text += ' forwards'
    text += ';\n'
    text += prefix + 'animation-play-state: paused;\n'
    text += '}\n'

    text += '.' + name + '-running ' + selector + ' {\n' 
    text += prefix + 'animation-play-state: running;\n'
    text += '}\n'

    return text


  animate: ->
    animations = {}
    final = {}
    for frame in @frames
      for id, properties of frame
        if id != 'timestamp' && id != 'duration' && id != 'frequency'
          (animations[id] ||= []).push properties
          for property, value of properties
            (final[id] ||= {})[property] = value
          properties.timestamp = frame.timestamp

    @frames = undefined

    for id, keyframes of animations
      continue if  keyframes.length == 1
      first = keyframes[0]
      last = keyframes[keyframes.length - 1]

      start = first.timestamp# - @frequency
      duration = last.timestamp - start
      if @frequency
        index = 0
        while ++index < keyframes.length
          if (prev = keyframes[index - 1])?.timestamp < (keyframes[index].timestamp - @frequency)
            subframe = {}
            for property, value of prev
              subframe[property] = value
            subframe.timestamp = prev.timestamp + @frequency
            keyframes.splice(index, 0, subframe)
      for keyframe in keyframes
        keyframe.duration = duration
        keyframe.progress = (keyframe.timestamp - start) / duration
      initial = {timestamp: start, progress: 0, duration: duration}
      if (props = @final?[id]) && @phase != 'disappearance'
        for property, value of props
          initial[property] = value
        keyframes.unshift initial

      #for property of first
      #  if property != 'timestamp' && property != 'duration' && property != 'progress'
      #    initial[property] = engine.identity[id].style[property]
 
      @text += @sequence(id, keyframes)
      @text += '\n'
      @text += @sequence(id, keyframes, '-webkit-')
      @text += '\n'

    @final = final

    @keyframes = undefined
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

  serialize: (element = @engine.scope, prefix = '', inherited = {}, unit = 'rem', baseFontSize = 100, linebreaks) ->
    if element.nodeType == 9
      element = element.documentElement

    text = ""
    
    unless (fontSize = inherited.fontSize)?
      styles = window.getComputedStyle(element, null)
      inherited.fontSize = fontSize = parseFloat(styles['font-size'])
      if @deinherit
        for property in @deinherit
          inherited[property] = styles[property]
        
    for child in element.childNodes
      if child.nodeType == 1
        if child.tagName == 'STYLE'
          if child.assignments #type.indexOf('gss') == -1
            if child.hasOwnProperty('scoping') && !element.id
              selector = getSelector(element) + ' '
            #else if element.id
            #  selector = '#' + element.id + ' '
            else
              selector = ''

            text += Array.prototype.map.call child.sheet.cssRules, (rule) ->
              text = rule.cssText
              return selector + rule.cssText + '\n'
            .join('\n')
        else unless child.tagName == 'SCRIPT'
          if child.offsetParent || child.tagName == 'svg'

            styles = window.getComputedStyle(child, null)
            childFontSize = parseFloat(styles['font-size'])

            if style = child.getAttribute('style')
              style = style.replace /\d+(?:.?\d*?)px/g, (m) -> 
                if m == '1px'
                  return m
                else if unit == 'em'
                  return parseFloat((parseFloat(m) / childFontSize).toFixed(4)) + unit;
                else
                  return parseFloat((parseFloat(m) / baseFontSize).toFixed(4)) + unit;
              style += ';'
            else
              style = ''


            if fontSize != childFontSize && style.indexOf('font-size:') == -1
              if unit == 'em'
                style += 'font-size: ' + parseFloat((childFontSize / fontSize).toFixed(4)) + unit + ';'
              else
                style += 'font-size: ' + parseFloat((childFontSize / baseFontSize).toFixed(4)) + unit + ';'


            if @deinherit
              for property in @deinherit
                if child.style[property] == ''
                  if inherited[property] != styles[property]
                    value = styles[property]
                    if parseFloat(value) + 'px' == value
                      value = (parseFloat(value) / baseFontSize).toFixed(4) + unit + ';'
                    style += property + ': ' + value + ';'
                    inherited[property] = styles[property]

          if child.tagName != 'svg'

            # Record information about linebreaks in elements as pseudo-element
            if child.className?.indexOf('export-linebreaks') > -1
              breaking = true
              linebreaks = []
              linebreaks.counter = 0
              
            inherited.fontSize = childFontSize
            # Dont count linebreaks in foreign elements that are hidden 
            if child.className?.indexOf('foreign') > -1 && !child.offsetParent
              exported = @serialize(child, prefix, inherited, unit, baseFontSize)
            else
              exported = @serialize(child, prefix, inherited, unit, baseFontSize, linebreaks)

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
            linebreaks = breaking = undefined

          text += exported || ''

      # Text node
      else if linebreaks && child.nodeType == 3 && child.parentNode.tagName != 'STYLE' && child.parentNode.tagName != 'SCRIPT'
        counter = 0
        content = child.textContent
        while counter < content.length
          char = content.charAt(counter)
          range = document.createRange()
          range.setStart(child, counter)
          range.setEnd(child, counter + 1)
          rect = range.getBoundingClientRect()
          if rect.width && rect.top && rect.top != linebreaks.position
            if linebreaks.position
              linebreaks.push(linebreaks.counter)
            linebreaks.position = rect.top

          counter++
          linebreaks.counter++

    return text

  output: (text) ->
    @result = text
    @engine.triggerEvent('export', text)
    #document.write(text.split(/\n/g).join('<br>'))


  nextSize: ->
    if size = @sizes.pop()
      @logs.push('nextSize')
      [width, height] = size

      callback = =>
        @logs.push('success')
        text = ''
        if @previous
          if @sizes.length
            text += '\n@media (max-width: ' + width + 'px) and (min-width: ' + (@previous + 1) + 'px) {\n'
          else
            text += '\n@media (min-width: ' + (@previous + 1) + 'px) {\n'
        else if @sizes.length
          text += '\n@media (max-width: ' + width + 'px) {\n'
        else
          @plain = true

        @base = @serialize()
        text += @base
        @previous = width
        @text += text

        if @states.length
          @uncomputed = @states.slice()

        @next()

      if @text || !@engine.updating
        @engine.once 'finish', callback
        @resize(width, height)
      else if @engine.updating
        @logs.push('wait')
        @engine.once 'finish', callback
      else
        if !@engine.scope.querySelectorAll('style[type*="gss"]').length
          @logs.push('abort')
          callback()
        else
          @engine.once 'solve', callback

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
      unless @plain
        @text += '\n}'
      unless @nextSize()
        @logs.push('done')
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
      @logs.push('nextState')
      document.documentElement.classList.add(state)
      @record()
      @engine.once 'finish', =>
        @logs.push('state:' + state)
        if handler = @handlers[state]
          #@engine.once 'finish', =>
          return handler.call(@)

        result = @serialize()
        prefix = 'html.' + state + ' '

        diff = @differ.diff_main(@base, result)
        @differ.diff_cleanupSemantic(diff)

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
          @engine.once 'finish', =>
            @next()
        , 100
      return true

  override: (property, value) ->
    @overriden[property] ||= @engine.data.properties[property]

    @engine.data.properties[property] = ->
      return value


  resize: (width, height) ->
    @logs.push('resize:' + width + 'x' + height)
    @override '::window[height]', height
    @override '::window[width]', width
    @width = width
    @height = height
    #document.documentElement.style.width = width + 'px'
    @engine.triggerEvent('resize')


module.exports = Exporter