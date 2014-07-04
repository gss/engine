# - Listens for changes in DOM,
# - Invalidates cached DOM Queries
#   by bruteforcing combinators on reachable elements

# Input:  MutationEvent, processes observed mutations
# Output: Expressions, revaluates expressions

# State:  - `@[path]`: elements and collections by selector path
#         - `@_watchers[id]`: dom queries by element id 

class Queries
  options:
    subtree: true
    childList: true
    attributes: true
    characterData: true
    attributeOldValue: true

  Observer: 
    window.MutationObserver || window.WebKitMutationObserver || window.JsMutationObserver

  constructor: (@engine, @output) ->
    @_watchers = {}
    @listener = new @Observer @pull.bind(this)
    @connect()

  connect: ->
    @listener.observe @engine.scope, @options 

  disconnect: ->
    @listener.disconnect()

  # Re-evaluate updated queries
  # Watchers are stored in a single array in groups of 3 properties
  push: (query, continuation, scope) ->
    if @buffer == undefined
      @output.pull query, continuation, scope
    else if !@buffer || @engine.values.indexOf(@buffer, query, continuation, scope) == -1
      (@buffer ||= []).push(query, continuation, scope)
    return

  # Listen to changes in DOM to broadcast them all around, update queries in batch
  pull: (mutations) ->
    @buffer = @updated = null
    capture = @output.capture() 
    @engine.start()
    for mutation in mutations
      switch mutation.type
        when "attributes"
          @$attribute(mutation.target, mutation.attributeName, mutation.oldValue)
        when "childList"
          @$children(mutation.target, mutation)

      @$intrinsics(mutation.target)

    @_rebalancing = null
    if queries = @lastOutput = @buffer
      @buffer = undefined
      if @removed
        for id in @removed
          @remove id
        @removed = undefined
      for query, index in queries by 3
        continuation = queries[index + 1]
        scope = queries[index + 2]
        @output.pull query, continuation, scope
    console.error('wtf', @_rebalancing, queries, @updated)
    rebalancing = @_rebalancing
    @_rebalancing = undefined
    if rebalancing
      for property, value of rebalancing
        if plurals = @_plurals[property]
          for plural, index in plurals by 3
            @rebalance property, plural, plurals[index + 1], plurals[index + 2]
    if @removing
      for node in @removing
        delete node._gss_id

    @buffer = @updated = undefined
    @output.flush() if capture

  $attribute: (target, name, changed) ->
    # Notify parents about class and attribute changes
    if name == 'class' && typeof changed == 'string'
      klasses = target.classList
      old = changed.split(' ')
      changed = []
      for kls in old
        changed.push kls unless kls && klasses.contains(kls)
      for kls in klasses
        changed.push kls unless kls && old.indexOf(kls) > -1

    parent = target
    while parent
      $attribute = target == parent && '$attribute' || ' $attribute'
      @match(parent, $attribute, name, target)
      if changed?.length && name == 'class'
        $class = target == parent && '$class' || ' $class'
        for kls in changed
          @match(parent, $class, kls, target)
      break if parent == @engine.scope
      break unless parent = parent.parentNode
    @

  index: (update, type, value) ->
    if group = update[type]
      return unless group.indexOf(value) == -1
    else
      update[type] = []
    update[type].push(value)

  $children: (target, mutation) ->
    # Invalidate sibling observers
    added = []
    removed = []
    for child in mutation.addedNodes
      if child.nodeType == 1
        added.push(child)
    for child in mutation.removedNodes
      if child.nodeType == 1
        if (index = added.indexOf(child)) > -1
          added.splice index, 1
        else
          removed.push(child)
    changed = added.concat(removed)
    changedTags = []
    for node in changed
      tag = node.tagName
      if changedTags.indexOf(tag) == -1
        changedTags.push(tag)

    prev = next = mutation
    firstPrev = firstNext = true
    while (prev = prev.previousSibling)
      if prev.nodeType == 1
        if firstPrev
          @match(prev, '+') 
          @match(prev, '++')
          firstPrev = false
        @match(prev, '~', undefined, changedTags)
        @match(prev, '~~', undefined, changedTags)
    while (next = next.nextSibling)
      if next.nodeType == 1
        if firstNext
          @match(next, '!+') 
          @match(next, '++')
          firstNext = false
        @match(next, '!~', undefined, changedTags)
        @match(next, '~~', undefined, changedTags)


    # Invalidate descendants observers
    @match(target, '>', undefined, changedTags)
    allAdded = []
    allRemoved = []

    for child in added
      @match(child, '!>', undefined, target)
      allAdded.push(child)
      allAdded.push.apply(allAdded, child.getElementsByTagName('*'))
    for child in removed
      allRemoved.push(child)
      allRemoved.push.apply(allRemoved, child.getElementsByTagName('*'))
    allChanged = allAdded.concat(allRemoved)

    # Generate map of qualifiers to invalidate (to re-query native selectors)
    update = {}
    for node in allChanged
      for attribute in node.attributes
        switch attribute.name
          when 'class'
            for kls in node.classList
              @index update, ' $class', kls
          when 'id'
            @index update, ' $id', attribute.value

        @index update, ' $attribute', attribute.name
      prev = next = node  
      while prev = prev.previousSibling
        if prev.nodeType == 1
          @index update, ' +', prev.tagName
          break
      while next = next.nextSibling
        if next.nodeType == 1
          break

      @index update, ' $pseudo', 'first-child' unless prev
      @index update, ' $pseudo', 'last-child' unless next
      @index update, ' +', child.tagName

    parent = target
    while parent.nodeType == 1
      # Let parents know about inserted nodes
      @match(parent, ' ', undefined, allAdded)
      for child in allAdded
        @match(child, '!', undefined, parent)

      for prop, values of update
        for value in values
          if prop.charAt(1) == '$' # qualifiers
            @match(parent, prop, value)
          else
            @match(parent, prop, undefined, value)

      break if parent == @engine.scope
      break unless parent = parent.parentNode

    # Clean removed elements by id
    for removed in allRemoved
      if id = @engine.recognize(removed)
        (@removed ||= []).push(id)
    @

  $intrinsics: (node) ->
    return unless document.body.contains(node)
    @engine._onResize(node)

  # Manually add element to collection
  add: (node, continuation, operation, scope) ->
    collection = @get(continuation)
    (collection ||= @[continuation] = []).manual = true
    console.error('adding', node, collection, continuation)
    if collection.indexOf(node) == -1
      collection.push(node)
    else
      (collection.duplicates ||= []).push(node)
    return collection

  # Return collection by path & scope
  get: (operation, continuation) ->
    if typeof operation == 'string'
      result = @[operation]
      if typeof result == 'string'
        return @[result]
      return result

  unwatch: (id, continuation, plural, refs) ->
    if continuation != true
      refs ||= @engine.getPossibleContinuations(continuation)
    index = 0
    return unless watchers = @_watchers[id]
    while watcher = watchers[index]
      contd = watchers[index + 1]
      if refs && refs.indexOf(contd) == -1
        index += 3
        continue
      subscope = watchers[index + 2]
      watchers.splice(index, 3)
      @clean(watcher, contd, watcher, subscope, true, plural)
    delete @_watchers[id] unless watchers.length

  # Remove observers and cached node lists
  remove: (id, continuation, operation, scope, manual, plural) ->
    console.error('REMOVE', Array.prototype.slice.call(arguments))
    if typeof id == 'object'
      node = id
      id = @engine.identify(id)
    else
      node = @engine.elements[id]

    if continuation
      if collection = @get(continuation)
        # Dont remove it if element matches more than one selector
        if (duplicates = collection.duplicates)
          if (index = duplicates.indexOf(node)) > -1
            duplicates.splice(index, 1)
            return

        # Remove element from collection manually
        if operation && collection?.length && manual
          if (index = collection.indexOf(node)) > -1
            collection.splice(index, 1)
            cleaning = continuation unless collection.length

      # Detach observer and its subquery when cleaning by id
      if node
        if plurals = @_plurals?[continuation]
          for plural, index in plurals by 3
            subpath = continuation + id + '–' + plural
            @remove plurals[index + 2], continuation + id + '–', null, null, null, true
            @clean(continuation + id + '–' + plural, null, null, null, null, true)
            console.log('lol', plurals, scope, continuation + id + '–' + plural, @get(continuation + id + '–' + plural))

        ref = continuation + (collection && collection.length != undefined && id || '')
        @unwatch(id, ref, plural)

        path = continuation
        if (result = @engine.queries.get(path))?.length?
          path += id
          @clean(path)

      # Remove cached DOM query
      else

        @clean(id, continuation, operation, scope)
      
      if collection && !collection.length
        delete @[continuation] 

    else if node
      # Detach queries attached to an element when removing element by id
      @unwatch(id, true)

    @

  clean: (path, continuation, operation, scope, bind, plural) ->
    console.error('CLEAN', Array.prototype.slice.call(arguments))
    if path.def
      path = (continuation || '') + (path.uid || '') + (path.key || '')
    continuation = path if bind
    @engine.values.clean(path, continuation, operation, scope)
    unless plural
      if (result = @get(path)) != undefined
        if result
          if parent = operation?.parent
            parent.def.release?.call(@engine, result, operation, continuation, scope)
          if result.length != undefined
            copy = result.slice()
            for child in copy
              @remove child, path, operation 
          else if typeof result == 'object'
            @remove result, path, operation

        if scope && operation.def.cleaning
          @remove @engine.recognize(scope), path, operation
    delete @[path]

    @unwatch(@engine.scope._gss_id, path)
    if !result || result.length == undefined
      @engine.expressions.push(['remove', @engine.getContinuation(path)], true)
    return true

  isBoundToCurrentContext: (args, operation, scope, node) ->
    if (args.length != 0 && !(args[0]?.nodeType))
      if !operation.bound && (!scope || scope != node || scope == @engine.scope)
        return false
    return true;

  rebalance: (path, key, operation, scope) ->

    leftUpdate = @updated?[path]
    leftNew = (if leftUpdate then leftUpdate[0] else @get(path)) || []
    leftOld = (if leftUpdate then leftUpdate[1] else @get(path)) || []
    rightPath = path + @engine.recognize(leftNew[0] || leftOld[0]) + '–' + key
    rightUpdate = @updated?[rightPath]

    console.error(rightPath, rightUpdate, @)
    rightNew = (if rightUpdate then rightUpdate[0] else @get(rightPath)) || []
    rightOld = (if rightUpdate then rightUpdate[1] else @get(rightPath)) || []

    removed = []
    added = []

    newLeft = @get(path)

    for object, index in leftOld
      if leftNew[index] != object || rightOld[index] != rightNew[index]
        if rightOld && rightOld[index]
          removed.push([object, rightOld[index]])
        if leftNew[index]
          added.push([leftNew[index], rightNew[index]])
    for index in [leftOld.length ... leftNew.length]
      if rightNew[index]
        added.push([leftNew[index], rightNew[index]])

    for pair in removed
      console.error('remove', path + @engine.recognize(pair[0]) + '–')
      @remove(scope, path + @engine.recognize(pair[0]) + '–', null, null, null, true)
      @clean(path + @engine.recognize(pair[0]) + '–' + key, null, null, null, null, true)
    
    for pair in added
      prefix = path + @engine.recognize(pair[0]) + '–'
      # not too good
      contd = prefix + key.substring(0, key.length - operation.key.length)
      console.error(666, contd, key)
      @engine.expressions.pull operation, contd, scope, true, true


    console.log(@updated, [path, key], [leftNew, leftOld], [rightNew, rightOld], "NEED TO REBALANCE DIS", added, removed)
    debugger
  pluralRegExp: /(?:^|–)([^–]+)(\$[a-z0-9-]+)–([^–]+)–?$/i
                  # path1 ^        id ^        ^path2   

  # Choose a good match from given collection 
  # for an element found by another plural selector
  getPluralBindingIndex: (continuation, operation, scope, result) ->
    if match = continuation.match(@pluralRegExp)
      plurals = (@_plurals ||= {})[match[1]] ||= []
      if plurals.indexOf(match[3]) == -1
        plurals.push(match[3], operation, scope)
      collection = @get(match[1])
      element = @engine.elements[match[2]]

      console.error("FUHRER", match, continuation, collection.indexOf(element))
      if @_rebalancing != undefined
        schedule = (@_rebalancing ||= {})[match[1]] = true
        return -1
      return collection.indexOf(element)
    return

  fetch: (node, args, operation, continuation, scope) ->
    if @updated && !@isBoundToCurrentContext(args, operation, scope, node)
      query = @getQueryPath(operation, @engine.identify(scope))
      console.log('fetched', query, @updated[query], continuation)
      return @updated[query]

  # Filter out known nodes from DOM collections
  update: (node, args, result, operation, continuation, scope) ->
    node ||= scope || args[0]
    path = @getQueryPath(operation, continuation)
    old = @get(path)

    # Check if query fetches elements relative to something else than current scope 
    console.log(path, args, operation, [scope, node], @isBoundToCurrentContext(args, operation, scope, node))
    unless @isBoundToCurrentContext(args, operation, scope, node)
      query = @getQueryPath(operation, @engine.identify(scope || @engine.scope))
      if group = @updated?[query]
        #old = group[1]
        result = group[0]
        unless @[path]?
          scoped = true 
        else
          @[path] = group[0]
      console.error(@updated, group, query, args, scope, scoped, 'SCOPEEED', path, operation, result)
    
    if (group ||= @updated?[path])
      if scoped
        added = result
      else
        added = group[2]
        removed = group[3]
    else

      isCollection = result && result.length != undefined
      if old == result || (old == undefined && @removed)
        noop = true unless result && result.manual
        old = undefined
      
      # Clean refs of nodes that dont match anymore
      if old
        if old.length != undefined
          removed = undefined
          o = old.slice()
          for child in o
            if !result || Array.prototype.indexOf.call(result, child) == -1
              @remove child, path, operation, scope
              (removed ||= []).push child
        else if !result
          @clean(path)

      # Register newly found nodes
      if isCollection
        added = undefined
        for child in result
          if !old || Array.prototype.indexOf.call(old, child) == -1  
            (added ||= []).push child

        # Snapshot live node list for future reference
        if result && result.item
          result = Array.prototype.slice.call(result, 0)
      else
        added = result

    # Subscribe node to the query
    if id = @engine.identify(node)
      watchers = @_watchers[id] ||= []
      if (@engine.values.indexOf(watchers, operation, continuation, scope) == -1)
        if continuation == "style$2….a$a1–.b"
          debugger
        watchers.push(operation, continuation, scope)
    
    return if noop
    
    @set path, result

    if plurals = @_plurals?[path]
      (@_rebalancing ||= {})[path] = true

    unless @updated == undefined 
      @updated ||= {}
      group = @updated[path] ||= group || [result, old, added, removed]
      @updated[query] = group if query

    contd = continuation
    if contd && contd.charAt(contd.length - 1) == '–'
      contd = @engine.expressions.log(operation, contd)
    if @engine.isCollection(result) && continuation &&
    (index = @getPluralBindingIndex(contd, operation, scope, result))?
      if index == -1
        return
      else
        return result[index]

    return if removed && !added
    return added

  set: (path, result) ->
    if result
      @[path] = result
    else
      delete @[path]


  # Check if a node observes this qualifier or combinator
  match: (node, group, qualifier, changed) ->
    return unless id = node._gss_id
    return unless watchers = @_watchers[id]
    for operation, index in watchers by 3
      if groupped = operation[group]
        continuation = watchers[index + 1]
        scope = watchers[index + 2]
        # Check qualifier value
        if qualifier
          @qualify(operation, continuation, scope, groupped, qualifier)
        # Check combinator and tag name of a given element
        else if changed.nodeType
          @qualify(operation, continuation, scope, groupped, changed.tagName, '*')
        # Check combinator and given tag name
        else if typeof changed == 'string'
          @qualify(operation, continuation, scope, groupped, changed, '*')
        # Ditto in bulk: Qualify combinator with nodelist or array of tag names
        else for change in changed
          if typeof change == 'string'
            @qualify(operation, continuation, scope, groupped, change, '*')
          else
            @qualify(operation, continuation, scope, groupped, change.tagName, '*')
    @

  # Check if query observes qualifier by combinator 
  qualify: (operation, continuation, scope, groupped, qualifier, fallback) ->
    if (indexed = groupped[qualifier]) || (fallback && groupped[fallback])
      @push(operation, continuation, scope)
    @

  getQueryPath: (operation, continuation) ->
    return (continuation && continuation + operation.key || operation.path)

module.exports = Queries