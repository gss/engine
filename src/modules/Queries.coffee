### Input: DOM Queries

 - Listens for changes in DOM,
 - Invalidates cached DOM Queries
   by bruteforcing combinators on reachable elements

 Input:  MutationEvent, processes observed mutations
 Output: Expressions, revaluates expressions

 State:  - `@[path]`: elements and collections by selector path
         - `@watchers[id]`: dom queries by element id 
###

class Queries
  constructor: (@engine) ->
    @watchers = {}
    @qualified = []

  onSolve: ->
    if @removed
      for id in @removed
        @remove id
      @removed = undefined

    if @removing
      for node in @removing
        delete node._gss_id

  onBeforeSolve: ->
    # Update all DOM queries that matched mutations
    index = 0
    while @qualified[index]
      watcher = @qualified.splice(0, 3)
      @engine.document.solve watcher[0], watcher[1], watcher[2]
      
    # Execute all deferred selectors (e.g. comma)
    index = 0
    if @ascending
      while @ascending[index]
        contd = @ascending[index + 1]
        collection = @[contd]
        if old = @engine.workflow?.queries?[contd]?[1]
          collection = collection.slice()
          for item, i in collection by -1
            if old.indexOf(item) > -1
              collection.splice(i, 1)
        if collection?.length
          @engine.document.expressions.ascend @ascending[index], contd, collection, @ascending[index + 2]
        index += 3
      @ascending = undefined
    @

  # Manually add element to collection, handle dups
  # Also stores path which can be used to remove elements
  add: (node, continuation, operation, scope, key) ->
    collection = @get(continuation)
    update = (@engine.workflow.queries ||= {})[continuation] ||= []
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
      #@chain collection[index - 1], node, collection, continuation
      #@chain node, collection[index + 1], collection, continuation
      keys.splice(index - 1, 0, key)
      return true
    else
      (collection.duplicates ||= []).push(node)
      keys.push(key)
      return

      
    return collection

  # Return collection by path & scope
  get: (operation, continuation, old) ->
    if typeof operation == 'string'
      result = @[operation]
      # Return stuff that was removed this tick when cleaning up
      if old && (updated = @engine.workflow.queries?[operation]?[3])
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
  unobserve: (id, continuation, quick) ->
    if continuation != true
      refs = @engine.getPossibleContinuations(continuation)
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
        @clean(watcher, contd, watcher, subscope, true)
    delete @watchers[id] unless watchers.length

  # Detach everything related to continuation from specific element
  removeFromNode: (id, continuation, operation, scope, strict) ->
    collection = @get(continuation)

    @engine.pairs.remove(id, continuation)

    # Remove all watchers that match continuation path
    ref = continuation + (collection?.length? && id || '')
    @unobserve(id, ref)

    return if strict || !(result = @get(continuation))? 

    @updateOperationCollection operation, continuation, scope, undefined, @engine.identity[id], true
    
    if result.length?
      @clean(continuation + id)

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
      ((@engine.workflow.queries ||= {})[continuation] ||= [])[1] ||= collection.slice()

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
        return true


  # Remove observers and cached node lists
  remove: (id, continuation, operation, scope, manual, strict) ->
    
    if typeof id == 'object'
      node = id
      id = @engine.identity.provide(id)
    else
      node = @engine.identity[id]

    if continuation
      collection = @get(continuation)
      if collection?.length != undefined
        ((@engine.workflow.queries ||= {})[continuation] ||= [])[1] ||= collection.slice()
      removed = @removeFromCollection(node, continuation, operation, scope, manual)

      unless removed == false
        @removeFromNode(id, continuation, operation, scope, strict)

      if collection && !collection.length
        this.set continuation, undefined 

    else if node
      # Detach queries attached to an element when removing element by id
      @unobserve(id, true)

    return removed


  clean: (path, continuation, operation, scope, bind) ->
    if path.def
      path = (continuation || '') + (path.uid || '') + (path.key || '')
    continuation = path if bind
    result = @get(path)
    
    if (result = @get(path, undefined, true)) != undefined
      if result
        if parent = operation?.parent
          parent.def.release?.call(@engine, result, operation, continuation, scope)

        @each 'remove', result, path, operation

    if scope && operation.def.cleaning
      @remove @engine.identity.find(scope), path, operation, scope, undefined, true
    @engine.solved.remove(path)

    @set path, undefined

    @engine.pairs.clean(path)

    # Remove queries in queue and global watchers that match the path 
    if @qualified
      @unobserve(@qualified, path, true)

    @unobserve(@engine.scope._gss_id, path)


    if !result || result.length == undefined
      unless path.charAt(0) == @engine.RIGHT
        @engine.provide(['remove', @engine.getContinuation(path)])
    return true

  # If a query selects element from some other node than current scope
  # Maybe somebody else calculated it already
  fetch: (node, args, operation, continuation, scope) ->
    node ||= @engine.getContext(args, operation, scope, node)
    if @engine.workflow.queries# && node != scope
      query = @engine.getQueryPath(operation, node)
      return @engine.workflow.queries[query]?[0]

  chain: (left, right, collection, continuation) ->
    if left
      @match(left, '$pseudo', 'last', undefined, continuation)
      @match(left, '$pseudo', 'next', undefined, continuation)
    if right
      @match(right, '$pseudo', 'previous', undefined, continuation)
      @match(right, '$pseudo', 'first', undefined, continuation)

  # Combine nodes from multiple selector paths
  updateOperationCollection: (operation, path, scope, added, removed, strict) ->
    oppath = @engine.getCanonicalPath(path)
    return if path == oppath || @engine.RIGHT + oppath == path
    collection = @get(oppath)
    return if removed && removed == collection
    if removed
      @each 'remove', removed, oppath, operation, scope, true, strict
    if added
      @each 'add', added, oppath, operation, scope, true

  # Perform method over each node in nodelist, or against given node
  each: (method, result, continuation, operation, scope, manual, strict) ->
    if result.length != undefined
      copy = result.slice()
      returned = undefined
      for child in copy
        if @[method] child, continuation, operation, scope, manual, strict
          returned = true
      return returned
    else if typeof result == 'object'
      return @[method] result, continuation, operation, scope, manual, strict

  # Filter out known nodes from DOM collections
  update: (node, args, result, operation, continuation, scope) ->
    node ||= @engine.getContext(args, operation, scope, node)
    path = @engine.getQueryPath(operation, continuation)
    old = @get(path)

    @engine.workflow.queries ||= {}

    # Normalize query to reuse results

    
    if pathed = @engine.workflow.queries[path]
      old = pathed[1]

    if query = !operation.def.relative && @engine.getQueryPath(operation, node, scope)
      if queried = @engine.workflow.queries[query]
        old ?= queried[1]
        result ?= queried[0]

    if !old? && (result && result.length == 0) && continuation
      old = @get(@engine.getCanonicalPath(path))

    isCollection = result && result.length != undefined
    #if old == result || (old == undefined && @removed)
    #  noop = true unless result && result.keys
    #  old = undefined
    # Clean refs of nodes that dont match anymore
    if old
      if old.length != undefined
        removed = undefined
        old = old.slice()
        for child in old
          if !result || Array.prototype.indexOf.call(result, child) == -1
            @remove child, path, operation, scope
            (removed ||= []).push child
      else if result != old
        if !result
          removed = old
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

    unless added == removed
      if added || removed
        @updateOperationCollection operation, path, scope, added, removed, true

    # Subscribe node to the query
    if id = @engine.identity.provide(node)
      watchers = @watchers[id] ||= []
      if (@engine.indexOfTriplet(watchers, operation, continuation, scope) == -1)
        watchers.push(operation, continuation, scope)
    
    #return if noop
      
    group = @engine.workflow.queries[query] ||= [] if query
    group = @engine.workflow.queries[path] ||= group || []

    group[0] ||= result
    group[1] ||= old

    return if result == old
    
    @set path, result

    @engine.pairs.set path, result

    return added

  set: (path, result) ->
    if result
      @[path] = result

      if result.length != undefined
        for item, index in result
          @chain result[index - 1], item, result, path
        if item
          @chain item, undefined, result, path
    else
      delete @[path]

    if removed = @engine.workflow.queries?[path]?[3]
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
      if @engine.indexOfTriplet(@qualified, operation, continuation, scope) == -1
        length = (continuation || '').length
        # Make shorter continuation keys run before longer ones
        for qualified, index in @qualified by 3
          if (@qualified[index + 1] || '').length > length
            break
        @qualified.splice(index, 0, operation, continuation, scope)
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