# Find, parse, watch and transform stylesheets

class Stylesheets
  constructor: (@engine) ->
    @watchers = {}
    @sheets = {}

  compile: ->
    @engine.engine.solve 'Document', 'stylesheets', [
      ['eval',  ['$attribute', ['$tag', 'style'], '*=', 'type', 'text/gss']]
      ['load',  ['$attribute', ['$tag', 'link' ], '*=', 'type', 'text/gss']]
    ]
    @inline = @engine.queries['style[type*="text/gss"]']
    @remote = @engine.queries['link[type*="text/gss"]']
    @collections = [@inline, @remote]


  getRule: (operation) ->
    rule = operation
    while rule = rule.parent
      if rule.name == 'rule'
        return rule
    return

  getStylesheet: (stylesheet) ->
    unless sheet = @sheets[stylesheet._gss_id]
      sheet = @sheets[stylesheet._gss_id]= document.createElement('STYLE')
      stylesheet.parentNode.insertBefore(sheet, stylesheet.nextSibling)
    return sheet

  getWatchers: (stylesheet) ->
    return @watchers[stylesheet._gss_id] ||= []

  getOperation: (operation, watchers, rule) ->
    needle = operation.sourceIndex
    for other in rule.properties
      if other != needle
        if watchers[other]?.length
          needle = other
          break
    return needle

  getSelector: (operation) ->
    return @engine.getOperationSelectors(operation).join(', ')

  # dump style into native stylesheet rule
  solve: (stylesheet, operation, continuation, element, property, value) ->
    if rule = @getRule(operation)
      if @watch operation, continuation, stylesheet
        if @update operation, property, value, stylesheet, rule
          @engine.engine.restyled = true

      return true

  update: (operation, property, value, stylesheet, rule) ->
    watchers = @getWatchers(stylesheet)
    dump = @getStylesheet(stylesheet)
    sheet = dump.sheet
    needle = @getOperation(operation, watchers, rule)
    previous = []
    for item, index in watchers
      break if index >= needle
      if operations = watchers[index]
        for op in operations
          other = @getRule(op)
          if previous.indexOf(other) == -1
            previous.push(other)
    unless sheet
      if dump.parentNode
        dump.parentNode.removeChild(dump)
      return 
    rules = sheet.rules || sheet.cssRules
    

    if needle != operation.sourceIndex || value == ''
      rule = rules[previous.length]
      rule.style[property] = value

      if rule.style.length == 0
        sheet.deleteRule(previous.length)
    else
      body = property + ':' + value
      selectors = @getSelector(operation)
      console.error(body, selectors)
      index = sheet.insertRule(selectors + "{" + body + "}", previous.length)
    return true

  watch: (operation, continuation, stylesheet) ->
    watchers = @getWatchers(stylesheet)

    meta = (watchers[operation.sourceIndex] ||= [])
    if meta.indexOf(continuation) > -1
      return
    (watchers[continuation] ||= []).push(operation)
    return meta.push(continuation) == 1

  unwatch: (operation, continuation, stylesheet, watchers) ->
    watchers ?= @getWatchers(stylesheet)

    index = operation.sourceIndex

    meta = watchers[index]
    meta.splice meta.indexOf(continuation), 1

    observers = watchers[continuation]
    observers.splice observers.indexOf(operation), 1

    unless observers.length
      delete watchers[continuation]

    unless meta.length
      delete watchers[index]
      @update operation, operation[1], '', stylesheet, @getRule(operation)

  remove: (continuation, stylesheets) ->
    if @collections
      for collection in @collections
        for stylesheet in collection
          if watchers = @getWatchers(stylesheet)
            if operations = watchers[continuation]
              for operation in operations by -1
                @unwatch(operation, continuation, stylesheet, watchers)
    return

module.exports = Stylesheets