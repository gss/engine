Command = require('./Command')

class Query extends Command
  type: 'Query'
  
  constructor: (operation) ->
    @key = @path = @serialize(operation)

  # Pass control to parent operation (possibly multiple times)
  # For each node in collection, fork continuation with element id
  ascend: (engine, operation, continuation, scope, result, ascender) ->
    if parent = operation.parent
      if engine.isCollection(result)
        for node in result
          contd = @fork(engine, continuation, node)
          unless parent.command.yield?(node, engine, operation, contd, scope, ascender)
            parent.command.solve(engine, parent, contd, scope, parent.indexOf(operation), node)
        return
      else
        unless parent.command.yield?(result, engine, operation, continuation, scope, ascender)
          if ascender? || !@hidden || !@reference
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

  push: (operation) ->
    for index in [1 ... operation.length]
      if cmd = operation[index]?.command
        inherited = @inherit(cmd, inherited)


    if tags = @tags
      for tag, i in tags
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

  continue: (result, engine, operation, continuation = '') ->
    return continuation + @key

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
    query = operation.command.getPath(engine, operation, node)
    return engine.updating?.queries?[query]

  # Subscribe elements to query 
  after: (args, result, engine, operation, continuation, scope) ->
    
    updating = engine.updating
    path = operation.command.getPath(engine, operation, continuation)
    old = @get(engine, path)

    # Normalize query to reuse results
    command = operation.command

    node = if args[0]?.nodeType == 1 then args[0] else scope

    if !command.relative && !command.marked && 
            (query = operation.command.getPath(engine, operation, node, scope)) && 
            updating.queries?.hasOwnProperty(query)
      result = updating.queries[query]
    if updating.collections?.hasOwnProperty(path)
      old = updating.collections[path]
    else if !old? && (result && result.length == 0) && continuation
      old = @get(@getCanonicalPath(path))

    isCollection = engine.isCollection(result)

    # Clean refs of nodes that dont match anymore
    if old
      if engine.isCollection(old)
        removed = undefined
        for child, index in old
          if !old.scopes || old.scopes?[index] == scope
            if !result || Array.prototype.indexOf.call(result, child) == -1
              (removed ||= []).push child
      else if result != old
        if !result
          removed = old
        @clean(path, undefined, operation, scope)
      else if continuation.charAt(0) == @PAIR

        # Subscribe node to the query
        if id = engine.identify(node)
          observers = engine.observers[id] ||= []
          if (engine.indexOfTriplet(observers, operation, continuation, scope) == -1)
            operation.command.prepare(operation)
            observers.push(operation, continuation, scope)
        
        return old
      else
        return

    # Register newly found nodes
    if isCollection
      @[path] ||= []
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

    if result?.continuations
      @updateCollections(operation, path, scope, undefined, undefined, undefined, continuation)
    else
      @updateCollections(operation, path, scope, added, removed, undefined, continuation)
      
    #unless operation.def.capture
      # Subscribe node to the query
    if id = engine.identify(node)
      observers = engine.observers[id] ||= []
      if (engine.indexOfTriplet(observers, operation, continuation, scope) == -1)
        operation.command.prepare(operation)
        observers.push(operation, continuation, scope)
    
    if query
      @snapshot engine, query, old
      (engine.updating.queries ||= {})[query] = result

    @snapshot engine, path, old

    return if result == old

    unless result?.push
      @set path, result

    return added




  commit: (solution) ->
    # Update all DOM queries that matched mutations
    if @mutations
      index = 0
      while @mutations[index]
        watcher = @mutations.splice(0, 3)
        @engine.document.solve watcher[0], watcher[1], watcher[2]
      
    # Execute all deferred selectors (e.g. comma)
    if @ascending
      index = 0
      while @ascending[index]
        contd = @ascending[index + 1]
        collection = @[contd]
        if old = @engine.updating?.collections?[contd]
          collection = collection.slice()
          collection.isCollection = true
          for item, i in collection by -1
            if old.indexOf(item) > -1
              collection.splice(i, 1)
        if collection?.length
          op = @ascending[index]
          @engine.document.Command(op).ascend(@engine.document, op, contd, @ascending[index + 2], collection)
        index += 3
      @ascending = undefined
    @

  # Manually add element to collection, handle dups
  # Also stores path which can be used to remove elements
  add: (engine, node, continuation, operation, scope, key, contd) ->
    collection = @[continuation] ||= []

    if !collection.push
      return
    collection.isCollection = true

    keys = collection.continuations ||= []
    paths = collection.paths ||= []
    scopes = collection.scopes ||= []


    @snapshot engine, continuation, collection

    if (index = collection.indexOf(node)) == -1
      for el, index in collection
        break unless @comparePosition(el, node, keys[index], key)
      collection.splice(index, 0, node)
      keys.splice(index, 0, key)
      paths.splice(index, 0, contd)
      scopes.splice(index, 0, scope)
      @chain collection[index - 1], node, continuation
      @chain node, collection[index + 1], continuation
      if operation.parent[0] == 'rule'
        @engine.Stylesheet.match(node, continuation)

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
  get: (operation, continuation, old) ->
    if typeof operation == 'string'
      result = @[operation]
      return result

  # Remove observers from element
  unobserve: (engine, id, continuation, quick, path, contd, scope, top) ->
    if continuation != true
      refs = @getVariants(continuation)
    index = 0
    return unless (observers = typeof id == 'object' && id || engine.observers[id])
    while watcher = observers[index]
      query = observers[index + 1]
      if refs && 
          (refs.indexOf(query) == -1 || 
          (scope && scope != observers[index + 2]) ||
          (top && @getRoot(watcher) != top))
        index += 3
        continue
      if path
        parent = watcher
        matched = false
        while parent
          if parent.path == path
            matched = true
            break
          parent = parent.parent
        unless matched
          index += 3
          continue 

      subscope = observers[index + 2]
      observers.splice(index, 3)
      if !quick
        @clean(engine, watcher, query, watcher, subscope, true, contd ? query)
    if !observers.length && observers == engine.observers[id]
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
        @chain collection[index - 1], node, continuation
        @chain node, collection[index], continuation
        if operation.parent[0] == 'rule'
          @engine.Stylesheet.unmatch(node, continuation)
        return true



  # Remove observers and cached node lists
  remove: (id, continuation, operation, scope, needle = operation, recursion, contd = continuation) ->
    if typeof id == 'object'
      node = id
      id = @engine.identify(id)
    else
      if id.indexOf('"') > -1
        node = id
      else
        node = @engine.identity[id]

    if continuation

      collection = @get(continuation)

      if collection && @engine.isCollection(collection)
        @snapshot engine, continuation, collection
      
        removed = @removeFromCollection(node, continuation, operation, scope, needle, contd)
        
      else
        removed = undefined

      if removed != false
        @engine.pairs.remove(id, continuation)

        if parent = operation?.parent
          if @engine.isCollection(collection)
            string = continuation + id
          else
            string = continuation
          parent.command.release?(node, @engine, operation, string, scope)
          
      
        # Remove all observers that match continuation path
        ref = continuation + (collection?.length? && id || '')

        #if ref.charAt(0) == @PAIR
        #  @unobserve(id, ref, undefined, undefined, ref, scope)
        #else
        @unobserve(id, ref, undefined, undefined, ref)

        if recursion != continuation
          if removed != false #true#(removed || !parent?.command.release)
            @updateCollections operation, continuation, scope, recursion, node, continuation, contd
          if removed
            @clean(continuation + id)

    else if node
      # Detach queries attached to an element when removing element by id
      @unobserve(id, true)

    return removed


  clean: (path, continuation, operation, scope, bind, contd) ->
    if command = path.command
      path = (continuation || '') + (operation.uid || '') + (command.selector || command.key || '')
    continuation = path if bind
    result = @get(path)
    
    if (result = @get(path, undefined, true)) != undefined
      @each 'remove', result, path, operation, scope, operation, false, contd

    #if scope && operation.command.cleaning
    #  @remove @engine.identity.find(scope), path, operation, scope, operation, undefined, contd
    
    @engine.solved.remove(path)
    @engine.intrinsic.remove(path)
    @engine.Stylesheet?.remove(@engine, path)

    shared = false
    if @engine.isCollection(result)
      if result.scopes
        for s, i in result.scopes
          # fixme
          if s != scope || (operation && result.continuations[i] != operation)
            shared = true
            break

    if !shared
      @set path, undefined

    # Remove queries in queue and global observers that match the path 
    if @mutations
      @unobserve(@mutations, path, true)

    @unobserve((scope || @engine.scope)._gss_id, path)

    if !result || !@engine.isCollection(result)
      @engine.triggerEvent('remove', path)
    return true

  # If a query selects element from some other node than current scope
  # Maybe somebody else calculated it already
  fetch: (args, operation, continuation, scope) ->
    node = if args[0]?.nodeType == 1 then args[0] else scope
    query = operation.command.getPath(@engine, operation, node)
    return @engine.updating?.queries?[query]

  chain: (left, right, continuation) ->
    if left
      @match(left, ':last', '*', undefined, continuation)
      @match(left, ':next', '*', undefined, continuation)
    if right
      @match(right, ':previous', '*', undefined, continuation)
      @match(right, ':first', '*', undefined, continuation)

  updateCollections: (operation, path, scope, added, removed, recursion, contd) ->
    
    oppath = @getCanonicalPath(path)
    if path != oppath && recursion != oppath
      @updateCollection operation, oppath, scope, added, removed, oppath, path

    @updateCollection operation, path, scope, added, removed, recursion, contd || ''
    
  # Combine nodes from multiple selector paths
  updateCollection: (operation, path, scope, added, removed, recursion, contd) ->
    if removed
      @each 'remove', removed, path, operation, scope, operation, recursion, contd

    if added
      @each 'add', added, path, operation, scope, operation, contd

    if (collection = @[path])?.continuations
      sorted = collection.slice().sort (a, b) =>
        i = collection.indexOf(a)
        j = collection.indexOf(b)
        return @comparePosition(a, b, collection.continuations[i], collection.continuations[j]) && -1 || 1
      

      updated = undefined
      for node, index in sorted
        if node != collection[index]
          if !updated
            updated = collection.slice()
            if @[path]
              @[path] = updated
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

          @chain sorted[index - 1], node, path
          @chain node, sorted[index + 1], path

  # Perform method over each node in nodelist, or against given node
  each: (method, result = undefined, continuation, operation, scope, needle, recursion, contd) ->
    if @engine.isCollection(result)
      copy = result.slice()
      returned = undefined
      for child in copy
        if @[method] child, continuation, operation, scope, needle, recursion, contd
          returned = true
      return returned
    else if typeof result == 'object'
      return @[method] result, continuation, operation, scope, needle, recursion, contd


  set: (path, result) ->
    old = @[path]
    if !result?
      @snapshot engine, path, old
    if result
      @[path] = result
    else
      delete @[path]

    path = @getCanonicalPath(path)
    for left, observers of @paths
      if observers.indexOf(path) > -1
        (@dirty ||= {})[left] = true

    return


  onLeft: (operation, parent, continuation, scope) ->
    left = @getCanonicalPath(continuation)
    if @engine.Domain::indexOfTriplet(@lefts, parent, left, scope) == -1
      parent.right = operation
      @lefts.push parent, left, scope
      return true
    else
      (@dirty ||= {})[left] = true
      return false

  # Check if operation is pairly bound with another selector
  # Choose a good match for element from the first collection
  # Currently bails out and schedules re-pairing 
  onRight: (engine, operation, parent, continuation, scope, left, right) ->
    right = @getCanonicalPath(continuation.substring(0, continuation.length - 1))
    for op, index in @lefts by 3
      if op == parent && @lefts[index + 2] == scope
        left = @lefts[index + 1]
        @watch(engine, operation, continuation, scope, left, right)
    return unless left
    left = @getCanonicalPath(left)
    pairs = @paths[left] ||= []
    if pairs.indexOf(right) == -1
      pushed = pairs.push(right, operation, scope)
    if @repairing == undefined
      (@dirty ||= {})[left] = true
    return false

  remove: (id, continuation) ->
    return unless @paths[continuation]
    (@dirty ||= {})[continuation] = true
    
  retrieve: (engine, operation, continuation, scope, ascender, ascending, single) ->
    # Attempt pairing
    last = continuation.lastIndexOf(engine.PAIR)
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
        if id = continuation.match(@TrailingIDRegExp)
          if id[1].indexOf('"') > -1
            return id[1]
          return engine.identity[id[1]]
        else
          return engine.queries[continuation]
      
    return

  TrailingIDRegExp: /(\$[a-z0-9-_"]+)[↓↑→]?$/i

  repair: () ->
    return unless dirty = @dirty
    @dirty = undefined
    @repairing = true
    for property, value of dirty
      if pairs = @paths[property]?.slice()
        for pair, index in pairs by 3
          @solve property, pair, pairs[index + 1], pairs[index + 2]
    @repairing = undefined
      
  match: (collection, node, scope) ->
    if (index = collection.indexOf(node)) > -1
      if collection.scopes[index] == scope
        return true
      index = -1
      if dups = collection.duplicates
        while (index = dups.indexOf(node, index + 1)) > -1
          if collection.scopes[index + collection.length] == scope
            return true

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


  # Update bindings of two pair collections
  pair: (left, right, operation, scope) ->
    root = @getRoot(operation)
    right = @getScopePath(engine, scope, left) + root.right.command.path
    leftNew = @get(engine, left)
    rightNew = @get(engine, right)

    if engine.updating.collections.hasOwnProperty(left)
      leftOld = engine.updating.collections[left]
    else
      leftOld = leftNew
  
    if @engine.updating.collections.hasOwnProperty(right)
      rightOld = engine.updating.collections[right]
    else
      rightOld = rightNew

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

    @engine.console.group '%s \t\t\t\t%o\t\t\t%c%s', @PAIR, [['pairs', added, removed], ['new', leftNew, rightNew], ['old', leftOld, rightOld]], 'font-weight: normal; color: #999',  left + ' ' + PAIR + ' ' + root.right.command.path + ' in ' + @engine.identify(scope)
      

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
        engine.document.solve op, contd + @PAIR, scope, true
      
        
    for contd in cleaned
      @clean(engine, contd)
    

    cleaning = true
    for el in leftNew
      if el
        cleaning = false
        break
    if cleaning
      @unpair(engine, left, scope, operation)

    engine.console.groupEnd()

  unpair: (engine, left, scope, operation) ->  
    if pairs = @paths?[left]
      rights = []

      top = @getRoot(operation)
      for op, index in pairs by 3
        if pairs[index + 2] == scope && @getRoot(pairs[index + 1]) == top
          rights.push(index)

      cleaning = rights.slice()

      # clean right part if nobody else is subscribed
      top = @getRoot(operation)
      for prefix, others of @paths
        for other, i in others by 3
          for index, j in cleaning by -1
            if other == pairs[index] && (others != pairs || scope != others[i + 2])
              cleaning.splice(j, 1)


      for index in cleaning
        delete @engine.queries[right]
      for index in rights by -1
        right = pairs[index]
        @unlisten(engine, scope._gss_id, @PAIR, null, right.substring(1), undefined, scope, top)
        pairs.splice(index, 3)
      if !pairs.length
        delete @paths[left]
    index = 0
    while contd = @lefts[index + 1]
      if contd == left && @lefts[index + 2] == scope
        @lefts.splice(index, 3)
      else
        index += 3
    @


  listen: (operation, continuation, scope, left, right) ->
    observers = @paths[left] ||= []
    if @engine.Domain::indexOfTriplet(observers, right, operation, scope) == -1
      observers.push(right, operation, scope)

  unlisten: (operation, continuation, scope, left, right) ->
    observers = @paths[left] ||= []
    unless (index = @engine.Domain::indexOfTriplet(observers, right, operation, scope)) == -1
      observers.splice(index, 3)



  # Get path for the scope that triggered the script 
  # (e.g. el matched by css rule)
  getScopePath: (engine, scope, continuation) ->
    unless continuation 
      return ''
    bits = continuation.split(@DESCEND)
    unless bits[bits.length - 1]
      return continuation
    if scope && engine.scope != scope
      id = engine.identify(scope)
      prev = bits[bits.length - 2]
      # Ugh #1
      if prev && prev.substring(prev.length - id.length) != id
        last = bits[bits.length - 1]
        if (index = last.indexOf(id + @ASCEND)) > -1
          bits.splice(bits.length - 1, 0, last.substring(0, index + id.length))
    
    bits[bits.length - 1] = ""
    path = bits.join(@DESCEND)
    #if continuation.charAt(0) == @PAIR
    #  path = @PAIR + path
    return path


  # Scope variables and locals to the stylesheet
  getScope: (engine, node, continuation) ->
    if !node
      if (index = continuation.lastIndexOf('$')) > -1
        code = continuation.charCodeAt((length = continuation.length) - 1)
        if continuation.charCodeAt((length = continuation.length) - 1) == 8595 #descend
          length--

        id = continuation.substring(index, length)
        if el = engine.identity[id] || engine.queries[continuation.substring(0, length)]
          if el.scoped
            if (parent = engine.getScopeElement(el.parentNode)) == engine.scope
              return
            return node._gss_id
          return el._gss_id
    else if node != engine.scope
      return node._gss_id || node

  # Return id of a parent scope element
  getParentScope: (engine, scope, continuation, level = 1) ->
    return scope._gss_id unless continuation
    # Iterate parent scopes, skip conditions
    last = continuation.length - 1

    if continuation.charCodeAt(last) == 8594 # @PAIR
      last = continuation.lastIndexOf(@DESCEND, last) - 1

    while true
      index = continuation.lastIndexOf(@DESCEND, last)
      if (bit = continuation.substring(index + 1, last + 1)) && 
          bit.charCodeAt(0) != 64 && # @ ...
          --level == -1
        break
      if index == -1
        return engine.scope
      last = index - 1

    if (j = bit.lastIndexOf('$')) > -1
      # Virtual
      id = bit.substring(j)
      if id.indexOf('"') > -1
        return id

      # Element in collection
      if result = engine.identity[id]
        return engine.getScopeElement(result)

    # Singular element
    if result = @[continuation.substring(0, index)]
      return engine.getScopeElement(result)

    return engine.scope

  # Remove all fork marks from a path. 
  # Allows multiple query paths have shared destination 
  getCanonicalPath: (continuation, compact) ->
    bits = @delimit(continuation).split(@DESCEND)
    last = bits[bits.length - 1]
    last = bits[bits.length - 1] = last.replace(@CanonicalizeRegExp, '$1')
    return last if compact
    return bits.join(@DESCEND)

  getVariants: (path) ->
    [path, path + @ASCEND, path + @PAIR, path + @DESCEND]

  # Return collection shared for all codepaths
  getCanonicalCollection: (engine, path) ->
    return engine.queries[@getCanonicalPath(path)]
    
  # Return shared absolute path of a dom query ($id selector) 
  getPath: (engine, operation, continuation) ->
    if continuation
      if continuation.nodeType
        return engine.identify(continuation) + ' ' + @path
      else
        return continuation + (@selector || @key)
    else
      return (@selector || @key)


module.exports = Query