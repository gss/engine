# Stupid simple observable object
# Will handle references and ownership for garbage collection
# Engine -> Engine

class References
  constructor: (@input, @output) ->
    @output ||= @input

  # Trigger cleaning on output object
  write: ->
    return @output.clean.apply(@output, arguments)

  # Read in new references
  read: ->
    return @set.apply(@, arguments)

  # Return concatenated path for a given object and prefix
  combine: (path, value) ->
    return object if typeof object == 'string'
    return continuation + References.get(object)

  # Set a single reference by key
  set: (path, value) ->
    if value == undefined
      old = @[path]
      if old
        @clean(path, old)
    else
      @[path] = @combine(path, value)

  # Add given reference to a collection by key
  append: (path, value) ->
    group = @[path] ||= []
    group.push @combine(path, value)

  # Remove given ereference from collection
  remove: (path, value) ->
    if typeof value != 'string'
      id = value._gss_id
      value = @combine(path, id)
    if group = @[path]
      console.group('remove ' + path)
      delete @[path]
      if group instanceof Array
        if (index = group.indexOf(value)) > -1
          group.splice(index, 1)
          @write(path, value, id)
      else
        @write(path, value, id)
      console.groupEnd('remove ' + path)

  # Get id for given object. Pass force to generate id if there's none
  @get: (object, force) ->
    id = object && object._gss_id
    if !id && force
      object._gss_id = id = ++References.uid
    return id
  @uid: 0


module.exports = References