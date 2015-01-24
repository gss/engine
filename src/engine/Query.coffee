Command = require('./Command')

class Query extends Command
  type: 'Query'
  
  constructor: (operation) ->
    @key = @path = @serialize(operation)

  # Pass control to parent operation (possibly multiple times)
  # For each node in collection, fork continuation with element id
  ascend: (engine, operation, continuation, scope, result, ascender, ascending) ->
    if parent = operation.parent
      if @isCollection(result)
        for node in result
          contd = @fork(engine, continuation, node)
          if yielded = parent.command.yield?(node, engine, operation, contd, scope, ascender, ascending)
            yielded.command?.solve(yielded.domain || engine, yielded, contd, scope, -1, node)
          else
            parent.command.solve(engine, parent, contd, scope, parent.indexOf(operation), node)
        return
      else
        if yielded = parent.command.yield?(result, engine, operation, continuation, scope, ascender, ascending)
          yielded.command?.solve(yielded.domain || engine, yielded, continuation, scope, -1, result)
        else if ascender? || !@hidden || !@reference
          return parent.command.solve(engine, parent, continuation, scope, parent.indexOf(operation), result)
        else
          return result
     
  serialize: (operation) ->
    if @prefix?
      string = @prefix
    else
      string = operation[0]
    if typeof operation[1] == 'object'
      start = 2
    length = operation.length
    for index in [start || 1 ... length]
      if argument = operation[index]
        if cmd = argument.command
          string += cmd.key
        else
          string += argument
          if length - 1 > index
            string += @separator

    if @suffix
      string += @suffix

    return string

  push: (operation, context) ->
    if context
      @inherit(context.command, inherited)

    for index in [1 ... operation.length]
      if cmd = operation[index]?.command
        inherited = @inherit(cmd, inherited)


    if tags = @tags
      for tag, i in tags
        if context
          if cmd = context.command
            if (cmd.tags?.indexOf(tag) > -1) && @checkers[tag](@, cmd, operation, context, inherited)
              inherited = @mergers[tag](@, cmd, operation, context)

        match = true
        # Check if all args match the tag
        for index in [1 ... operation.length]
          if cmd = (arg = operation[index])?.command
            if !(cmd.tags?.indexOf(tag) > -1) || !@checkers[tag](@, cmd, operation, arg, inherited)
              match = false
              break

        # Merge tagged arguments
        if match
          inherited = false
          for index in [1 ... operation.length]
            if cmd = (arg = operation[index])?.command
              inherited = @mergers[tag](@, cmd, operation, arg, inherited)

    return @
  
  inherit: (command, inherited) ->
    if command.scoped
      @scoped = command.scoped
    if path = command.path
      if inherited
        @path += @separator + path
      else
        @path = path + @path
    return true

  continue: (engine, operation, continuation = '') ->
    return continuation + @getKey(engine, operation, continuation)

  # Evaluate compound native selector by jumping to either its head or tail
  jump: (engine, operation, continuation, scope, ascender, ascending) ->
    tail = @tail

    # Let it descend quickly
    if tail[1]?.command?.key? && !ascender? && 
          (continuation.lastIndexOf(@PAIR) == continuation.indexOf(@PAIR))
      return tail[1].command.solve(engine, tail[1], continuation, scope)


    return @perform(engine, @head, continuation, scope, ascender, ascending)

  prepare: ->
    
  mergers: {}
  checkers: {}

  # Check if query was already updated
  before: (args, engine, operation, continuation, scope, ascender, ascending) ->
    node = if args[0]?.nodeType == 1 then args[0] else scope
    query = @getGlobalPath(engine, operation, continuation, node)
    alias = engine.updating.aliases?[query] || query
    if engine.updating.queries?.hasOwnProperty(alias)
      return engine.updating.queries[alias]
    return engine.updating.queries?[query]

  # Subscribe elements to query 
  after: (args, result, engine, operation, continuation, scope) ->
    updating = engine.updating

    node = if args[0]?.nodeType == 1 then args[0] else scope
    path = @getLocalPath(engine, operation, continuation, node)
    # Compute once, reference result subsequently
    unless @relative# || @type == 'Condition'
      query = @getGlobalPath(engine, operation, continuation, node)
      aliases = updating.aliases ||= {}
      if !(alias = aliases[query]) || alias.length > path.length || !updating.queries?.hasOwnProperty(alias)
        aliases[query] = path

    old = @get(engine, path)

    # Normalize query to reuse results
    command = operation.command

    (updating.queries ||= {})[path] = result

    if updating.collections?.hasOwnProperty(path)
      old = updating.collections[path]
    else if !old? && (result && result.length == 0) && continuation
      old = @getCanonicalCollection(engine, path)

    isCollection = @isCollection(result)

    # Clean refs of nodes that dont match anymore
    if old
      if @isCollection(old)
        removed = undefined
        for child, index in old
          if !old.scopes || old.scopes?[index] == scope
            if !result || Array.prototype.indexOf.call(result, child) == -1
              (removed ||= []).push child
      else if result != old
        if !result
          removed = old
        @clean(engine, path, undefined, operation, scope)
      else
        return

    # Register newly found nodes
    if isCollection
      engine.queries[path] ||= []
      added = undefined
      for child in result
        if !old || Array.prototype.indexOf.call(old, child) == -1  
          (added ||= []).push child
          added.isCollection = true

      # Snapshot live node list for future reference
      if result && result.item
        result = Array.prototype.slice.call(result, 0)
    else
      added = result
      removed = old

    if @write(engine, operation, continuation, scope, node, path, result, old, added, removed)
      @set engine, path, result
    return added

  # Write result, update collections, subscribe to query
  write: (engine, operation, continuation, scope, node, path, result, old, added, removed) ->
    if result?.continuations
      @reduce(engine, operation, path, scope, undefined, undefined, undefined, continuation)
    else
      @reduce(engine, operation, path, scope, added, removed, undefined, continuation)
    
    @subscribe(engine, operation, continuation, scope, node)
    @snapshot engine, path, old

    unless result == old
      return !result?.push

  # Subscribe node to the query
  subscribe: (engine, operation, continuation, scope, node) ->
    id = engine.identify(node)
    observers = engine.engine.observers[id] ||= []
    if (engine.indexOfTriplet(observers, operation, continuation, scope) == -1)
      operation.command.prepare?(operation)
      observers.push(operation, continuation, scope)


  # Execute all pending mutations and deferred operations
  commit: (engine, solution) ->
    # Update all DOM queries that matched mutations
    if mutations = engine.updating.mutations
      engine.console.start('Queries', mutations.slice())
      index = 0
      while mutations[index]
        watcher = mutations.splice(0, 3)
        engine.input.solve watcher[0], watcher[1], watcher[2]
      engine.updating.mutations = undefined
      engine.console.end()

    # Execute all deferred selectors (e.g. comma)
    if deferred = engine.updating.deferred
      index = 0
      engine.console.start('Deferred', deferred)
      while deferred[index]
        contd = deferred[index + 1]
        collection = @get(engine, contd)
        op = deferred[index]
        unless op.command.singular
          if old = engine.updating.collections?[contd]
            collection = collection.slice()
            collection.isCollection = true
            for item, i in collection by -1
              if old.indexOf(item) > -1
                collection.splice(i, 1)
          if collection?.length
            op.command.ascend(engine.input, op, contd, deferred[index + 2], collection)
        else
          op.command.solve(engine.input, op, contd, deferred[index + 2], true)
        index += 3
      engine.updating.deferred = undefined
      engine.console.end()
    
    return

  # Manually add element to collection, handle dups
  # Also stores path which can be used to remove elements
  add: (engine, node, continuation, operation, scope, key, contd) ->
    collection = engine.queries[continuation] ||= []

    if !collection.push
      return
    collection.isCollection = true

    keys = collection.continuations ||= []
    paths = collection.paths ||= []
    scopes = collection.scopes ||= []

    if engine.pairs[continuation]
      (engine.updating.pairs ||= {})[continuation] = true

    @snapshot engine, continuation, collection

    if (index = collection.indexOf(node)) == -1
      for el, index in collection
        break unless @comparePosition(el, node, keys[index], key)
      collection.splice(index, 0, node)
      keys.splice(index, 0, key)
      paths.splice(index, 0, contd)
      scopes.splice(index, 0, scope)
      @chain engine, collection[index - 1], node, continuation
      @chain engine, node, collection[index + 1], continuation
      if operation.parent[0] == 'rule'
        engine.Stylesheet?.match(engine, node, continuation, true)

      return true
    else unless scopes[index] == scope && paths[index] == contd
      duplicates = (collection.duplicates ||= [])
      for dup, index in duplicates
        if dup == node
          if scopes[index] == scope && paths[index] == contd # && keys[index] == key
            return
      duplicates.push(node)
      keys.push(key)
      paths.push(contd)
      scopes.push(scope)
      return

      
    return collection

  # Return collection by path & scope
  get: (engine, continuation) ->
    return engine.queries[continuation]  

  # Remove observers from element, trigger cascade cleanup
  unobserve: (engine, id, path, continuation, scope) ->
    if typeof id == 'object'
      observers = id
      id = undefined
    else
      unless observers = engine.observers[id]
        return

    if path != true
      refs = @getVariants(path)
      
    index = 0
    while watcher = observers[index]
      query = observers[index + 1]
      if refs && refs.indexOf(query) == -1
        index += 3
        continue

      subscope = observers[index + 2]
      observers.splice(index, 3)
      if id?
        watcher.command.onClean?(engine, watcher, query, watcher, subscope)

        @clean(engine, watcher, query, watcher, subscope, continuation)

        unless observers.length
          delete engine.observers[id]

  snapshot: (engine, key, collection) ->
    return if (collections = engine.updating.collections ||= {}).hasOwnProperty key

    if collection?.push
      c = collection.slice()
      if collection.isCollection
        c.isCollection = true
      if collection.duplicates
        c.duplicates = collection.duplicates.slice()
      if collection.scopes
        c.scopes = collection.scopes.slice()
      if collection.continuations
        c.continuations = collection.continuations.slice()

      collection = c
      
    collections[key] = collection

  defer: (engine, operation, continuation, scope) ->
    engine.updating.deferred ||= []
    if engine.indexOfTriplet(engine.updating.deferred, operation, continuation, scope) == -1
      engine.updating.deferred.push(operation, continuation, scope)

  # Remove element from collection needlely
  removeFromCollection: (engine, node, continuation, operation, scope, needle, contd) ->
    collection = @get(engine, continuation)
    length = collection.length
    keys = collection.continuations
    paths = collection.paths
    scopes = collection.scopes
    duplicate = null

    #if !contd?
    #  refs = [undefined]
    #else
    refs = @getVariants(contd)
    # Dont remove it if element matches more than one selector
    if (duplicates = collection.duplicates)
      for dup, index in duplicates
        if dup == node
          if refs.indexOf(paths[length + index]) > -1 &&
              #(keys[length + index] == needle) &&
              scopes[length + index] == scope

            @snapshot engine, continuation, collection
            duplicates.splice(index, 1)
            keys.splice(length + index, 1)
            paths.splice(length + index, 1)
            scopes.splice(length + index, 1)
            return false
          else
            duplicate ?= index

    if operation && length && needle?
      @snapshot engine, continuation, collection

      if (index = collection.indexOf(node)) > -1
        # Fall back to duplicate with a different key
        if keys
          negative = false#if refs then null else false
          return null if scopes[index] != scope
          return null if refs.indexOf(paths[index]) == -1
          #return null if keys[index] != needle
          if duplicate?
            duplicates.splice(duplicate, 1)
            paths[index] = paths[duplicate + length]
            paths.splice(duplicate + length, 1)
            keys[index] = keys[duplicate + length]
            keys.splice(duplicate + length, 1)
            scopes[index] = scopes[duplicate + length]
            scopes.splice(duplicate + length, 1)
            return false

        collection.splice(index, 1)
        if keys
          keys.splice(index, 1)
          paths.splice(index, 1)
          scopes.splice(index, 1)
        @chain engine, collection[index - 1], node, continuation
        @chain engine, node, collection[index], continuation
        if operation.parent[0] == 'rule'
          engine.Stylesheet?.match(engine, node, continuation, false)
        return true



  # Remove observers and cached node lists
  remove: (engine, id, continuation, operation, scope, needle = operation, recursion, contd = continuation) ->
    if typeof id == 'object'
      node = id
      id = engine.identify(id)
    else
      if id.indexOf('"') > -1
        node = id
      else
        node = engine.identity[id]


    if engine.pairs[continuation]
      (engine.updating.pairs ||= {})[continuation] = true
    
    collection = @get(engine, continuation)

    if collection && @isCollection(collection)
      @snapshot engine, continuation, collection
    
      removed = @removeFromCollection(engine, node, continuation, operation, scope, needle, contd)

    if removed != false
      if @isCollection(collection)
        ref = continuation + id
      else
        ref = continuation

      if parent = operation?.parent
        parent.command.release?(node, engine, operation, ref, scope)
        
      @unobserve(engine, id, ref, ref)

      if recursion != continuation
        if removed != false
          @reduce engine, operation, continuation, scope, recursion, node, continuation, contd

        if removed
          @clean(engine, continuation + id, undefined, undefined, node.scoped && node.parentNode)

    return removed

  getKey: ->
    return @key || ''

  clean: (engine, path, continuation, operation, scope, contd = continuation) ->
    if command = path.command
      if key = command.getKey(engine, operation, continuation)
        path = continuation + key
      else
        path = @delimit(continuation)

    if (result = @get(engine, path)) != undefined
      @each @remove, engine, result, path, operation, scope, operation, false, contd

    @set engine, path, undefined

    # Remove queries in queue and global observers that match the path 
    if engine.updating.mutations
      @unobserve(engine, engine.updating.mutations, path)

    @unobserve(engine, engine.identify(scope || engine.scope), path)

    if !result || !@isCollection(result)
      engine.triggerEvent('remove', path)
    return true

  chain: (engine, left, right, continuation) ->
    if left
      @match(engine, left, ':last', '*', undefined, continuation)
      @match(engine, left, ':next', '*', undefined, continuation)
    if right
      @match(engine, right, ':previous', '*', undefined, continuation)
      @match(engine, right, ':first', '*', undefined, continuation)

  # Register node by its canonical and regular path
  reduce: (engine, operation, path, scope, added, removed, recursion, contd) ->
    
    oppath = @getCanonicalPath(path)
    if path != oppath && recursion != oppath# && !@relative
      @collect engine, operation, oppath, scope, added, removed, oppath, path

    @collect engine, operation, path, scope, added, removed, recursion, contd || ''
    
  # Combine nodes from multiple selector paths
  collect: (engine, operation, path, scope, added, removed, recursion, contd) ->
    if removed
      @each @remove, engine, removed, path, operation, scope, operation, recursion, contd

    if added
      @each @add, engine, added, path, operation, scope, operation, contd

    # Check if collection was resorted
    if (collection = @get(engine, path))?.continuations
      sorted = collection.slice().sort (a, b) =>
        i = collection.indexOf(a)
        j = collection.indexOf(b)
        return @comparePosition(a, b, collection.continuations[i], collection.continuations[j]) && -1 || 1
      

      updated = undefined
      for node, index in sorted
        if node != collection[index]
          if !updated
            updated = collection.slice()
            @set(engine, path, updated)
            updated.continuations = collection.continuations.slice()
            updated.paths = collection.paths.slice()
            updated.scopes = collection.scopes.slice()
            updated.duplicates = collection.duplicates
            updated.isCollection = collection.isCollection
            updated[index] = node
          i = collection.indexOf(node)
          updated[index] = node
          updated.continuations[index] = collection.continuations[i]
          updated.paths[index] = collection.paths[i]
          updated.scopes[index] = collection.scopes[i]

          @chain engine, sorted[index - 1], node, path
          @chain engine, node, sorted[index + 1], path

  # Perform method over each node in nodelist, or against given node
  each: (method, engine, result = undefined, continuation, operation, scope, needle, recursion, contd) ->
    if @isCollection(result)
      copy = result.slice()
      returned = undefined
      for child in copy
        if method.call @, engine, child, continuation, operation, scope, needle, recursion, contd
          returned = true
      return returned
    else if typeof result == 'object'
      return method.call @, engine, result, continuation, operation, scope, needle, recursion, contd


  set: (engine, path, result) ->
    old = engine.queries[path]

    #if !result?
    @snapshot engine, path, old

    if result?
      engine.queries[path] = result
    else if engine.queries.hasOwnProperty(path)
      delete engine.queries[path]
      if engine.updating.branching 
        engine.updating.branching.push(path)
        

    path = @getCanonicalPath(path)

    for left, observers of engine.pairs
      if observers.indexOf(path) > -1
        (engine.updating.pairs ||= {})[left] = true

    return

  onLeft: (engine, operation, parent, continuation, scope) ->
    left = @getCanonicalPath(continuation)
    if engine.indexOfTriplet(engine.lefts, parent, left, scope) == -1
      parent.right = operation
      engine.lefts.push parent, left, scope
      return @rewind
    else
      (engine.pairing ||= {})[left] = true
      return @nothing

  nothing: ->
    return

  # Check if operation is pairly bound with another selector
  # Choose a good match for element from the first collection
  # Currently bails out and schedules re-pairing 
  onRight: (engine, operation, parent, continuation, scope, left, right) ->
    right = @getCanonicalPath(continuation.substring(0, continuation.length - 1))
    for op, index in engine.lefts by 3
      if op == parent && engine.lefts[index + 2] == scope
        left = engine.lefts[index + 1]
        @listen(engine, operation, continuation, scope, left, right)
    return unless left
    left = @getCanonicalPath(left)
    pairs = engine.pairs[left] ||= []
    if pairs.indexOf(right) == -1
      pushed = pairs.push(right, operation, scope)
    if engine.updating.pairs != false
      (engine.updating.pairs ||= {})[left] = true
    return @nothing
    
  retrieve: (engine, operation, continuation, scope, ascender, ascending, single) ->
    # Attempt pairing
    last = continuation.lastIndexOf(@PAIR)
    if last > -1 && !operation.command.reference
      # Found right side
      prev = -1
      while (index = continuation.indexOf(@PAIR, prev + 1)) > -1
        if result = @retrieve(engine, operation, continuation.substring(prev + 1, index), scope, ascender, ascending, true)
          return result
        prev = index 
      if last == continuation.length - 1 && ascending
        parent = @getRoot(operation)
        if !parent.right || parent.right == operation
          return @onLeft(engine, operation, parent, continuation, scope, ascender, ascending)
        else
          return @onRight(engine, operation, parent, continuation, scope, ascender, ascending)
    # Fetch saved result if operation path mathes continuation canonical path
    else
      return if continuation.length == 1
      contd = @getCanonicalPath(continuation, true)#.replace(/@[0-9]+/g, '')
      if contd.charAt(0) == @PAIR
        contd = contd.substring(1)
      if contd == operation.command.path
        return @getByPath(engine, continuation)

  repair: (engine, reversed) ->
    return unless dirty = engine.updating.pairs
    engine.console.start('Pairs', dirty)
    engine.updating.pairs = false
    for property, value of dirty
      if pairs = engine.pairs[property]?.slice()
        for pair, index in pairs by 3
          @pair engine, property, pair, pairs[index + 1], pairs[index + 2], reversed
    engine.updating.pairs = undefined
    engine.console.end()

  count: (value) ->
    if value?.push 
      value.length 
    else
      value? && 1 || 0

  pad: (value, length) ->
    if value && !value.push
      result = []
      for i in [0...length]
        result.push value
      result.single = true
      return result
    else if value?.splice
      return value.slice()
    else
      return value || []

  restore: (engine, path) ->
    if engine.updating.collections.hasOwnProperty(path)
      return engine.updating.collections[path]
    else
      return @get(engine, path)

  fetch: (engine, path, reversed) ->
    if reversed
      return @restore(engine, path)
    else
      return @get(engine, path)

  # Update bindings of two pair collections
  pair: (engine, left, right, operation, scope, reversed) ->
    root = @getRoot(operation)
    right = @getPrefixPath(engine, left) + root.right.command.path


    if reversed

      leftOld = if engine.updating.queries.hasOwnProperty(left) then engine.updating.queries[left] else @restore(engine, left)
      rightOld = if engine.updating.queries.hasOwnProperty(right) then engine.updating.queries[right] else @restore(engine, right)

    else
      leftNew = @get(engine, left)
      rightNew = @get(engine, right)

      leftOld = @restore(engine, left)
      rightOld = @restore(engine, right)

    if operation.command.singular
      if leftNew?.push
        leftNew = leftNew[0]
      if leftOld?.push
        leftOld = leftOld[0]

    if root.right.command.singular 
      if rightNew?.push
        rightNew = rightNew[0]
      if rightOld?.push
        rightOld = rightOld[0]
        

    I = Math.max(@count(leftNew), @count(rightNew))
    J = Math.max(@count(leftOld), @count(rightOld))

    leftNew = @pad leftNew, I
    leftOld = @pad leftOld, J
    rightNew = @pad rightNew, I
    rightOld = @pad rightOld, J


    removed = []
    added = []

    for object, index in leftOld
      if leftNew[index] != object || rightOld[index] != rightNew[index]
        if rightOld && rightOld[index]
          removed.push([object, rightOld[index]])
        if leftNew[index] && rightNew[index]
          added.push([leftNew[index], rightNew[index]])
    if leftOld.length < leftNew.length
      for index in [leftOld.length ... leftNew.length] by 1
        if rightNew[index]
          added.push([leftNew[index], rightNew[index]])


    cleaned = []
    for pair in removed
      continue if !pair[0] || !pair[1]
      contd = left
      contd += engine.identify(pair[0])
      contd += @PAIR
      contd += root.right.command.path
      contd += engine.identify(pair[1])
      cleaned.push(contd)
    
    solved = []
    for pair in added
      contd = left
      contd += engine.identify(pair[0])
      contd += @PAIR
      contd += root.right.command.path
      contd += engine.identify(pair[1])

      if (index = cleaned.indexOf(contd)) > -1
        cleaned.splice(index, 1)
      else
        op = operation.parent
        engine.input.solve op, contd + @PAIR, scope, true
      
        
    for contd in cleaned
      @clean(engine, contd)
    

    cleaning = true
    for el in leftNew
      if el
        cleaning = false
        break
    if cleaning
      @unpair(engine, left, scope, operation)

  unpair: (engine, left, scope, operation) ->  
    if pairs = engine.pairs?[left]
      rights = []

      top = @getRoot(operation)
      for op, index in pairs by 3
        if pairs[index + 2] == scope && @getRoot(pairs[index + 1]) == top
          rights.push(index)

      cleaning = rights.slice()

      # clean right part if nobody else is subscribed
      for prefix, others of engine.pairs
        for other, i in others by 3
          for index, j in cleaning by -1
            if other == pairs[index] && (others != pairs || scope != others[i + 2])
              cleaning.splice(j, 1)


      #for index in cleaning
      #  delete engine.queries[right]
      for index in rights by -1
        right = pairs[index]
        @unlisten(engine, scope._gss_id, @PAIR, null, right.substring(1), undefined, scope, top)
        pairs.splice(index, 3)
      if !pairs.length
        delete engine.pairs[left]
    index = 0
    while contd = engine.lefts[index + 1]
      if contd == left && engine.lefts[index + 2] == scope
        engine.lefts.splice(index, 3)
      else
        index += 3
    @


  listen: (engine, operation, continuation, scope, left, right) ->
    observers = engine.pairs[left] ||= []
    if engine.indexOfTriplet(observers, right, operation, scope) == -1
      observers.push(right, operation, scope)

  unlisten: (engine, operation, continuation, scope, left, right) ->
    observers = engine.pairs[left] ||= []
    unless (index = engine.indexOfTriplet(observers, right, operation, scope)) == -1
      observers.splice(index, 3)


  # Scope variables and locals to the stylesheet
  getScope: (engine, node, continuation) ->
    if !node
      if (index = continuation.lastIndexOf('$')) > -1
        if path = @getScopePath(engine, continuation, 0)
          if scope = @getByPath(engine, path)
            if scope.scoped
              if (parent = engine.getScopeElement(scope.parentNode)) == engine.scope
                return
            return scope._gss_id
        if scope = engine.scope
          return scope.gss_id
    else if node != engine.scope
      return node._gss_id || node

  # Iterate parent scopes, skip conditions
  getScopePath: (engine, continuation, level = 0, virtualize) ->
    last = continuation.length - 1
    if continuation.charCodeAt(last) == 8594 # @PAIR
      last = continuation.lastIndexOf(@DESCEND, last)
    while true
      if (index = continuation.lastIndexOf(@DESCEND, last)) == -1
        if level > -1
          return ''

      if continuation.charCodeAt(index + 1) == 64
        if virtualize && level == -1
          break
        else
          ++level
      if level == -1
        break
      last = index - 1
      --level

    return continuation.substring(0, last + 1)

  getPrefixPath: (engine, continuation, level = 0) ->
    if path = @getScopePath(engine, continuation, level, true)
      return path + @DESCEND
    return ''

  # Return id of a parent scope element
  getParentScope: (engine, scope, continuation, level = 1) ->
    return scope._gss_id unless continuation
    if path = @getScopePath(engine, continuation, level)
      if result = @getByPath(engine, path)
        if result.scoped
          result = engine.getScopeElement(result)
      return result

    return engine.scope

  getByPath: (engine, path)->
    if (j = path.lastIndexOf('$')) > -1 && j > path.lastIndexOf(@DESCEND)
      # Virtual
      id = path.substring(j)
      last = id.length - 1
      if @DELIMITERS.indexOf(id.charCodeAt(last)) > -1
        id = id.substring(0, last)

      if id.indexOf('"') > -1
        return id

    return engine.identity[id] || @get(engine, path)

  # Remove all fork marks from a path. 
  # Allows multiple query paths have shared destination 
  getCanonicalPath: (continuation, compact) ->
    bits = @delimit(continuation).split(@DESCEND)
    last = bits[bits.length - 1]
    regexp = Query.CanonicalizeRegExp ||= new RegExp("" +
        "([^"   + @PAIR   + ",@])" +
        "\\$[^\[" + @ASCEND + "]+" +
        "(?:"   + @ASCEND + "|$)", "g")
    last = bits[bits.length - 1] = last.replace(regexp, '$1')
    return last if compact
    return bits.join(@DESCEND)

  getVariants: (path) ->
    [path, path + @ASCEND, path + @PAIR, path + @DESCEND, path + @DESCEND + '&']

  # Return collection shared for all codepaths
  getCanonicalCollection: (engine, path) ->
    return engine.queries[@getCanonicalPath(path)]
    
  getLocalPath: (engine, operation, continuation) ->
    return @continue(engine, operation, continuation)

  # Return shared absolute path of a dom query
  getGlobalPath: (engine, operation, continuation, node) ->
    return engine.identify(node) + ' ' + @getKey(engine, operation, continuation, node)

  # Compare position of two nodes to sort collection in DOM order
  # Virtual elements make up stable positions within collection,
  # so dom elements can be permuted only within range between virtual elements
  comparePosition: (a, b, op1, op2) ->
    if op1 != op2
      parent = op1.parent
      i = parent.indexOf(op1)
      j = parent.indexOf(op2)
      if i > j
        left = op2
        right = op1
      else
        left = op1
        right = op2

      index = i
      while next = parent[++index]
        break if next == right
        if next[0] == 'virtual'
          return i < j

      unless a.nodeType && b.nodeType 
        return i < j
    if a.compareDocumentPosition
      return a.compareDocumentPosition(b) & 4
    return a.sourceIndex < b.sourceIndex

  # Check if a node observes this qualifier or combinator
  match: (engine, node, group, qualifier, changed, continuation) ->
    return unless id = engine.identify(node)
    return unless watchers = engine.observers[id]
    if continuation
      path = @getCanonicalPath(continuation)

    for operation, index in watchers by 3
      if groupped = operation.command[group]
        contd = watchers[index + 1]
        continue if path && path != @getCanonicalPath(contd)
        scope = watchers[index + 2]
        # Check qualifier value
        if qualifier
          @qualify(engine, operation, contd, scope, groupped, qualifier)
        # Check combinator and tag name of a given element
        else if changed.nodeType
          @qualify(engine, operation, contd, scope, groupped, changed.tagName, '*')
        # Check combinator and given tag name
        else if typeof changed == 'string'
          @qualify(engine, operation, contd, scope, groupped, changed, '*')
        # Ditto in bulk: Qualify combinator with nodelist or array of tag names
        else for change in changed
          if typeof change == 'string'
            @qualify(engine, operation, contd, scope, groupped, change, '*')
          else
            @qualify(engine, operation, contd, scope, groupped, change.tagName, '*')
    return

  # Check if query observes qualifier by combinator 
  qualify: (engine, operation, continuation, scope, groupped, qualifier, fallback) ->
    if (indexed = groupped[qualifier]) || (fallback && groupped[fallback])
      @schedule(engine, operation, continuation, scope)
    return

  # Schedule matching observers (used when observer is shared within scope, e.g. in conditions)
  notify: (engine, continuation, scope) ->
    if watchers = engine.observers[engine.identify(scope)]
      for watcher, index in watchers by 3
        if watchers[index + 1] + watcher.command.key == continuation
          @schedule(engine, watcher, continuation, scope)
    return

  # Fire off all observers with their original continuations
  continuate: (engine, scope) ->
    if watchers = engine.observers[engine.identify(scope)]
      for watcher, index in watchers by 3
        scoped = watchers[index + 2]
        contd = watcher.command.continue(engine, watcher, watchers[index + 1], scoped)
        @schedule(engine, watcher, contd, scoped)
    return

  # Clean observers paths without removing the observers
  uncontinuate: (engine, scope) ->
    if watchers = engine.observers[engine.identify(scope)]
      for watcher, index in watchers by 3
        @clean(engine, watcher, @delimit(watchers[index + 1]), watcher, watchers[index + 2])    
    return

  # Add query into the queue 
  schedule: (engine, operation, continuation, scope) ->
    mutations = engine.updating.mutations ||= []

    length = (continuation || '').length
    last = null
    stylesheet = operation.stylesheet
    for watcher, index in mutations by 3
      contd = mutations[index + 1] || ''
      if watcher == operation && continuation == contd && scope == mutations[index + 2]
        return
      # Make shorter continuation keys run before longer ones
      if other = stylesheet
        if !last? && !@comparePosition(other, stylesheet, operation, operation)
          last = index + 3
      else if contd.length < length
        last = index + 3
    mutations.splice(last ? 0, 0, operation, continuation, scope)

  branch: (engine)->
    if conditions = engine.updating.branches
      engine.console.start('Branches', conditions.slice())
      engine.updating.branches = undefined
      removed = engine.updating.branching = []
      for condition, index in conditions by 3
        condition.command.unbranch(engine, condition, conditions[index + 1], conditions[index + 2])
      
      engine.triggerEvent('branch')
      queries = engine.updating.queries ||= {}
      collections = engine.updating.collections ||= {}

      @repair(engine, true)
      engine.updating.branching = undefined

      for path in removed
        if conditions.indexOf(path) > -1
          continue
        if collections
          delete collections[path]
        if queries
          delete queries[path]
        delete engine.queries[path]

      for condition, index in conditions by 3
        condition.command.rebranch(engine, condition, conditions[index + 1], conditions[index + 2])
      engine.console.end()
  # Hook: Should interpreter iterate returned object?
  # (yes, if it's a collection of objects or empty array)
  isCollection: (object) ->
    if object && object.length != undefined && !object.substring && !object.nodeType
      return true if object.isCollection
      switch typeof object[0]
        when "object"
          return object[0].nodeType
        when "undefined"
          return object.length == 0
module.exports = Query