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

    @_repairing = null
    if queries = @lastOutput = @buffer
      @buffer = undefined
      if @removed
        for id in @removed
          @remove id
        @removed = undefined
      for query, index in queries by 3
        break unless query
        continuation = queries[index + 1]
        scope = queries[index + 2]
        @output.pull query, continuation, scope
    repairing = @_repairing
    @_repairing = undefined
    if repairing
      for property, value of repairing
        if plurals = @_plurals[property]
          for plural, index in plurals by 3
            @repair property, plural, plurals[index + 1], plurals[index + 2]
    if @removing
      for node in @removing
        delete node._gss_id

    console.log('Updated', @updated)
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

  # Manually add element to collection, handle dups
  # Also stores path which can be used to remove elements
  add: (node, continuation, operation, scope, key) ->
    collection = @get(continuation)
    (collection ||= @[continuation] = []).manual = true
    console.error('adding', node, collection, continuation)
    keys = collection.keys ||= []
    if collection.indexOf(node) == -1
      index = collection.push(node)
      keys.splice(index - 1, 0, key)
    else
      (collection.duplicates ||= []).push(node)
      keys.push(key)
    return collection

  # Return collection by path & scope
  get: (operation, continuation, old) ->
    if typeof operation == 'string'
      result = @[operation]
      # Return stuff that was removed this tick when cleaning up
      if old && (updated = @updated?[operation]?[3])
        if updated.length != undefined
          if result
            if result.length == undefined
              result = [result]
            else
              result = Array.prototype.slice.call(result)
            for upd in updated
              if result.indexOf(upd) == -1
                result.push(upd)
          else
            result ||= updated

      if typeof result == 'string'
        return @[result]
      return result

  unwatch: (id, continuation, plural, quick) ->
    if continuation != true
      refs = @engine.getPossibleContinuations(continuation)
    index = 0
    console.error('unwatch', id, continuation)
    return unless (watchers = typeof id == 'object' && id || @_watchers[id])
    while watcher = watchers[index]
      contd = watchers[index + 1]
      if refs && refs.indexOf(contd) == -1
        index += 3
        continue
      subscope = watchers[index + 2]
      watchers.splice(index, 3)
      unless quick
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
        length = collection.length
        keys = collection.keys
        duplicate = null
        if (duplicates = collection.duplicates)
          for dup, index in duplicates
            if dup == node
              if (!keys || keys[length + index] == manual)
                duplicates.splice(index, 1)
                if keys
                  keys.splice(length + index, 1, 0)
                return
              else
                duplicate = index

        # Remove element from collection manually
        if operation && collection?.length && manual
          if (index = collection.indexOf(node)) > -1
            # Fall back to duplicate with a different key
            if keys
              return unless keys[index] == manual
              if duplicate?
                collection.duplicates.splice(duplicate, 1)
                keys[index] = keys[duplicate + length]
                keys.splice(duplicate + length, 1)
                return
            collection.splice(index, 1)
            if keys
              keys.splice(index, 1)
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
          if manual && @isPaired(null, manual)
            for item in result
              @unpair(path, item)
          else
            path += id

            @clean(path)
        else if result
          @unpair path, result
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
    if path.def
      path = (continuation || '') + (path.uid || '') + (path.key || '')
    continuation = path if bind
    console.error('CLEAN', Array.prototype.slice.call(arguments), @[continuation], @[path])
    @engine.values.clean(path, continuation, operation, scope)
    unless plural
      result = @get(path)
      if result
        @unpair path, continuation
      if (result = @get(path, undefined, true)) != undefined
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

    if @_plurals?[path]
      delete @_plurals[path]

    if @lastOutput
      @unwatch(@lastOutput, path, null, true)
    @unwatch(@engine.scope._gss_id, path)
    if !result || result.length == undefined
      @engine.expressions.push(['remove', @engine.getContinuation(path)], true)
    return true

  # Update bindings of two plural collections
  repair: (path, key, operation, scope) ->

    leftUpdate = @updated?[path]
    leftNew = (if leftUpdate then leftUpdate[0] else @get(path)) || []
    leftOld = (if leftUpdate then leftUpdate[1] else @get(path)) || []
    rightPath = path + '–' + key
    rightUpdate = @updated?[rightPath]

    console.error(rightPath, rightUpdate, @, @updated)
    rightNew = (if rightUpdate then rightUpdate[0] else @get(rightPath)) || []
    rightOld = (if rightUpdate then rightUpdate[1] else @get(rightPath)) || []

    removed = []
    added = []

    for object, index in leftOld
      if leftNew[index] != object || rightOld[index] != rightNew[index]
        if rightOld && rightOld[index]
          removed.push([object, rightOld[index]])
        if leftNew[index] && rightNew[index]
          added.push([leftNew[index], rightNew[index]])
    if leftOld.length < leftNew.length
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
      contd = prefix + operation.path.substring(0, operation.path.length - operation.key.length)
      console.error(666, contd, key)
      @engine.expressions.pull operation, contd, scope, true, true


    console.log(@updated, [path, key], [leftNew, leftOld], [rightNew, rightOld], "NEED TO REBALANCE DIS", added, removed)
  pluralRegExp: /(?:^|–)([^–]+)(\$[a-z0-9-]+)–([^–]+)–?$/i
                  # path1 ^        id ^        ^path2   

  isPaired: (operation, continuation) ->
    if match = continuation.match(@pluralRegExp)
      if !@engine.isCollection(@[continuation]) && (match[3]).indexOf('$') == -1
        console.error(match, continuation, @[continuation])
        return
      if operation && operation.parent.def.serialized
        return
      return match

  unpair: (continuation, node) ->
    return unless match = @isPaired(null, continuation)
    console.info(continuation, node, match)
    collection = @get(match[1])
    return unless plurals = @_plurals?[match[1]]
    for plural, index in plurals by 3
      @remove(node, match[1] + '–' + plural, plurals[index + 1], plurals[index + 2], continuation)
    return

  # Check if operation is plurally bound with another selector
  # Choose a good match for element from the first collection
  # Currently bails out and schedules re-pairing 
  pair: (continuation, operation, scope, result) ->
    return unless match = @isPaired(operation, continuation)
    plurals = (@_plurals ||= {})[match[1]] ||= []
    if plurals.indexOf(operation.path) == -1
      plurals.push(operation.path, operation, scope)
    collection = @get(match[1])
    element = @engine.elements[match[2]]
    #if (operation.path != match[3])
    console.log(777, continuation, operation, operation.path, result)
    

    if @engine.isCollection(result)
      if operation.key == operation.path
        path = match[1] + '–' + operation.path
        console.info(@get(continuation), @get(path))
        if old = @updated?[path]?[1] || @get(path)
          @updated[path] ||= [result, old, undefined, undefined]
        @set(path, result)
      else
        for node in result
          @add(node, match[1] + '–' + operation.path, operation, scope, continuation)
    else
      @add(result, match[1] + '–' + operation.path, operation, scope, continuation)

    console.error("FUHRER", result, match[1] + '–' + operation.path, @[continuation], operation.path, match, continuation, collection.indexOf(element))
    if @_repairing != undefined
      schedule = (@_repairing ||= {})[match[1]] = true
      return -1
    return collection.indexOf(element)


  # Check if selector is bound to current scope's element
  getContext: (args, operation, scope, node) ->
    if (args.length != 0 && (args[0]?.nodeType))
      return args[0]
    if !operation.bound
      return @engine.scope
    return scope;

  # If a query selects element from some other node than current scope
  # Maybe somebody else calculated it already
  fetch: (node, args, operation, continuation, scope) ->
    node ||= @getContext(args, operation, scope, node)
    if @updated# && node != scope
      query = @getQueryPath(operation, @engine.identify(node))
      console.log('fetched', query, @updated[query], continuation)
      return @updated[query]

  # Filter out known nodes from DOM collections
  update: (node, args, result, operation, continuation, scope) ->
    node ||= @getContext(args, operation, scope, node)
    path = @getQueryPath(operation, continuation)
    old = @get(path)

    # Normalize query to reuse results
    query = @getQueryPath(operation, @engine.identify(node))
    if group = @updated?[query]
      old ||= group[1]
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
        watchers.push(operation, continuation, scope)
    
    return if noop
    
    @set path, result

    if plurals = @_plurals?[path]
      (@_repairing ||= {})[path] = true

    unless @updated == undefined 
      @updated ||= {}
      group = @updated[path] ||= group || [result, old, added, removed]
      @updated[query] = group if query

    contd = continuation
    if contd && contd.charAt(contd.length - 1) == '–'
      contd = @engine.expressions.log(operation, contd)
    if continuation && (index = @pair(contd, operation, scope, result))?
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
    if continuation
      if continuation.nodeType
        return @engine.identify(continuation) + operation.path
      else
        return continuation + operation.key
    else
      return operation.key

module.exports = Queries