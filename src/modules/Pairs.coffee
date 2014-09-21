class Pairs
  constructor: (@engine) ->
    @lefts = []
    @paths = {}


  onLeft: (operation, continuation, scope) ->
    console.error('onLeft', arguments)
    left = @engine.getCanonicalPath(continuation)
    parent = @getTopmostOperation(operation)
    if @engine.indexOfTriplet(@lefts, parent, left, scope) == -1
      @lefts.push parent, left, scope
      contd = @engine.PAIR
      return @engine.PAIR
    else
      (@dirty ||= {})[left] = true
      return false

  getTopmostOperation: (operation) ->
    while !operation.def.noop
      operation = operation.parent
    return operation

  # Check if operation is pairly bound with another selector
  # Choose a good match for element from the first collection
  # Currently bails out and schedules re-pairing 
  onRight: (operation, continuation, scope, left, right) ->
    console.error('onRight', arguments)
    right = @engine.getCanonicalPath(continuation.substring(0, continuation.length - 1))
    parent = @getTopmostOperation(operation)
    for op, index in @lefts by 3
      if op == parent && @lefts[index + 2] == scope
        left = @lefts[index + 1]
        @watch(operation, continuation, scope, left, right)
    return unless left

    left = @engine.getCanonicalPath(left)
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
    last = continuation.lastIndexOf(@engine.PAIR)
    if last > 0
      parent = operation
      while parent = parent.parent
        break if parent.def.noop
      # Found right side
      first = continuation.indexOf(@engine.PAIR) 
      if first == 0 && last == continuation.length - 1
        return @onRight(operation, continuation, scope)
      # Found left side, rewrite continuation
      else if operation.def.serialized
        prev = -1
        while (index = continuation.indexOf(@engine.PAIR, prev + 1)) > -1
          if result = @getSolution(operation, continuation.substring(prev || 0, index), scope, true)
            return result
          prev = index 
        if first == continuation.length - 1
          return @onLeft(operation, continuation, scope)
    # Fetch saved result if operation path mathes continuation canonical path
    else
      return if continuation.length == 1
      contd = @engine.getCanonicalPath(continuation, true)#.replace(/@[0-9]+/g, '')
      if contd.charAt(0) == @engine.PAIR
        contd = contd.substring(1)
      if operation.path.substring(0, 6) == '::this'
        if (i = contd.lastIndexOf('::this')) > -1
          relative = contd.substring(i)
        else
          relative = '::this' + contd
      if contd == operation.path || relative == operation.path
        if id = continuation.match(@TrailingIDRegExp)
          return @engine.identity[id[1]]
        else
          return @engine.queries[continuation]
      
    return

  TrailingIDRegExp: /(\$[a-z0-9-_]+)[↓↑→]?$/i


  onBeforeSolve: () ->
    dirty = @dirty
    delete @dirty
    @repairing = true
    if dirty
      for property, value of dirty
        #unless @engine.updating.paired?[property]
        if pairs = @paths[property]?.slice()
          for pair, index in pairs by 3
            @solve property, pair, pairs[index + 1], pairs[index + 2]
    for property, value of dirty
      (@engine.updating.paired ||= {})[property] = value
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

  # Update bindings of two pair collections
  solve: (left, right, operation, scope) ->
    leftUpdate = @engine.updating.queries?[left]
    rightUpdate = @engine.updating.queries?[right]

    collections = [
      @engine.queries.get(left)
      @engine.queries.get(right)
    ]
    values = [
      leftUpdate?[0]?.nodeType && leftUpdate[0] || collections[0]
      if leftUpdate then leftUpdate[1] else collections[0]

      rightUpdate?[0]?.nodeType && rightUpdate[0] || collections[1]
      if rightUpdate then rightUpdate[1] else collections[1]
    ]

    I = Math.max(@count(values[0]), @count(values[1]))
    J = Math.max(@count(values[2]), @count(values[3]))


    padded = undefined
    for value, index in values
      unless value?.push
        length = if index > 1 then I else J
        values[index] = [0...length].map -> value
        
        values[index].single = true
      else if value?.splice
        values[index] = values[index].slice()
      else
        values[index] ||= []


    [leftNew, leftOld, rightNew, rightOld] = values

    if collections[0]?.keys && !leftNew.single
      for element, index in leftNew by -1
        if !@match(collections[0], element, scope)
          leftNew.splice(index, 1)

    if collections[1]?.keys && !rightNew.single
      for element, index in rightNew by -1
        if !@match(collections[1], element, scope)
          rightNew.splice(index, 1)

    #if collections[0]?.keys && !leftOld.single
    #  for element, index in leftOld by -1
    #    if !@match(collections[0], element, scope)
    #      leftOld.splice(index, 1)
#
    #if collections[1]?.keys && !rightOld.single
    #  for element, index in rightOld by -1
    #    if !@match(collections[1], element, scope)
    #      rightOld.splice(index, 1)


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
        @engine.document.solve operation.parent, contd + @engine.PAIR, scope, undefined, true
      
    for contd in cleaned
      @engine.queries.clean(contd)


    cleaning = true
    for el in leftNew
      if el
        cleaning = false
        break
    if cleaning
      @clean(left)

    debugger
    @engine.console.row('repair', [[added, removed], [leftNew, rightNew], [leftOld, rightOld]], left + @engine.PAIR + right)

  clean: (left) ->  
    if pairs = @paths?[left]
      rights = []

      for op, index in pairs by 3
        rights.push(op)
      # clean right part if nobody else is subscribed
      for prefix, others of @paths
        if others != pairs
          for right, index in rights by -1
            if others.indexOf(right) > -1
              rights.splice(index, 1)

      for right in rights
        @engine.queries.unobserve(@engine.scope._gss_id, @engine.PAIR, null, right.substring(1))
        delete @engine.queries[right]
      delete @paths[left]
    index = 0
    while contd = @lefts[index + 1]
      if contd == left
        @lefts.splice(index, 3)
      else
        index += 3


  set: (path, result) ->
    if pairs = @paths?[path]
      (@dirty ||= {})[path] = true
    else if path.charAt(0) == @engine.PAIR
      path = @engine.getCanonicalPath(path)
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