class Pairs
  constructor: (@engine) ->
    @lefts = []
    @paths = {}


  onLeft: (operation, continuation, scope) ->
    left = @engine.getCanonicalPath(continuation)
    if @engine.indexOfTriplet(@lefts, parent, left, scope) == -1
      @lefts.push parent, left, scope
    console.error('left', parent, left)
    return @engine.RIGHT

  # Check if operation is pairly bound with another selector
  # Choose a good match for element from the first collection
  # Currently bails out and schedules re-pairing 
  onRight: (operation, continuation, scope, left, right) ->
    right = continuation.substring(1, continuation.length - 1)
    if (index = @lefts.indexOf(parent)) > -1
      left = @lefts[index + 1]
      @lefts.splice(index, 3)
      @pair(operation, continuation, scope, left, right)
    console.error('right', 'roruro', [left, right], parent, @lefts.slice())

    left = @engine.getCanonicalPath(left)
    pairs = @paths[left] ||= []
    if pairs.indexOf(right) == -1
      pushed = pairs.push(right, operation, scope)
    if @repairing == undefined
      (@dirty ||= {})[left] = true
    return
    
  getSolution: (operation, continuation, scope) ->
    # Attempt pairing
    console.log('get sol', continuation)
    if continuation.charAt(continuation.length - 1) == @engine.RIGHT
      parent = operation
      while parent = parent.parent
        break if parent.def.noop
      # Found right side
      if continuation.charAt(0) == @engine.RIGHT
        return @onRight(operation, continuation, scope)
      # Found left side, rewrite continuation
      else if operation.def.serialized
        return @onLeft(operation, continuation, scope)



  solve: () ->
    dirty = @dirty
    @repairing = true
    if dirty
      for property, value of dirty
        if pairs = @paths[property]
          for pair, index in pairs by 3
            @repair property, pair, pairs[index + 1], pairs[index + 2], pairs[index + 3]
    delete @repairing
    

  # Update bindings of two pair collections
  repair: (path, key, operation, scope, collected) ->
    if window.zzzz
      debugger
    leftUpdate = @engine.workflow.queries?[path]
    leftNew = (if leftUpdate?[0] != undefined then leftUpdate[0] else @get(path)) || []
    if leftNew.old != undefined
      leftOld = leftNew.old || []
    else
      leftOld = (if leftUpdate then leftUpdate[1] else @get(path)) || []
    rightPath = @engine.getScopePath(path) + key
    rightUpdate = @engine.workflow.queries?[rightPath]

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
        @engine.document.solve operation.parent, prefix + operation.path, scope, @engine.UP, operation.index, pair[1]
      else
        @engine.document.solve operation, contd, scope, @engine.UP, true, true

    @engine.console.row('repair', [[added, removed], [leftNew, rightNew], [leftOld, rightOld]], path)

  set: (path, result) ->
    if pairs = @paths?[path]
      (@dirty ||= {})[path] = true

  unpair: (continuation, node) ->
    return unless match = @isPaired(null, continuation)
    path = @engine.getCanonicalPath(match[1])
    collection = @get(path)
    return unless pairs = @paths?[path]

    console.log('unpair', continuation)
    debugger

    oppath = @engine.getCanonicalPath(continuation, true)
    for pair, index in pairs by 3
      continue unless oppath == pair
      #contd = path + '→' + pair
      #@remove(node, contd, pairs[index + 1], pairs[index + 2], continuation)
      #@clean(path + match[2] + '→' + pair)
      #((@engine.workflow.queries ||= {})[contd] ||= [])[0] = @get(contd)
      schedule = (@dirty ||= {})[path] = true
    return

  watch: ->

  unwatch: ->

  clean: (path) ->
    if @[path]
      delete @[path]


module.exports = Pairs