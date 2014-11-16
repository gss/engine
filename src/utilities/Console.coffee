# Console shim & wrapper. Used to output collapsible table view.

class Console
  constructor: (@level) ->
    @level ?= self.GSS_LOG ? parseFloat(self?.location?.search.match(/log=([\d.]+)/)?[1] || 0)
    if !Console.bind
      @level = 0

  methods: ['log', 'warn', 'info', 'error', 'group', 'groupEnd', 'groupCollapsed', 'time', 'timeEnd', 'profile', 'profileEnd']
  groups: 0

  compile: (engine) ->




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

  row: (a, b, c) ->
    return if @level < 1
    a = a.name || a
    return if typeof a != 'string'
    p1 = Array(5 - Math.floor(a.length / 4) ).join('\t')
    if document?
      console.log(b, c)
      breakpoint = String(@stringify([b,c])).trim().replace /\r?\n+|\r|\s+/g, ' '
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
    @startTime = @getTime()
    @started ||= []
    if @started.indexOf(name) > -1
      started = true
    @started.push(name)
    return if started
    return if @level < 1
    fmt = '%c%s'
    fmt += Array(5 - Math.floor(String(name).length / 4) ).join('\t')

    fmt += "%c"
    if typeof reason != 'string'
      fmt += '%O'
    else
      fmt += '%s'

      method = 'groupCollapsed'
    @[method || 'group'](fmt, 'font-weight: normal', name, 'color: #666; font-weight: normal', reason)
    return true
  
  end: (reason) ->
    popped = @started?.pop()
    return if !popped || @started.indexOf(popped) > -1
    @endTime = @getTime()
    return if @level < 1
    @groupEnd()
    
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
        Console::groups--

      if @level || method == 'error'
        console?[method]?(arguments...)

module.exports = Console
