# Stupid simple observable object
# Will handle references and ownership for garbage collection
# Engine -> Engine

class References
  constructor: (@input, @output) ->
    @output ||= @input

  # Read in new references
  read: ->
    return @set.apply(@, arguments)
    
  # Trigger cleaning on output object
  write: ->
    return @output.clean.apply(@output, arguments)

  # Return concatenated path for a given object and prefix
  combine: (path, value) ->
    return value if typeof value == 'string'
    return path + "$" + @acquire(value)

  # Set a single reference by key
  set: (path, value) ->
    if value == undefined
      if old = @[path]
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

  get: (path) ->
    return @[path]

  # Get uid for given object. Pass force to generate id if there's none
  @identify: (object, force) ->
    return object._gss_id ||= object.id || ++References.uid

  # Get id or make one
  @acquire: (object) ->
    return References.identify(object, true)

  identify: (object, force) ->
    return References.identify(object, force)

  acquire: (object) ->
    return References.identify(object, true)

  @uid: 0

module.exports = References