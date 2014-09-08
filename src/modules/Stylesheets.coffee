class Stylesheet
  constructor: (@engine) ->

  getRule: (operation) ->
    rule = operation
    while rule = rule.parent
      if rule.name == 'rule'
        return rule
    return

  getStylesheet: (stylesheet) ->
    unless (dump = stylesheet.nextSibling)?.meta
      dump = document.createElement('STYLE')
      dump.meta = []
      stylesheet.parentNode.insertBefore(dump, stylesheet.nextSibling)

  getOperation: (operation, meta, rule) ->
    needle = operation.sourceIndex
    for other in rule.properties
      if other != needle
        if meta[other]?.length
          needle = other
          break
    return needle

  watch: (meta, continuation, operation) ->
    meta = (meta[operation.sourceIndex] ||= [])
    if meta.indexOf(continuation) > -1
      return
    if meta.push(continuation) > 1
      return
    (meta[continuation] ||= []).push(operation.sourceIndex)
    return true

  # dump style into native stylesheet rule
  solve: (stylesheet, operation, continuation, element, property, value) ->
    if rule = @getRule(operation)
      dump = @getStylesheet(stylesheet)
      if @watch dump.meta, continuation, operation
        if @update operation, property, value, dump, rule
          @engine.engine.restyled = true

      return true

  update: (operation, property, value, dump, rule) ->
    needle = @getOperation(operation, dump.meta, rule)
    position = 0
    for item, index in dump.meta
      break if index >= needle
      if item?.length
        position++

    rules = dump.sheet.rules || dump.sheet.cssRules
    for other in rules
      position -= (other.style.length - 1)

    if needle != operation.sourceIndex
      rule = rules[position]
      rule.style[property] = value
    else
      selectors = @engine.getOperationSelectors(operation).join(', ')
      body = property + ':' + value
      index = dump.sheet.insertRule(selectors + "{" + body + "}", position)
    return true

  remove: (index, continuation, stylesheet, meta) ->
    watchers = meta[index]
    watchers.splice watchers.indexOf(continuation), 1
    unless watchers.length
      delete meta[index]
      console.log('lawl', index)

  clean: (continuation, stylesheets) ->
    debugger
    for stylesheet in stylesheets
      if meta = stylesheet.nextSibling?.meta
        if operations = meta[continuation]
          while (index = operations.pop())?
            @remove(index, continuation, stylesheet, meta)

      console.error('removeafdsdf', stylesheets, continuation, meta, stylesheet, stylesheet.nextSibling)


module.exports = Stylesheet