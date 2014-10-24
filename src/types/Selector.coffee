Selector = (operation) ->

  @name = @serialize(operation, @constructor)
  @path = (operation[1]?.selector?.path || '') + @name

###
Selector::check = new Signature [
  [
    context: ['Node']
  ]
  qualifier: ['String']
  [
    operation: ['String']
    query: ['String']
  ]
]
###

Selector::push = (operation) ->
  unless group = @group
    return 

  unless command = @engine.methods[operation[0]]
    return 

  if command.group != group
    return 

  for i in [1 ... operation.length]
    if cmd = operation[i]?.command
      if cmd.group != group
        return

  for i in [1 ... operation.length]
    if cmd = operation[i]?.command
      @merge(cmd)

  @merge(command, operation)

  return @

Selector::merge = (command, operation) ->
  return if command == @
  string = @serialize(command, operation) 
  if operation
    @tail = operation
    @path += string
    @name += string
  else
    @path += @separator + string
  if command.scoped
    @scoped = command.scoped

Selector::serialize = (command, operation) ->
  if command.prefix
    string = command.prefix
  else
    string = operation[0]

  for index in [1 ... operation.length]
    if argument = operation[index]
      if command = argument.command
        string += command.name
      else
        string += argument

  if command.suffix
    string += suffix

  return string

Selector::prepare = (operation) ->
  prefix = ((parent && operation.name != ' ') || 
        (operation[0] != '$combinator' && typeof operation[1] != 'object')) && 
        ' ' || ''
  switch operation[0]
    when '$tag'
      if (!parent || operation == operation.selector?.tail) && operation[1][0] != '$combinator'
        group = ' '
        index = (operation[2] || operation[1]).toUpperCase()
    when '$combinator'
      group = prefix + operation.name
      index = operation.parent.name == "$tag" && operation.parent[2].toUpperCase() || "*"
    when '$class', '$pseudo', '$attribute', '$id'
      group = prefix + operation[0]
      index = (operation[2] || operation[1])
  return unless group
  ((@[group] ||= {})[index] ||= []).push operation

Selector::separator = ','
# Does selector start with ::this?
Selector::scoped    = undefined

# String representation of current selector operation
Selector::key       = undefined
# String representation of current selector operation chain
Selector::path      = undefined

# Reference to first operation in group
Selector::tail      = undefined
# Reference to last operation in group
Selector::head      = undefined

# Does the selector return only one element?
Selector::singular  = undefined