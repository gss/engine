# Wrapper around foreign api functions
# to build up object trees native to api
# while keeping meta data around.

Wrapper = (node, args, result, operation, continuation, scope) ->
  # variable[paths] -> constrain[paths]
  if @isConstraint(result) || @isExpression(result) || @isVariable(result)
    result = [result]
    offset = +(typeof operation[0] == 'string')
    for arg, index in args
      if operation[index + offset]?[0] == 'value'
        result.push(operation[index + offset])
      if @isVariable(arg)
        result.push(arg)
      if arg.paths
        result.push.apply(result, arg.paths)
        arg.paths = undefined
  # [variable, path] -> variable[paths]
  if result.length > 0
    if result.length > 1
      result[0].paths = result.splice(1)
    result[0].operation = @clone operation
    return result[0]
  return result

# Wrap constraint helpers to be used as helpers in code
Wrapper.compile = (constraints, engine, methods) ->
  for property, method of constraints
    # Overload constraint definitions so they 
    # can use [variable, ...paths] 
    # in place of regular variables
    if method.length > 3
      do (property, method) ->
        constraints[property] = (left, right, strength, weight) ->
          if left.push
            overloaded = left = @Wrapper(null, null, left)
          if right.push
            overloaded = right = @Wrapper(null, null, right)
          value = method.call(@, left, right, strength, weight)
          if overloaded
            return Wrapper(null, [left, right], value)
          return value
    else 
      (methods ||= {})[property] = method
    constraints[property].after = 'Wrapper'

module.exports = Wrapper