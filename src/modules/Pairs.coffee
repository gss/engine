class Pairs
  constructor: (@engine) ->
    @lefts = []
    @paths = {}


  onLeft: (operation, continuation, scope) ->
    left = @engine.getCanonicalPath(continuation)
    parent = @getTopmostOperation(operation)
    if @engine.indexOfTriplet(@lefts, parent, left, scope) == -1
      @lefts.push parent, left, scope
      return @engine.PAIR
    else
      #(@dirty ||= {})[left] = true
      return false

  getTopmostOperation: (operation) ->
    while !operation.def.noop
      operation = operation.parent
    return operation

  # Check if operation is pairly bound with another selector
  # Choose a good match for element from the first collection
  # Currently bails out and schedules re-pairing 
  onRight: (operation, continuation, scope, left, right) ->
    right = @engine.getCanonicalPath(continuation.substring(0, continuation.length - 1))
    parent = @getTopmostOperation(operation)
    if (index = @lefts.indexOf(parent)) > -1
      left = @lefts[index + 1]
      #@lefts.splice(index, 3)
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
    if continuation.charAt(continuation.length - 1) == @engine.PAIR
      return if continuation.length == 1
      parent = operation
      while parent = parent.parent
        break if parent.def.noop
      # Found right side
      if continuation.charAt(0) == @engine.PAIR
        return @onRight(operation, continuation, scope)
      # Found left side, rewrite continuation
      else if operation.def.serialized
        prev = -1
        while (index = continuation.indexOf(@engine.PAIR, prev + 1)) > -1
          if result = @getSolution(operation, continuation.substring(prev || 0, index), scope, true)
            return result
          prev = index 
        return @onLeft(operation, continuation, scope)
    # Fetch saved result if operation path mathes continuation canonical path
    else if continuation.lastIndexOf(@engine.PAIR) <= 0
      contd = @engine.getCanonicalPath(continuation, true) 
      if contd.charAt(0) == @engine.PAIR
        contd = contd.substring(1)
      if contd == operation.path
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
        unless @engine.updating.paired?[property]
          if pairs = @paths[property]
            for pair, index in pairs by 3
              @solve property, pair, pairs[index + 1], pairs[index + 2]
    for property, value of dirty
      (@engine.updating.paired ||= {})[property] = value
    delete @repairing
    

  # Update bindings of two pair collections
  solve: (left, right, operation, scope) ->
    leftUpdate = @engine.updating.queries?[left]
    rightUpdate = @engine.updating.queries?[right]

    values = [
      leftUpdate?[0] ? @engine.queries.get(left)
      if leftUpdate then leftUpdate[1] else @engine.queries.get(left)

      rightUpdate?[0] ? @engine.queries.get(right)
      if rightUpdate then rightUpdate[1] else @engine.queries.get(right)
    ]

    sorted = values.slice().sort (a, b) -> 
      (b?.push && b.length ? -1) - (a?.push && a.length ? -1)
    sorted[0] ||= []

    padded = undefined
    for value, index in values
      unless value?.push
        values[index] = sorted[0].map && (sorted[0].map -> value) || [value]
        values[index].single = true
      else
        values[index] ||= []

    [leftNew, leftOld, rightNew, rightOld] = values

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

    @engine.console.row('repair', [[added, removed], [leftNew, rightNew], [leftOld, rightOld]], left, right)

  clean: (left) ->  
    if pairs = @paths?[left]
      rights = []

      for op, index in pairs by 3
        rights.push(op)
      for left, others of @paths
        for index, right in rights by -1
          if others.indexOf(right) > -1
            rights.splice(index, 1)
      for right in rights
        @engine.queries.unobserve(@engine.scope._gss_id, @engine.PAIR, null, right.substring(1))
        delete @engine.queries[right]


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