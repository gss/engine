# Registers path inheritance (e.g. queries that are scoped
# to element found by some selector) and deals with uids

# Input:  Anything, establishes inheritance
# Output: Engine, triggers cascade cleaning of removed paths

# State:  `@[path]`: collections of subpaths

class References
  constructor: (@input, @output) ->
    @output ||= @input

  # Read the new references
  read: ->
    return @set.apply(@, arguments)
    
  # Trigger cleaning on output object
  write: ->
    return @output.context.remove.apply(@output.context, arguments)

  # Return concatenated path for a given object and prefix
  combine: (path, value) ->
    return value if typeof value == 'string'
    return path + @identify(value)

  # Set a single reference by key
  set: (path, value) ->
    if value == undefined
      if old = @[path]
        @write(@identify old, path)
    else
      @[path] = @combine(path, value)

  # Add given reference to a collection by key
  append: (path, value) ->
    group = @[path] ||= []
    group.push @combine(path, value)

  # Remove given reference from collection
  remove: (path, value) ->
    if typeof value != 'string'
      id = value._gss_id
      value = @combine(path, value)
    if group = @[value]
      delete @[value]
      if group instanceof Array
        for child in group
          @write(child, path)
      else
        @write(group, path)

  # Get object by id
  @get: (path) ->
    return References::[path]

  # Get object by path or id
  get: (path) ->
    return @[path]

  # Get or generate uid for a given object.
  @identify: (object, generate) ->
    unless id = object._gss_id
      if object == document
        object = window
      unless generate == false
        object._gss_id = id = "$" + (object.id || ++References.uid)
      References::[id] = object
    return id

  # Get id if given object has one
  @recognize: (object) ->
    return References.identify(object, false)

  identify: (object) ->
    return References.identify(object)

  recognize: (object) ->
    return References.identify(object, false)

  @uid: 0

module.exports = References