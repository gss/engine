# Console shim & wrapper. Used to output collapsible table view.

class Console
  constructor: (@level) ->
    @level ?= self.GSS_LOG ? parseFloat(self?.location?.search.match(/log=([\d.]+)/)?[1] || 0)
    if !Console.bind
      @level = 0
    @stack = []
    @buffer = []

  methods: ['log', 'warn', 'info', 'error', 'group', 'groupEnd', 'groupCollapsed', 'time', 'timeEnd', 'profile', 'profileEnd']
  groups: 0

  compile: (engine) ->
    @DESCEND = engine.Command.prototype.DESCEND

  push: (a, b, c, type) ->
    if @level > 0.5 || type
      unless @buffer.length
        if @level > 1
          console.profile()
      index = @buffer.push(a, b, c, undefined, type || @row)
      @stack.push(index - 5)

  pop: (d, type = @row, update) ->
    if @level > 0.5 || type != @row
      index = @stack.pop()
      @buffer[index + 3] = d
      if type != @row
        @buffer[index + 2] = @getTime(@buffer[index + 2])
      unless @stack.length
        @flush()
      return

  flush: ->
    for item, index in @buffer by 5
      @buffer[index + 4].call(@, @buffer[index], @buffer[index + 1], @buffer[index + 2], @buffer[index + 3])
    @buffer = []
    if @level > 1
      console.profileEnd()

  openGroup: (name, reason, time, result) ->

    fmt = '%c%s%O \t  '
    if typeof reason != 'string'
      fmt += '%O'
    else
      fmt += '%s'

    fmt += ' \t  %c%sms'
    while name.length < 13
      name += ' '

    if @level <= 1.5
      method = 'groupCollapsed'
    @[method || 'group'](fmt, 'font-weight: normal', name, reason, result, 'color: #999; font-weight: normal; font-style: italic;', time)

  closeGroup: ->
    @groupEnd()

  stringify: (obj) ->
    return '' unless obj
    if obj.push
      obj.map @stringify, @
    else if obj.nodeType
      obj._gss_id
    else if obj.toString != Object.prototype.toString
      obj.toString()
    else if obj.displayName
      return obj.displayName
    else
      JSON.stringify(obj)

  debug: (exp) ->
    document.location = document.location.toString().replace(/[&?]breakpoint=[^&]+|$/, 
      ((document.location.search.indexOf('?') > -1) && '&' || '?') + 
      'breakpoint=' + exp.trim().replace(/\r?\n+|\r|\s+/g, ' '))

  breakpoint: decodeURIComponent (document?.location.search.match(/breakpoint=([^&]+)/, '') || ['',''])[1]

  row: (a, b, c, d) ->
    return if @level < 1
    a = a.name || a
    return if typeof a != 'string'
    p1 = Array(4 - Math.floor((a.length + 1) / 4)).join('\t')
    if @breakpoint && document?
      breakpoint = String(@stringify([b,c])).trim().replace /\r?\n+|\r|\s+/g, ' '
      #if @breakpoint == a + breakpoint
      #  debugger
    else 
      breakpoint = ''
    if typeof c == 'string'
      if (index = c.indexOf(@DESCEND)) > -1
        if c.indexOf('style[type*="gss"]') > -1
          c = c.substring(index)

      c = c.replace /\r?\n|\r|\s+/g, ' '

    if d
      unless d instanceof Array
        d = [d]
    else
      d = []

    if document?
      if typeof b == 'object'
        @log('%c%s%c%s%c%s%O\t\t%O%c\t\t%s', 
            'color: #666', a, 
            'font-size: 0;line-height:0;', breakpoint, 
            '', 
            p1, b, 
            d,
            'color: #999', c || "")
      else
        p2 = Array(6 - Math.floor(String(b).length / 4) ).join('\t')
        @log('%c%s%s%s%c%s%s', 'color: #666', a, p1, b, 'color: #999', p2, c || "")
    else
      @log a, b, c

  start: (reason, name) ->
    @push(reason, name, @getTime(), @openGroup)
  
  end: (result) ->
    @buffer.push(undefined, undefined, undefined, undefined, @closeGroup)
    @pop(result, @openGroup, true)

  getTime: (other, time) ->
    time ||= performance?.now?() || Date.now?() || + (new Date)
    return time if time && !other
    return Math.floor((time - other) * 100) / 100


for method in Console::methods 
  Console::[method] = do (method) ->
    return ->
      if method == 'group' || method == 'groupCollapsed'
        Console::groups++
      else if method == 'groupEnd'
        return unless Console::groups
        Console::groups--

      if @level || method == 'error'
        console?[method]?(arguments...)

module.exports = Console
