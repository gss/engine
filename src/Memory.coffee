# Stupid simple observable object
# Will handle references and ownership for garbage collection

module.exports = class Memory
  constructor: (@object) ->
    @_watchers = {}

  # Observe a value by key. Executes expression starting with a given token
  watch: (key, value, a,b,c) ->
    console.log('@memory.watch', [key, value])
    if watchers = @_watchers[key]
      return if watchers.indexOf(value) > -1
      watchers.push(value)
    else
      watchers = @_watchers[key] = [value]
    debugger
    return @object.callback value, key, @[key], a,b,c

  # Assign a value by key, invoke callbacks
  set: (key, value, a,b,c) ->
    @[key] = value
    if value == "get"
      debugger
    if watchers = @_watchers[key]
      for watcher in watchers
        @object.callback watcher, key, value, a,b,c

    return value