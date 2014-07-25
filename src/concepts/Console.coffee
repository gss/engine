# Console shim & wrapper. Used to output collapsible table view.

class Console
  constructor: (@level) ->

  methods: ['log', 'warn', 'info', 'error', 'group', 'groupEnd', 'groupCollapsed', 'time', 'timeEnd', 'profile', 'profileEnd']
  groups: 0

  row: (a, b, c) ->
    a = a.name || a
    p1 = Array(5 - Math.floor(a.length / 4) ).join('\t')
    if typeof b == 'object'
      @log('%c%s%s%O%c\t\t\t%s', 'color: #666', a, p1, b, 'color: #999', c || "")
    else
      p2 = Array(6 - Math.floor(String(b).length / 4) ).join('\t')
      @log('%c%s%s%s%c%s%s', 'color: #666', a, p1, b, 'color: #999', p2, c || "")

  @time: (other, time) ->
    time ||= performance?.now() || Date.now?() || + (new Date)
    return time if time && !other
    return Math.floor((time - other) * 100) / 100

for method in Console::methods 
  Console::[method] = do (method) ->
    return ->
      if method == 'group' || method == 'groupCollapsed'
        Console::groups++
      else if method == 'groupEnd'
        Console::groups--

      if document? && window.location?.href.indexOf('log=0') == -1
        console?[method]?(arguments...)

module.exports = Console
