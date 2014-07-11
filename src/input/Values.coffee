class Values
  constructor: (@engine) ->
    @_observers = {}
    @_watchers = {}

  indexOf: (array, a, b, c) ->
    if array
      for op, index in array by 3
        if op == a && array[index + 1] == b && array[index + 2] == c
          return index
    return -1

  watch: (id, property, operation, continuation, scope) ->
    path = @engine.getPath(id, property)
    if @indexOf(@_watchers[path], operation, continuation, scope) == -1
      observers = @_observers[continuation] ||= []
      observers.push(operation, path, scope)

      watchers = @_watchers[path] ||= []
      watchers.push(operation, continuation, scope)
    return @get(path)

  unwatch: (id, property, operation, continuation, scope) ->
    path = @engine.getPath(id, property)
    observers = @_observers[continuation]
    index = @indexOf observers, operation, path, scope
    observers.splice index, 3
    delete @_observers[continuation] unless observers.length

    watchers = @_watchers[path]
    index = @indexOf watchers, operation, continuation, scope
    watchers.splice index, 3
    delete @_watchers[path] unless watchers.length

  clean: (continuation) ->
    for path in @engine.getPossibleContinuations(continuation)
      if observers = @_observers[path]
        while observers[0]
          @unwatch(observers[1], undefined, observers[0], path, observers[2])
    @
  
  pull: (object) ->
    @merge(object)

  get: (id, property) ->
    return @[@engine.getPath(id, property)]

  set: (id, property, value, buffered, meta) ->
    if arguments.length == 2
      value = property
      property = undefined
    path = @engine.getPath(id, property)
    old = @[path]
    return if old == value
    if value?
      @[path] = value
    else
      delete @[path]
    if @engine._onChange
      @engine._onChange path, value, old
    if watchers = @_watchers?[path]
      for watcher, index in watchers by 3
        break unless watcher
        unless capture?
          capture = @engine.expressions.capture(path) || false

        @engine.expressions.evaluate watcher.parent, watchers[index + 1], watchers[index + 2], meta, watcher.index, value
        
      @engine.expressions.release() if capture && !buffered
    return value
    
  merge: (object) ->
    capturing = @engine.expressions.buffer == undefined
    for path, value of object
      @set path, undefined, value, capturing
    @engine.expressions.release() if capturing && @engine.expressions.buffer != undefined

    @

  # Export values in a plain object. Use for tests only
  toObject: ->
    object = {}
    for property, value of @
      if @hasOwnProperty property
        if property != 'engine' && property != '_observers' && property != '_watchers'
          object[property] = value
    return object

module.exports = Values