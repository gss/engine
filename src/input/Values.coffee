class Values
  constructor: (@engine) ->
    @_observers = {}
    @_watchers = {}

  get: (id, property) ->
    return @[@engine.getPath(id, property)]

  watch: (id, property, operation, continuation, scope) ->
    path = @engine.getPath(id, property)
    observers = @_observers[continuation] ||= []
    observers.push(operation, path, scope)

    watchers = @_watchers[path] ||= []
    observers.push(operation, continuation, scope)
    return @get(id, property)

  unwatch: (id, property, operation, continuation, scope) ->
    path = @engine.getPath(id, property)
    observers = @_observers[continuation]
    for op, index in observers by 3
      if op == operation && observers[index + 1] == path && scope == observers[index + 2]
        observers.splice(index, 3)
        break

    watchers = @_watchers[path]
    for op, index in watchers by 3
      if op == operation && watchers[index + 1] == continuation && scope == watchers[index + 2]
        watchers.splice(index, 3)
        break

  clean: (continuation) ->
    if observers = @_observers[continuation]
      while observers[0]
        @unwatch(observers[1], observers[0], continuation, observers[2])
        

  pull: (object) ->
    @merge(object)

  set: (id, property, value) ->
    path = @engine.getPath(id, property)
    old = @[path]
    return if old == value
    if value?
      @[path] = value
    else
      delete @[path]
    if @engine._onChange
      @engine._onChange path, value, old
    if watchers = @engine._watchers?[path]
      for watcher, index in watchers by 3
        @engine.expressions.run watcher, watchers[index + 1], watchers[index + 2]

  merge: (object) ->
    for path, value of object
      @set path, undefined, value
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