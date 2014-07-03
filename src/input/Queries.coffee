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
    debugger
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
      if @_rebalancing
        for property, value of @_rebalancing
          @rebalance property, value
        @_rebalancing = undefined
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
    (collection ||= []).manual = true
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
  # Remove observers and cached node lists
  remove: (id, continuation, operation, scope, manual) ->

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
          for plural in plurals by 3
            subpath = continuation + id + '–' + plural
            console.log(1, continuation + id + '–' + plural, @get(continuation + id + '–' + plural))
            @clean(continuation + id + '–' + plural, null, null, null, null, true)
            console.log(2, continuation + id + '–' + plural, @get(continuation + id + '–' + plural))
            debugger
          console.error('loleo', continuation, @_plurals?[continuation])

        if watchers = @_watchers[id]
          ref = continuation + (collection && collection.length != undefined && id || '')
          # I'm not super excited about this
          for refs in @engine.getPossibleContinuations(ref)
            index = 0
            while watcher = watchers[index]
              contd = watchers[index + 1]
              unless contd == refs
                index += 3
                continue
              subscope = watchers[index + 2]
              watchers.splice(index, 3)
              @clean(watcher, contd, watcher, subscope, true)
            delete @_watchers[id] unless watchers.length
        path = continuation
        if (result = @engine.queries.get(path))?.length?
          path += id
          @clean(path)

      # Remove cached DOM query
      else 
        @clean(id, continuation, operation, scope)
      
      delete @[continuation] if collection && !collection.length


    else if node
      # Detach queries attached to an element when removing element by id
      if watchers = @_watchers[id]
        index = 0
        while watcher = watchers[index]
          @clean(watcher, watchers[index + 1], watcher, watchers[index + 2])
          index += 3
        delete @_watchers[id] 
      (@engine.removing ||= []).push(node)

    @

  clean: (path, continuation, operation, scope, bind, plural) ->
    if path.def
      path = (continuation || '') + (path.uid || '') + (path.key || '')
    continuation = path if bind
    @engine.values.clean(path, continuation, operation, scope)
    unless plural
      if (result = @get(path)) != undefined

        if result
          if parent = operation?.parent
            parent.
            def.release?.call(@engine, result, operation, continuation, scope)

          if result.length != undefined
            copy = result.slice()
            @remove child, path, operation for child in copy
          else if typeof result == 'object'
            @remove result, path, operation

        if scope && operation.def.cleaning
          @remove @engine.recognize(scope), path, operation
    delete @[path]
    if !result || result.length == undefined
      @engine.expressions.push(['remove', @engine.getContinuation(path)], true)
    return true

  isBoundToCurrentContext: (args, operation, scope, node) ->
    if (args.length != 0 && !(args[0]?.nodeType))
      if !operation.bound && (!scope || scope != node || scope == @engine.scope)
        return false
    return true;

  rebalance: (path, right) ->
    leftNew = @updated?[path]?[0] || @get(path)
    leftOld = @updated?[path]?[1] || @get(path)
    if right.new
      rightNew = right.new
      rightOld = right.old
    else # fixme
      rightPath = path + @engine.recognize(leftNew[0]) + '–' + right.key
      rightNew = @updated?[rightPath]?[0] || @get(rightPath)
      rightOld = @updated?[rightPath]?[1] || @get(rightPath)

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
      1#@clean(path + @engine.recognize(pair[0]) + '–' + right.key, null, null, null, null, true)
    console.log(@buffer, [path, right], [leftNew, leftOld], "NEED TO REBALANCE DIS", added, removed)

  pluralRegExp: /(?:^|–)([^–]+)(\$[a-z0-9-]+)–([^–]*)$/i
                  # path1 ^        id ^        ^path2   

  # Choose a good match from given collection 
  # for an element found by another plural selector
  getPluralBindingIndex: (continuation, operation, scope, result) ->
    if plural = continuation.match(@pluralRegExp)
      console.error("FUHRER", plural, continuation)
      plurals = (@_plurals ||= {})[plural[1]] ||= []
      if plurals.indexOf(plural[3]) == -1
        plurals.push(plural[3], operation, scope)
      collection = @get(plural[1])
      element = @engine.elements[plural[2]]
      (@_rebalancing ||= {})[plural[1]] ||= {
        operation: operation
        continuation: continuation
        key: plural[3]
        old: @updated?[continuation]?[1] || @get(continuation)
        new: result
      }
        #@rebalance plural, continuation, result
        # remove paired element, update followers
      return collection.indexOf(element)
    return

  fetch: (node, args, operation, continuation, scope) ->
    if @updated && !@isBoundToCurrentContext(args, operation, scope, node)
      query = @getQueryPath(operation, @engine.identify(scope))
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
        result = group[0]
        scoped = true unless @[path]?
      debugger if scoped
      console.error(args, scope, scoped, 'SCOPEEED', path, operation, result)

    if (group ||= @updated?[path])
      if scoped
        added = result
      else
        return if group.indexOf(operation) > -1
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
      if watchers = @_watchers[id]
        for watcher, index in watchers by 3
          if watcher == operation && watchers[index + 1] == continuation && watchers[index + 2] == scope
            dupe = true
            break
      else
        watchers = @_watchers[id] = []
      unless dupe
        debugger if continuation == '#box1'
        watchers.push(operation, continuation, scope)
    
    return if noop
    
    @set path, result

    if plurals = @_plurals?[path]
      for plural, index in plurals by 3
        (@_rebalancing ||= {})[path] ||= { 
          key: plural, 
          operation: plurals[index + 1], 
          scope: plurals[index + 2] 
        }

    unless @updated == undefined 
      group = (@updated ||= {})[query || path] ||= []
      if group.length
        group.push operation
      else
        group.push result, old, added, removed, operation

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