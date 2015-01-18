# Console shim & wrapper. Used to output collapsible table view.

class Console
  constructor: (@level) ->
    @level ?= self.GSS_LOG ? parseFloat(self?.location?.search.match(/log=([\d.]+)/)?[1] || 0)
    if !Console.bind
      @level = 0
    @stack = []
    @buffer = []
    self.addEventListener 'error', @onError, true

  methods: ['log', 'warn', 'info', 'error', 'group', 'groupEnd', 'groupCollapsed', 'time', 'timeEnd', 'profile', 'profileEnd']
  groups: 0

  onError: (e) =>
    true while @pop(e)

  compile: (engine) ->
    @DESCEND = engine.Command.prototype.DESCEND

  push: (a, b, c, type) ->
    if @level > 0.5 || type
      unless @buffer.length
        if @level > 1
          console?.profile()
      index = @buffer.push(a, b, c, undefined, type || @row)
      @stack.push(index - 5)

  pop: (d, type = @row, update) ->
    if (@level > 0.5 || type != @row) && @stack.length
      index = @stack.pop()
      @buffer[index + 3] = d
      if type != @row
        @buffer[index + 2] = @getTime(@buffer[index + 2])
      unless @stack.length
        @flush()
      return true
    return false

  flush: ->
    if @level > 1
      console?.profileEnd()
    for item, index in @buffer by 5
      @buffer[index + 4].call(@, @buffer[index], @buffer[index + 1], @buffer[index + 2], @buffer[index + 3])
    @buffer = []

  pad: (object, length = 17) ->
    if object.length > length
      object.substring(0, length - 1) + '…'
    else
      object + Array(length - object.length).join(' ') 

  openGroup: (name, reason = '', time, result = '') ->

    fmt = '%c%s'

    switch typeof reason
      when 'string'
        fmt += '%s'
        reason = @pad(reason, 16)
      when 'object'
        fmt += '%O\t'
        unless reason.length?
          fmt += '\t'

    switch typeof result
      when 'string'
        fmt += '%s'
        result = @pad(result, 17)
      when 'object'
        fmt += '%O\t'
        unless result.length > 9
          fmt += '\t'

    fmt += ' %c%sms'

    name = @pad(name, 13)

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

  row: (a, b = '', c = '', d = '') ->
    return if @level < 1
    a = a.name || a
    return if typeof a != 'string'
    p1 = Array(4 - Math.floor((a.length + 1) / 4)).join('\t')

    if (index = c.indexOf(@DESCEND)) > -1
      if c.indexOf('style[type*="gss"]') > -1
        c = c.substring(index + 1)

    c = c.replace /\r?\n|\r|\s+/g, ' '

    fmt = '%c%s'

    switch typeof b
      when 'string'
        fmt += '%s'
        b = @pad(b, 14)
      when 'object'
        fmt += '%O\t'
        unless b.push
          b = [b]
          #fmt += ''

    switch typeof d
      when 'string', 'boolean', 'number'
        fmt += '  %s '
        d = @pad(String(d), 17)
      when 'object'
        fmt += '  %O\t   '
        if d.item
          d = Array.prototype.slice.call(d)
        else unless d.length?
          d = [d]

    if document?
      @log(fmt + '%c%s', 
          'color: #666', @pad(a, 11), 
          b, 
          d,
          'color: #999', c)
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
