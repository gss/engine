# Command is any kind of a function that
# may be referenced in a node of an expressions tree.

# This constructor allows non-collable commands defined
# with objects to be converted into callable
# functions that retain all definition properties, 
# but can be used outside of expressions (e.g. in tests or user scripts)

Command = (command, reference) ->
  if typeof command == 'object'
    helper = @Helper(command, false, reference)
    for key, value of command
      helper[key] = value
    return helper
  command.displayName = reference
  return command
  
module.exports = Command

