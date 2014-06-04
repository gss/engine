# Stupid simple observable object
module.exports = class Memory
  constructor: ->
    @_watchers = {}

  # Observe a value by key. Executes expression starting with a given token
  watch: (key, value) ->
    if watchers = @_watchers[key]
      if watchers.indexOf(value) == -1
        watchers.push(value)
    else
      watchers = @_watchers[key] = [value]

    return @object.callback value, key, @[key]

  # Assign a value by key, invoke callbacks
  set: (key, value) ->
    @[key] = value

    if watchers = @_watchers[key]
      for watcher in watchers
        @object.callback watcher, key, @[key]