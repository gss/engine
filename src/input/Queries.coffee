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
    @listener.observe @engine.scope, @options 

  # Re-evaluate updated queries
  # Watchers are stored in a single array in groups of 3 properties
  push: (query, continuation, scope) ->
    if @buffer == undefined
      @output.pull query, continuation, scope
    else
      (@buffer ||= []).push(query, continuation, scope)
    return

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
      if changed && changed.length
        $class = target == parent && '$class' || ' $class'
        for kls in changed
          @match(parent, $class, kls, target)
      break if parent == @engine.scope
      break unless parent = parent.parentNode
    @

  $childList: (target, mutation) ->
    # Invalidate sibling observers
    added = []
    removed = []
    changed = []
    for child in mutation.addedNodes
      if child.nodeType == 1
        changed.push(child)
        added.push(child)
    for child in mutation.removedNodes
      if child.nodeType == 1
        changed.push(child)
        removed.push(child)
    prev = next = mutation
    firstPrev = firstNext = true
    while (prev = prev.previousSibling)
      if prev.nodeType == 1
        if firstPrev
          @match(prev, '+') 
          @match(prev, '++')
          firstPrev = false
        @match(prev, '~', undefined, changed)
        @match(prev, '~~', undefined, changed)
    while (next = next.nextSibling)
      if next.nodeType == 1
        if firstNext
          @match(next, '!+') 
          @match(next, '++')
          firstNext = false
        @match(next, '!~', undefined, changed)
        @match(next, '~~', undefined, changed)


    # Invalidate descendants observers
    @match(target, '>', undefined, changed)
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

    # Clean removed elements by id
    for removed in allRemoved
      if id = @engine.recognize(removed)
        @remove(id)

    # Generate map of qualifiers to invalidate (to re-query native selectors)
    update = {}
    for node in allChanged
      for attribute in node.attributes
        switch attribute.name
          when 'class'
            for kls in removed.classList
              if !update[' $class'] || update[' $class'].indexOf kls == -1
                (update[' $class'] ||= []).push kls
          when 'id'
            if !update[' $id'] || update[' $id'].indexOf kls == -1
              (update[' $id'] ||= []).push attribute.value
          else
            if !update[' $attribute'] || update[' $attribute'].indexOf kls == -1
              (update[' $attribute'] ||= []).push attribute.name
      prev = next = node  
      while prev = prev.previousSibling
        if prev.nodeType == 1
          (update[' +'] ||= []).push(prev)
          break
      while next = next.previousSibling
        if next.nodeType == 1
          break
      (update[' $pseudo'] ||= []).push('first-child') unless prev
      (update[' $pseudo'] ||= []).push('last-child') unless next
      (update[' +'] ||= []).push(child)
    console.log(update)

    parent = target
    while parent.nodeType == 1
      # Let parents know about inserted nodes
      @match(parent, ' ', undefined, allAdded)
      for child in allAdded
        @match(child, '!', undefined, parent)

      for prop, values of update
        for value in values
          if typeof value == 'object'
            @match(parent, prop, undefined, value)
          else
            @match(parent, prop, value)

      break if parent == @engine.scope
      break unless parent = parent.parentNode
    @

  # Listen to changes in DOM to broadcast them all around, update queries in batch
  pull: (mutations) ->
    @output.buffer = @buffer = null
    for mutation in mutations
      switch mutation.type
        when "attributes"
          @$attribute(mutation.target, mutation.attributeName, mutation.oldValue)
        when "childList"
          @$childList(mutation.target, mutation)

    if queries = @lastOutput = @buffer
      @buffer = undefined
      for query, index in queries by 3
        continuation = queries[index + 1]
        scope = queries[index + 2]
        @output.pull query, continuation, scope

    if buffer = @output.buffer
      @output.flush()
    return

  # Manually add element to collection
  add: (node, continuation, scope) ->
    if scope && scope != @engine.scope
      continuation = @engine.recognize(scope) + continuation
    collection = @[continuation] ||= []
    collection.manual = true
    if collection.indexOf(node) == -1
      collection.push(node)
    else
      (collection.duplicates ||= []).push(node)
    return collection

  # Return collection by path & scope
  get: (continuation, scope) ->
    if scope != @engine.scope
      continuation += @engine.recognize(scope)
    return @[continuation]

  # HOOK: Remove observers and cached node lists
  remove: (id, continuation, operation, scope) ->

    if typeof id == 'object'
      node = id
      id = @engine.recognize(id)
    if scope && scope != @engine.scope
      continuation = @engine.recognize(scope) + continuation

    console.error('remove', id, continuation)
    if continuation
      if collection = @[continuation]
        node ||= @engine.get(id)

        # Dont remove it if element matches more than one selector
        if (duplicates = collection.duplicates)
          if (index = duplicates.indexOf(node)) > -1
            duplicates.splice(index, 1)
            return

        # Remove element from collection manually
        if operation && collection && collection.length
          if (index = collection.indexOf(node)) > -1
            collection.splice(index, 1)
            cleaning = continuation unless collection.length

      # Detach observer and its subquery when cleaning by id
      if @engine[id]
        if watchers = @_watchers[id]
          ref = continuation + id
          index = 0
          while watcher = watchers[index]
            contd = watchers[index + 1]
            unless contd == ref
              index += 3
              continue
            watchers.splice(index, 3)
            path = (contd || '') + watcher.key
            @clean(path)
            console.log('remove watcher', path)
          delete @_watchers[id] unless watchers.length

        path = continuation
        if (result = @engine.queries[path])
          if result.length?
            path += id
            @clean(path)

      # Remove cached DOM query
      else 
        @clean(id, continuation, operation, scope)
        
      delete @[continuation] if collection && !collection.length
    else if node = @engine[id]
      # Detach queries attached to an element when removing element by id
      if watchers = @_watchers[id]
        index = 0
        while watcher = watchers[index]
          contd = watchers[index + 1]
          path = (contd || '') + watcher.key
          @remove(path, contd, watcher, watchers[index + 2])
          console.log('deleting', path)
          index += 3
        console.error('deleting watchers', watchers.slice())
        delete @_watchers[id] 
      delete @engine[id]

    @

  clean: (path, continuation, operation, scope) ->
    if result = @[path]
      if parent = operation && operation.parent
        if (pdef = parent.def) && pdef.release
          pdef.release(@engine, result, parent, scope)

      if result.length != undefined
        @remove child, path for child in result
      else
        @remove result, continuation
    delete @[path]
    if !result || result.length == undefined
      @engine.expressions.push(['remove', path], true)
    return true

  # Filter out known nodes from DOM collections
  update: (node, args, result, operation, continuation, scope) ->
    node ||= scope || args[0]
    path = (continuation && continuation + operation.key || operation.path)
    old = @[path]
    isCollection = result && result.length != undefined
    if old == result
      return unless result && result.manual
      old = undefined
    
    # Subscribe node to the query
    if id = @engine.identify(node)
      watchers = @_watchers[id] ||= []
      if watchers.indexOf(operation) == -1
        watchers.push(operation, continuation, node)
    
    # Clean refs of nodes that dont match anymore
    if old
      if old.length != undefined
        removed = undefined
        for child in old
          if !result || old.indexOf.call(result, child) == -1
            @remove child, path
            (removed ||= []).push child
      else if !result
        @clean(path)

    # Register newly found nodes
    if isCollection
      added = undefined
      for child in result
        if !old || watchers.indexOf.call(old, child) == -1  
          (added ||= []).push child

      # Snapshot live node list for future reference
      if result && result.item && (!old || removed || added)
        result = watchers.slice.call(result, 0)
    else
      added = result
    if result
      @[path] = result
    else
      delete @[path]

    console.log('found', result && (result.nodeType == 1 && 1 || result.length) || 0, ' by' ,path)
    return if removed && !added
    return added

  # Check if a node observes this qualifier or combinator
  match: (node, group, qualifier, changed) ->
    return unless id = node._gss_id
    return unless watchers = @_watchers[id]
    for operation, index in watchers by 3
      if groupped = operation[group]
        continuation = watchers[index + 1]
        scope = watchers[index + 2]
        if qualifier
          @qualify(operation, continuation, scope, groupped, qualifier)
        else if changed.nodeType
          @qualify(operation, continuation, scope, groupped, changed.tagName, '*')
        else for change in changed
          @qualify(operation, continuation, scope, groupped, change.tagName, '*')
    @

  # Check if query observes qualifier by combinator 
  qualify: (operation, continuation, scope, groupped, qualifier, fallback) ->
    if (indexed = groupped[qualifier]) || (fallback && groupped[fallback])
      @push(operation, continuation, scope)
    @

module.exports = Queries