class Pairs
  constructor: (@engine) ->
    @lefts = []
    @paths = {}


  onLeft: (operation, continuation, scope) ->
    left = @engine.Continuation.getCanonicalPath(continuation)
    parent = @engine.Operation.getRoot(operation)
    if @engine.indexOfTriplet(@lefts, parent, left, scope) == -1
      @lefts.push parent, left, scope
      contd = @engine.Continuation.PAIR
      return @engine.Continuation.PAIR
    else
      (@dirty ||= {})[left] = true
      return false

  # Check if operation is pairly bound with another selector
  # Choose a good match for element from the first collection
  # Currently bails out and schedules re-pairing 
  onRight: (operation, continuation, scope, left, right) ->
    right = @engine.Continuation.getCanonicalPath(continuation.substring(0, continuation.length - 1))
    parent = @engine.Operation.getRoot(operation)
    for op, index in @lefts by 3
      if op == parent && @lefts[index + 2] == scope
        left = @lefts[index + 1]
        @watch(operation, continuation, scope, left, right)
    return unless left

    left = @engine.Continuation.getCanonicalPath(left)
    pairs = @paths[left] ||= []
    if pairs.indexOf(right) == -1
      pushed = pairs.push(right, operation, scope)
    if @repairing == undefined
      (@dirty ||= {})[left] = true
    return false

  remove: (id, continuation) ->
    return unless @paths[continuation]
    (@dirty ||= {})[continuation] = true
    
  getSolution: (operation, continuation, scope, single) ->
    # Attempt pairing
    last = continuation.lastIndexOf(@engine.Continuation.PAIR)
    if last > 0
      parent = operation
      while parent = parent.parent
        break if parent.def.noop
      # Found right side
      first = continuation.indexOf(@engine.Continuation.PAIR) 
      if first == 0 && last == continuation.length - 1 && @onRight(operation, continuation, scope)?
        return false
      # Found left side, rewrite continuation
      else if operation.def.serialized
        prev = -1
        while (index = continuation.indexOf(@engine.Continuation.PAIR, prev + 1)) > -1
          if result = @getSolution(operation, continuation.substring(prev || 0, index), scope, true)
            return result
          prev = index 
        if first == continuation.length - 1
          return @onLeft(operation, continuation, scope)
    # Fetch saved result if operation path mathes continuation canonical path
    else
      return if continuation.length == 1
      contd = @engine.Continuation.getCanonicalPath(continuation, true)#.replace(/@[0-9]+/g, '')
      if contd.charAt(0) == @engine.Continuation.PAIR
        contd = contd.substring(1)
      if operation.path.substring(0, 6) == '::this'
        if (i = contd.lastIndexOf('::this')) > -1
          relative = contd.substring(i)
        else
          relative = '::this' + contd
      if contd == operation.path || relative == operation.path
        if id = continuation.match(@TrailingIDRegExp)
          if id[1].indexOf('"') > -1
            return id[1]
          return @engine.identity[id[1]]
        else
          return @engine.queries[continuation]
      
    return

  TrailingIDRegExp: /(\$[a-z0-9-_"]+)[↓↑→]?$/i


  onBeforeSolve: () ->
    dirty = @dirty
    delete @dirty
    @repairing = true
    if dirty
      for property, value of dirty
        if pairs = @paths[property]?.slice()
          for pair, index in pairs by 3
            @solve property, pair, pairs[index + 1], pairs[index + 2]
    delete @repairing
      
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
  solve: (left, right, operation, scope) ->
    a = @engine.queries.get(left)
    b = @engine.queries.get(right)

    sid = @engine.identity.provide(scope)

    leftOld =
      if @engine.updating.collections.hasOwnProperty(left)
        @engine.queries.filterByScope(@engine.updating.collections[left], scope)
      else
        @engine.queries.filterByScope(a, scope)

    rightOld =
      if @engine.updating.collections.hasOwnProperty(right)
        @engine.queries.filterByScope(@engine.updating.collections[right], scope)
      else
        @engine.queries.filterByScope(b, scope)

    leftNew = @engine.queries.filterByScope(a, scope, operation)

    rightNew = @engine.queries.filterByScope(b, scope, operation, true)

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
      for index in [leftOld.length ... leftNew.length]
        if rightNew[index]
          added.push([leftNew[index], rightNew[index]])

    cleaned = []
    for pair in removed
      continue if !pair[0] || !pair[1]
      contd = left
      unless leftOld.single
        contd += @engine.identity.provide(pair[0])
      contd += right
      unless rightOld.single
        contd += @engine.identity.provide(pair[1])
      cleaned.push(contd)
    
    solved = []
    for pair in added
      contd = left
      unless leftNew.single
        contd += @engine.identity.provide(pair[0])
      contd += right
      unless rightNew.single
        contd += @engine.identity.provide(pair[1])

      if (index = cleaned.indexOf(contd)) > -1
        cleaned.splice(index, 1)
      else
        @engine.document.solve operation.parent, contd + @engine.Continuation.PAIR, scope, undefined, true
      
        
    for contd in cleaned
      @engine.queries.clean(contd)
    

    cleaning = true
    for el in leftNew
      if el
        cleaning = false
        break
    if cleaning
      @clean(left, scope, operation)

    @engine.console.row('repair', [[added, removed], [leftNew, rightNew], [leftOld, rightOld]], @engine.identity.provide(scope) + left + right)

  clean: (left, scope, operation) ->  
    if pairs = @paths?[left]
      rights = []

      top = @engine.Operation.getRoot(operation)
      for op, index in pairs by 3
        if pairs[index + 2] == scope && @engine.Operation.getRoot(pairs[index + 1]) == top
          rights.push(index)

      cleaning = rights.slice()

      # clean right part if nobody else is subscribed
      top = @engine.Operation.getRoot(operation)
      for prefix, others of @paths
        for other, i in others by 3
          for index, j in cleaning by -1
            if other == pairs[index] && (others != pairs || scope != others[i + 2])
              cleaning.splice(j, 1)


      for index in cleaning
        delete @engine.queries[right]
      for index in rights by -1
        right = pairs[index]
        @engine.queries.unobserve(scope._gss_id, @engine.Continuation.PAIR, null, right.substring(1), undefined, scope, top)
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


  set: (path, result) ->
    if pairs = @paths?[path]
      (@dirty ||= {})[path] = true
    else if path.charAt(0) == @engine.Continuation.PAIR
      path = @engine.Continuation.getCanonicalPath(path)
      for left, watchers of @paths
        if watchers.indexOf(path) > -1
          (@dirty ||= {})[left] = true

  watch: (operation, continuation, scope, left, right) ->
    watchers = @paths[left] ||= []
    if @engine.indexOfTriplet(watchers, right, operation, scope) == -1
      watchers.push(right, operation, scope)

  unwatch: (operation, continuation, scope, left, right) ->
    watchers = @paths[left] ||= []
    unless (index = @engine.indexOfTriplet(watchers, right, operation, scope)) == -1
      watchers.splice(index, 3)



module.exports = Pairs