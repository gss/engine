### Input: DOM Queries

 - Listens for changes in DOM,
 - Invalidates cached DOM Queries
   by bruteforcing combinators on reachable elements

 Input:  MutationEvent, processes observed mutations
 Output: Expressions, revaluates expressions

 State:  - `@[path]`: elements and collections by selector path
         - `@watchers[id]`: dom queries by element id 
###
Domain = require('../concepts/Domain')

class Queries extends Domain
  options:
    subtree: true
    childList: true
    attributes: true
    characterData: true
    attributeOldValue: true

  Observer: 
    window? && (window.MutationObserver || window.WebKitMutationObserver || window.JsMutationObserver)

  constructor: (@engine) ->
    @watchers = {}
    @listener = new @Observer @solve.bind(this)

  connect: ->
    @listener.observe @engine.scope, @options 

  disconnect: ->
    @listener.disconnect()

  # Buffer DOM queries and expressions output
  onCapture: () ->
    @buffer = @updated = @lastOutput = null
    @_repairing = null

  onRelease: ->
    if @removed
      for id in @removed
        @remove id
      @removed = undefined

    @buffer = undefined
    repairing = @_repairing
    @_repairing = undefined
    if repairing
      for property, value of repairing
        if plurals = @_plurals[property]
          for plural, index in plurals by 3
            @repair property, plural, plurals[index + 1], plurals[index + 2], plurals[index + 3]
    if @removing
      for node in @removing
        delete node._gss_id

    if @updated
      evalDiff = @engine.time(@engine.expressions.startTime)
      queryDiff = @engine.time(queryTime)

      @engine.console.row('queries', @updated, evalDiff + 'ms + ' + queryDiff + 'ms')

    @buffer = @updated = undefined

  # Listen to changes in DOM to broadcast them all around, update queries in batch
  solve: (mutations) ->
    @engine.engine.solve 'mutations', ->
      for mutation in mutations
        switch mutation.type
          when "attributes"
            @queries.$attribute(mutation.target, mutation.attributeName, mutation.oldValue)
          when "childList"
            @queries.$children(mutation.target, mutation)
          when "characterData"
            @queries.$characterData(mutation.target, mutation)

        @intrinsic.validate(mutation.target)
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
          @match(prev, '+', undefined, '*') 
          @match(prev, '++', undefined, '*')
          firstPrev = false
        @match(prev, '~', undefined, changedTags)
        @match(prev, '~~', undefined, changedTags)
        next = prev
    while (next = next.nextSibling)
      if next.nodeType == 1
        if firstNext
          @match(next, '!+', undefined, '*') 
          @match(next, '++', undefined, '*')
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
    while parent#.nodeType == 1
      # Let parents know about inserted nodes
      @match(parent, ' ', undefined, allChanged)
      for child in allChanged
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
      if id = @engine.identity.find(removed)
        (@removed ||= []).push(id)
    @

  $characterData: (target) ->
    parent = target.parentNode
    if id = @engine.identity.find(parent)
      if parent.tagName == 'STYLE' 
        if parent.getAttribute('type')?.indexOf('text/gss') > -1
          @engine.eval(parent)

  # Manually add element to collection, handle dups
  # Also stores path which can be used to remove elements
  add: (node, continuation, operation, scope, key) ->
    collection = @get(continuation)
    update = (@updated ||= {})[continuation] ||= []
    if update[1] == undefined 
      update[1] = (copy = collection?.slice?()) || null

    if collection
      return unless collection.keys
    else
      @[continuation] = collection = []
    keys = collection.keys ||= []

    if collection.indexOf(node) == -1
      for el, index in collection
        break unless @comparePosition(el, node) == 4
      collection.splice(index, 0, node)
      @chain collection[index - 1], node, collection, continuation
      @chain node, collection[index + 1], collection, continuation
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

  # Remove observers from element
  unwatch: (id, continuation, plural, quick) ->
    if continuation != true
      refs = @engine.getPossibleContinuations(continuation)
      if typeof id != 'object'
        @unpair continuation, @engine.identity[id]
    index = 0
    return unless (watchers = typeof id == 'object' && id || @watchers[id])
    while watcher = watchers[index]
      contd = watchers[index + 1]
      if refs && refs.indexOf(contd) == -1
        index += 3
        continue
      subscope = watchers[index + 2]
      watchers.splice(index, 3)
      unless quick
        @clean(watcher, contd, watcher, subscope, true, plural)
    delete @watchers[id] unless watchers.length

  # Detach everything related to continuation from specific element
  removeFromNode: (id, continuation, operation, scope, plural) ->
    collection = @get(continuation)
    # Unbind paired elements 
    if plurals = @_plurals?[continuation]
      for subpath, index in plurals by 3
        subpath = continuation + id + '→' + subpath
        @remove plurals[index + 2], continuation + id + '→', null, null, null, true
        @clean(continuation + id + '→' + subpath, null, null, null, null, true)
       
    # Remove all watchers that match continuation path
    ref = continuation + (collection && collection.length != undefined && id || '')
    @unwatch(id, ref, plural)

    return unless (result = @engine.queries.get(continuation))?

    @updateOperationCollection operation, continuation, scope, undefined, result
    if result.length?
      if typeof manual == 'string' && @isPaired(null, manual)
        for item in result
          @unpair(continuation, item)
      else
        @clean(continuation + id)
    else
      @unpair continuation, result

  # Remove element from collection manually
  removeFromCollection: (node, continuation, operation, scope, manual) ->
    return unless collection = @get(continuation)
    length = collection.length
    keys = collection.keys
    duplicate = null

    # Dont remove it if element matches more than one selector
    if (duplicates = collection.duplicates)
      for dup, index in duplicates
        if dup == node
          if (keys[length + index] == manual)
            duplicates.splice(index, 1)
            keys.splice(length + index, 1)
            return false
          else
            duplicate = index

    if operation && length && manual
      if copy = collection.slice()
        ((@updated ||= {})[continuation] ||= [])[1] ||= copy

      if (index = collection.indexOf(node)) > -1
        # Fall back to duplicate with a different key
        if keys
          return false unless keys[index] == manual
          if duplicate?
            duplicates.splice(duplicate, 1)
            keys[index] = keys[duplicate + length]
            keys.splice(duplicate + length, 1)
            return false
        collection.splice(index, 1)
        if keys
          keys.splice(index, 1)
        @chain collection[index - 1], node, collection.slice(), continuation
        @chain node, collection[index], collection.slice(), continuation


  # Remove observers and cached node lists
  remove: (id, continuation, operation, scope, manual, plural) ->
    @engine.console.row('remove', (id.nodeType && @engine.identity.provide(id) || id), continuation)
    if typeof id == 'object'
      node = id
      id = @engine.identity.provide(id)
    else
      node = @engine.identity[id]

    if continuation
      collection = @get(continuation)

      unless @removeFromCollection(node, continuation, operation, scope, manual) == false
        @removeFromNode(id, continuation, operation, scope, plural)
      if collection && !collection.length
        this.set continuation, undefined 

    else if node
      # Detach queries attached to an element when removing element by id
      @unwatch(id, true)

  clean: (path, continuation, operation, scope, bind, plural) ->
    if path.def
      path = (continuation || '') + (path.uid || '') + (path.key || '')
    continuation = path if bind
    result = @get(path)
    @engine.values.clean(path, continuation, operation, scope)
    if result && !@engine.isCollection(result)
      if continuation && continuation != (oppath = @engine.getCanonicalPath(continuation))
        @remove result, oppath
    @unpair path, result if result?.nodeType
    unless plural
      if (result = @get(path, undefined, true)) != undefined
        if result
          if parent = operation?.parent
            parent.def.release?.call(@engine, result, operation, continuation, scope)

          @each 'remove', result, path, operation

        if scope && operation.def.cleaning
          @remove @engine.identity.find(scope), path, operation

    @set path, undefined

    if @_plurals?[path]
      delete @_plurals[path]

    # Remove queries in queue and global watchers that match the path 
    if @lastOutput
      @unwatch(@lastOutput, path, null, true)

    @unwatch(@engine.scope._gss_id, path)

    if !result || result.length == undefined
      @provide(['remove', @engine.getContinuation(path)])
    return true

  # Update bindings of two plural collections
  repair: (path, key, operation, scope, collected) ->
    leftUpdate = @updated?[path]
    leftNew = (if leftUpdate?[0] != undefined then leftUpdate[0] else @get(path)) || []
    if leftNew.old != undefined
      leftOld = leftNew.old || []
    else
      leftOld = (if leftUpdate then leftUpdate[1] else @get(path)) || []
    rightPath = @engine.getScopePath(path) + key
    rightUpdate = @updated?[rightPath]

    rightNew = (   rightUpdate &&   rightUpdate[0] ||   @get(rightPath))
    if !rightNew && collected
      rightNew = @get(path + @engine.identity.provide(leftNew[0] || leftOld[0]) + '→' + key)
      
    rightNew ||= []

    if rightNew.old != undefined
      rightOld = rightNew.old
    else if rightUpdate?[1] != undefined
      rightOld = rightUpdate[1]
    else if !rightUpdate
      rightOld = @get(rightPath)
      rightOld = rightNew if rightOld == undefined

    rightOld ||= []

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
      prefix = @engine.getContinuation(path, pair[0], '→')
      @remove(scope, prefix, null, null, null, true)
      @clean(prefix + key, null, null, null, null, true)
    
    for pair in added
      prefix = @engine.getContinuation(path, pair[0], '→')
      # not too good
      contd = prefix + operation.path.substring(0, operation.path.length - operation.key.length)
      if operation.path != operation.key
        @provide operation.parent, prefix + operation.path, scope, @engine.UP, operation.index, pair[1]
      else
        @provide operation, contd, scope, @engine.UP, true, true

    @engine.console.row('repair', [[added, removed], [leftNew, rightNew], [leftOld, rightOld]], path)

  isPariedRegExp: /(?:^|→)([^→]+?)(\$[a-z0-9-]+)?→([^→]+)→?$/i
                  # path1 ^        id ^        ^path2   

  isPaired: (operation, continuation) ->
    if match = continuation.match(@isPariedRegExp)
      if operation && operation.parent.def.serialized
        return
      if !@engine.isCollection(@[continuation]) && match[3].indexOf('$') == -1
        return
      return match



  unpair: (continuation, node) ->
    return unless match = @isPaired(null, continuation)
    path = @engine.getCanonicalPath(match[1])
    collection = @get(path)
    return unless plurals = @_plurals?[path]

    oppath = @engine.getCanonicalPath(continuation, true)
    for plural, index in plurals by 3
      continue unless oppath == plural
      contd = path + '→' + plural
      @remove(node, contd, plurals[index + 1], plurals[index + 2], continuation)
      #@clean(path + match[2] + '→' + plural)
      ((@updated ||= {})[contd] ||= [])[0] = @get(contd)
      if @_repairing != undefined
        schedule = (@_repairing ||= {})[path] = true
    return

  # Check if operation is plurally bound with another selector
  # Choose a good match for element from the first collection
  # Currently bails out and schedules re-pairing 
  pair: (continuation, operation, scope, result) ->
    return unless match = @isPaired(operation, continuation, true)
    left = @engine.getCanonicalPath(match[1])
    plurals = (@_plurals ||= {})[left] ||= []
    if plurals.indexOf(operation.path) == -1
      pushed = plurals.push(operation.path, operation, scope)
    collection = @get(left)
    element =  if match[2] then @engine.identity[match[2]] else @get(match[1])

    if @_repairing != undefined
      schedule = (@_repairing ||= {})[left] = true
      return -1
    return collection.indexOf(element)

  # If a query selects element from some other node than current scope
  # Maybe somebody else calculated it already
  fetch: (node, args, operation, continuation, scope) ->
    node ||= @engine.getContext(args, operation, scope, node)
    if @updated# && node != scope
      query = @engine.getQueryPath(operation, node)
      return @updated[query]

  chain: (left, right, collection, continuation) ->
    if left
      @match(left, '$pseudo', 'last', undefined, continuation)
      @match(left, '$pseudo', 'next', undefined, continuation)
    if right
      @match(right, '$pseudo', 'previous', undefined, continuation)
      @match(right, '$pseudo', 'first', undefined, continuation)

  # Combine nodes from multiple selector paths
  updateOperationCollection: (operation, path, scope, added, removed) ->
    oppath = @engine.getCanonicalPath(path)
    return if path == oppath
    collection = @get(oppath)
    return if removed && removed == collection
    if removed
      @each 'remove', removed, oppath, operation, scope, true
    if added
      @each 'add', added, oppath, operation, scope, true

  # Perform method over each node in nodelist, or against given node
  each: (method, result, continuation, operation, scope, manual) ->
    if result.length != undefined
      copy = result.slice()
      for child in copy
        @[method] child, continuation, operation, scope, manual
    else if typeof result == 'object'
      @[method] result, continuation, operation, scope, manual

  # Filter out known nodes from DOM collections
  update: (node, args, result, operation, continuation, scope) ->
    node ||= @engine.getContext(args, operation, scope, node)
    path = @engine.getQueryPath(operation, continuation)
    old = @get(path)

    # Normalize query to reuse results
    query = !operation.def.relative && @engine.getQueryPath(operation, node, scope)
    if group = (query && @updated?[query])
      result = group[0]
      unless old?
        old = group[1]
        scoped = true 
      else
        @set path, group[0]
    else if !old? && (result && result.length == 0) && continuation
      old = @get(@engine.getCanonicalPath(path))
    if (group ||= @updated?[path])
      if scoped
        added = result
      else
        added = group[2]
        removed = group[3]
    else

      isCollection = result && result.length != undefined
      if old == result || (old == undefined && @removed)
        noop = true unless result && result.keys
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
        else# if !result
          @clean(path)
          removed = old

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

      if (added || removed)
        @updateOperationCollection operation, path, scope, added, removed

    # Subscribe node to the query
    if id = @engine.identity.provide(node)
      watchers = @watchers[id] ||= []
      if (@engine.indexOfTriplet(watchers, operation, continuation, scope) == -1)
        watchers.push(operation, continuation, scope)
    
    return if noop
    
    @set path, result

    if plurals = @_plurals?[path]
      (@_repairing ||= {})[path] = true

    unless @updated == undefined 
      @updated ||= {}
      group = @updated[query] ||= [] if query
      @updated[path] ||= group ||= []
      group[0] ||= result
      group[1] ||= old?.slice?() unless old == result
      group[2] ||= added
      group[3] ||= removed

    contd = continuation
    if contd && contd.charAt(contd.length - 1) == '→'
      contd = @engine.getOperationPath(operation, contd)
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

      if result.length != undefined
        for item, index in result
          @chain result[index - 1], item, result, path
        @chain item, undefined, result, path
    else
      delete @[path]

    if removed = @updated?[path]?[3]
      for item in removed
        @match(item, '$pseudo', 'next', undefined, path)
        @match(item, '$pseudo', 'first', undefined, path)
        @match(item, '$pseudo', 'previous', undefined, path)
        @match(item, '$pseudo', 'last', undefined, path)
    return

  # Check if a node observes this qualifier or combinator
  match: (node, group, qualifier, changed, continuation) ->
    return unless id = node._gss_id
    return unless watchers = @watchers[id]
    if continuation
      path = @engine.getCanonicalPath(continuation)
    for operation, index in watchers by 3
      if groupped = operation[group]
        contd = watchers[index + 1]
        continue if path && path != @engine.getCanonicalPath(contd)
        scope = watchers[index + 2]
        # Check qualifier value
        if qualifier
          @qualify(operation, contd, scope, groupped, qualifier)
        # Check combinator and tag name of a given element
        else if changed.nodeType
          @qualify(operation, contd, scope, groupped, changed.tagName, '*')
        # Check combinator and given tag name
        else if typeof changed == 'string'
          @qualify(operation, contd, scope, groupped, changed, '*')
        # Ditto in bulk: Qualify combinator with nodelist or array of tag names
        else for change in changed
          if typeof change == 'string'
            @qualify(operation, contd, scope, groupped, change, '*')
          else
            @qualify(operation, contd, scope, groupped, change.tagName, '*')
    @

  # Check if query observes qualifier by combinator 
  qualify: (operation, continuation, scope, groupped, qualifier, fallback) ->
    if (indexed = groupped[qualifier]) || (fallback && groupped[fallback])
      @provide(operation, continuation, scope)
    @

  comparePosition: (a, b) ->
    return a.compareDocumentPosition?(b) ?
          (a != b && a.contains(b) && 16) +
          (a != b && b.contains(a) && 8) +
          if a.sourceIndex >= 0 && b.sourceIndex >= 0
            (a.sourceIndex < b.sourceIndex && 4) + 
            (a.sourceIndex > b.sourceIndex && 2)
          else
            1
module.exports = Queries