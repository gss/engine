Parser = require('ccss-compiler')
Query = require('./Query')
Command = require('./Command')

class Stylesheet extends Command.List
  type: 'Stylesheet'

  mimes:
    "text/gss-ast": (source) ->
      return JSON.parse(source)

    "text/gss": (source) ->
      return Parser.parse(source)?.commands

    
  # Insert stylesheet into a collection
  parse: (engine, type = 'text/gss', source) ->
    operations = engine.clone(@mimes[type](source))
    if typeof operations[0] == 'string'
      operations = [operations]
    engine.console.row(type, operations)
    return operations

  descend: ->
    debugger
    @users = (@users || 0) + 1
    super 
  


  @operations: [
    ['import',  ['[*=]', ['tag', 'style'], 'type', 'text/gss']]
    ['import',  ['[*=]', ['tag', 'link' ], 'type', 'text/gss']]
  ]

  @compile: (engine) ->
    @CanonicalizeSelectorRegExp = new RegExp(
      "[$][a-z0-9]+[" + @prototype.DESCEND + "]\s*", "gi"
    )
    
    engine.engine.solve 'Document', 'stylesheets', @operations


  @update: (engine, operation, property, value, stylesheet, rule) ->
    watchers = @getWatchers(engine, stylesheet)
    dump = @getStylesheet(engine, stylesheet)
    sheet = dump.sheet
    needle = @getOperation(operation, watchers, rule)
    previous = []

    for item, index in watchers
      break if index >= needle
      if ops = watchers[index]
        other = @getRule(watchers[ops[0]][0])
        if previous.indexOf(other) == -1
          previous.push(other)
    unless sheet
      if dump.parentNode
        dump.parentNode.removeChild(dump)
      return 
    rules = sheet.rules || sheet.cssRules
    

    if needle != operation.index || value == ''
      index = previous.length
      generated = rules[index]
      text = generated.cssText
      text = text.substring(0, text.lastIndexOf('}') - 1) + ';' + property + ':' + value + '}'
      sheet.deleteRule(index)
      index = sheet.insertRule(text, index)

      next = undefined
      if needle == operation.index
        needle++
      for index in [needle ... watchers.length]
        if ops = watchers[index]
          next = @getRule(watchers[ops[0]][0])
          if next != rule
            sheet.deleteRule(previous.length)
          break
      if !next
        sheet.deleteRule(previous.length)
    else
      body = property + ':' + value
      selectors = @getSelector(operation)
      index = sheet.insertRule(selectors + "{" + body + "}", previous.length)
    return true

  onClean: (engine, operation, query, watcher, subscope) ->
    if @users && !--@users
      engine.Query::clean(engine, @source)
      engine.Query::unobserve(engine, @source, @delimit(query))


  @getRule: (operation) ->
    rule = operation
    while rule = rule.parent
      if rule[0] == 'rule'
        return rule
    return

  @getStylesheet: (engine, stylesheet) ->
    unless sheet = (engine.stylesheets.dumps ||= {})[stylesheet._gss_id]
      sheet = engine.stylesheets.dumps[stylesheet._gss_id]= document.createElement('STYLE')
      stylesheet.parentNode.insertBefore(sheet, stylesheet.nextSibling)
    return sheet

  @getWatchers: (engine, stylesheet) ->
    return (engine.stylesheets.watchers ||= {})[stylesheet._gss_id] ||= []

  @getOperation: (operation, watchers, rule) ->
    needle = operation.index
    for other in rule.properties
      if watchers[other]?.length
        needle = other
        break
    return needle

  # dump style into native stylesheet rule
  @set: (engine, operation, continuation, stylesheet, element, property, value) ->
    if rule = @getRule(operation)
      if @watch engine, operation, continuation, stylesheet
        if @update engine, operation, property, value, stylesheet, rule
          engine.updating.restyled = true

      return true

  @onRemove: (engine, continuation) ->
    if engine.stylesheets
      for stylesheet in engine.stylesheets
        if watchers = @getWatchers(engine, stylesheet)
          if operations = watchers[continuation]
            for operation in operations by -1
              @unwatch(engine, operation, continuation, stylesheet, watchers)
    return

  @watch: (engine, operation, continuation, stylesheet) ->
    watchers = @getWatchers(engine, stylesheet)

    meta = (watchers[operation.index] ||= [])
    if meta.indexOf(continuation) > -1
      return
    (watchers[continuation] ||= []).push(operation)
    return meta.push(continuation) == 1

  @unwatch: (engine, operation, continuation, stylesheet, watchers) ->
    watchers ?= @getWatchers(engine, stylesheet)

    index = operation.index

    meta = watchers[index]
    meta.splice meta.indexOf(continuation), 1

    observers = watchers[continuation]
    observers.splice observers.indexOf(operation), 1

    unless observers.length
      delete watchers[continuation]

    unless meta.length
      delete watchers[index]
      @update engine, operation, operation[1], '', stylesheet, @getRule(operation)
  
  @export: ->
    sheet = []
    for id, style of engine.stylesheets.dumps
      for rule in (style.sheet.rules || style.sheet.cssRules)
        text = rule.cssText.replace /\[matches~="(.*?)"\]/g, (m, selector) ->
          selector.replace(/@[^↓]+/g, '').replace(/↓&/g, '').replace(/↓/g, ' ')
        sheet.push text

    return sheet.join('')

  @getSelector: (operation) ->
    return @getSelectors(operation).join(', ')

  @getSelectors: (operation) ->
    parent = operation
    results = wrapped = custom = undefined

    # Iterate parent commands
    while parent

      # Append condition id to path
      if parent.command.type == 'Condition' && !parent.global
        if results
          for result, index in results
            results[index] = ' ' + @getCustomSelector(parent.command.key, result)
      
      # Add rule selector to path
      else if parent.command.type == 'Iterator'
        query = parent[1]

        selectors = []
        # Prepend selectors with selectors of a parent rule
        if results?.length
          update = []

          for result, index in results
            if result.substring(0, 12) == ' [matches~="'
              update.push ' ' + @getCustomSelector(query.command.path, result)
            else
              for selector in @getRuleSelectors(parent[1])
                update.push selector + result
          results = update
        # Wrap custom selectors
        else 
          results = @getRuleSelectors(parent[1], true)


      parent = parent.parent

    return results

  @getRuleSelectors: (operation) ->
    if operation[0] == ','
      for index in [1 ... operation.length] by 1
        @getRuleSelector(operation[index], operation.command)
    else
      return [@getRuleSelector(operation)]

  @getRuleSelector: (operation, parent) ->
    command = operation.command
    path = command.path
    if path.charAt(0) == '&'
      if (key = path.substring(1)) == command.key
        return key
      else
        return @getCustomSelector((parent || command).path)

    if (command.selector || command.key) == path
      return ' ' + path
    else
      return ' ' + @getCustomSelector((parent || command).path)

  @getCustomSelector: (selector, suffix, prefix) ->
    DESCEND = @prototype.DESCEND
    selector = selector.replace(/\s+/g, DESCEND)
    if suffix
      if suffix.charAt(0) == ' '
        suffix = suffix.substring(1)
      if suffix.substring(0, 11) == '[matches~="'
        suffix = DESCEND + suffix.substring(11)
      else
        suffix = DESCEND + suffix.replace(/\s+/g, DESCEND) + '"]'
    else
      suffix = '"]'
    return '[matches~="' + selector + suffix

  @getCanonicalSelector: (selector) ->
    selector = selector.trim()
    selector = selector.
      replace(@CanonicalizeSelectorRegExp, ' ').
      replace(/\s+/g, @prototype.DESCEND)#.
    return selector

  @match: (node, continuation) ->
    return unless node.nodeType == 1
    if (index = continuation.indexOf(@prototype.DESCEND)) > -1
      continuation = continuation.substring(index + 1)
    continuation = @getCanonicalSelector(continuation)
    node.setAttribute('matches', (node.getAttribute('matches') || '') + ' ' + continuation.replace(/\s+/, @prototype.DESCEND))
  
  @unmatch: (node, continuation) ->
    return unless node.nodeType == 1
    if matches = node.getAttribute('matches')
      if (index = continuation.indexOf(@prototype.DESCEND)) > -1
        continuation = continuation.substring(index + 1)
      path = ' ' + @getCanonicalSelector(continuation)
      if matches.indexOf(path) > -1
        node.setAttribute('matches', matches.replace(path,''))


  # Dont add @import() to the path for global level stylesheets
  getKey: (engine, operation, continuation, node) ->
    if !node && continuation && continuation.lastIndexOf(@DESCEND) == -1
      return
    return @key

class Stylesheet.Import extends Query
  type: 'Import'

  relative: true
  
  signature: [
    'source': ['Selector', 'String', 'Node']
    [
      'type': ['String']
      'text': ['String']
    ]
  ]
      
  @define
    "directive": (name, type, text, engine, operation, continuation, scope) ->
      engine.Stylesheet.Import[name]::execute(type, text, undefined, engine, operation, continuation, scope)

    # Load & evaluate stylesheet
    "import": (node, type, method, engine, operation, continuation, scope) ->
      if typeof node == 'string'
        src = node
        node = undefined
      else
        unless src = @getUrl(node)
          text = node.innerText

        type ||= node.getAttribute?('type')

      
      path = @getGlobalPath(engine, operation, continuation, node)
      if stylesheet = engine.queries[path]
        command = stylesheet.command
        stylesheet.splice(0)
        if node.parentNode
          command.users = 0
          @uncontinuate(engine, path)
          if text
            stylesheet.push.apply(stylesheet, command.parse(engine, type, text))
            @continuate(engine, path, )
            return
        else
          @clean(engine, path)
          return 
      else
        stylesheet = []
        command = stylesheet.command = new engine.Stylesheet(engine, operation, continuation, node)
        command.key = @getGlobalPath(engine, operation, continuation, node, 'import')
        command.source = path

        if node?.getAttribute('scoped')?
          node.scoped = command.scoped = true


      if text
        stylesheet.push.apply(stylesheet, command.parse(engine, type, text))

      else unless command.xhr
        engine.updating.block(engine)
        command.resolver = (text) =>
          command.resolver = undefined
          stylesheet.push.apply(stylesheet, command.parse(engine, type, text))
          console.log('subscribe', continuation, 'to', stylesheet.command.key)
          @continuate(engine, command.source)
          if engine.updating.unblock(engine) && async
            engine.engine.commit()
        @resolve src, method, command.resolver
        async = true



      return stylesheet

  resolve: (url, method, callback) ->
    xhr = new XMLHttpRequest()
    xhr.onreadystatechange = =>
      if xhr.readyState == 4 && xhr.status == 200
        callback(xhr.responseText)
    xhr.open(method && method.toUpperCase() || 'GET', url)
    xhr.send()


  after: (args, result, engine, operation, continuation, scope) ->
    node = if args[0]?.nodeType == 1 then args[0] else scope
    path = result.command.source
    @set engine, path, result

    contd = @delimit(continuation, @DESCEND)
    # Subscribe to @parse
    @subscribe(engine, result, contd, scope, path)
    
    # Subscribe to @import
    @subscribe(engine, result, contd, scope, node)

    if result.command.users == 0
      @continuate(engine, path)


    return result

  ascend: (engine, operation, continuation, scope, result) ->
    if result.length == 0
      return

    @schedule(engine, result, @delimit(continuation, @DESCEND), scope)
    return


  write: (engine, operation, continuation, scope, node) ->
    return true

  getUrl: (node) ->
    return node.getAttribute('href') || node.getAttribute('src')

  getId: (node) ->
    return @getUrl(node) || node._gss_id

  formatId: (id) ->
    if (i = id.lastIndexOf('/')) > -1
      id = id.substring(i + 1)
    return id

  getLocalPath: (engine, operation, continuation, node) ->
    return @getGlobalPath(engine, operation, continuation, node)

  getGlobalPath: (engine, operation, continuation, node, command = 'parse')-> 
    index = operation[0] == 'directive' && 2 || 1
    if typeof operation[index] == 'string'
      id = operation[index]
    else
      if !node? && continuation
        node = @getByPath(engine, continuation)
      id = @getId(node)
    return '@' + command + '(' + @formatId(id) + ')'


module.exports = Stylesheet