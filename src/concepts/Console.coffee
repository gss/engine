# Console shim & wrapper. Used to output collapsible table view.

Native = require '../methods/Native'

class Console
  constructor: (@level) ->
    @level ?= parseFloat(window?.location?.href.match(/log=\d/)?[0] || 1)
    if !Console.bind
      @level = 0

  methods: ['log', 'warn', 'info', 'error', 'group', 'groupEnd', 'groupCollapsed', 'time', 'timeEnd', 'profile', 'profileEnd']
  groups: 0

  stringify: (obj) ->
    return '' unless obj
    if obj.push
      obj.map @stringify, @
    else if obj.nodeType
      obj._gss_id
    else if obj.toString != Object.prototype.toString
      obj.toString()
    else
      JSON.stringify(obj)

  debug: (exp) ->
    document.location = document.location.toString().replace(/[&?]breakpoint=[^&]+|$/, 
      ((document.location.search.indexOf('?') > -1) && '&' || '?') + 
      'breakpoint=' + exp.trim())

  breakpoint: decodeURIComponent (document?.location.search.match(/breakpoint=([^&]+)/, '') || ['',''])[1]

  row: (a, b, c) ->
    return unless @level
    a = a.name || a
    p1 = Array(5 - Math.floor(a.length / 4) ).join('\t')
    if document?
      breakpoint = String(@stringify([b,c])).replace /\r?\n+|\r|\s+/g, ' '
      if @breakpoint == a + breakpoint
        debugger
    else 
      breakpoint = ''
    if typeof c == 'string'
      c = c.replace /\r?\n|\r|\s+/g, ' '
    if document?
      if typeof b == 'object'
        @log('%c%s%c%s%c%s%O%c\t\t\t%s', 'color: #666', a, 'font-size: 0;line-height:0;', breakpoint, '', p1, b, 'color: #999', c || "")
      else
        p2 = Array(6 - Math.floor(String(b).length / 4) ).join('\t')
        @log('%c%s%s%s%c%s%s', 'color: #666', a, p1, b, 'color: #999', p2, c || "")
    else
      @log a, b, c

  start: (reason, name) ->
    @startTime = Native::time()
    @started ||= []
    if @started.indexOf(name) > -1
      started = true
    @started.push(name)
    return if started
    fmt = '%c%s'
    fmt += Array(5 - Math.floor(String(name).length / 4) ).join('\t')

    fmt += "%c"
    if typeof reason != 'string'
      #reason = Native::clone(reason) if reason?.slice
      fmt += '%O'
    else
      fmt += '%s'

      method = 'groupCollapsed'
    @[method || 'group'](fmt, 'font-weight: normal', name, 'color: #666; font-weight: normal', reason)
    return true
  
  end: (reason) ->
    popped = @started?.pop()
    return if !popped || @started.indexOf(popped) > -1
    @groupEnd()
    @endTime = Native::time()

for method in Console::methods 
  Console::[method] = do (method) ->
    return ->
      if method == 'group' || method == 'groupCollapsed'
        Console::groups++
      else if method == 'groupEnd'
        Console::groups--

      if @level
        console?[method]?(arguments...)

module.exports = Console
