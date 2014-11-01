# Operation is a command represented with a plain array
# Can be either variable, a list of tokens, or function call


class Operation
  constructor: (engine) ->
    unless engine
      return Array.prototype.slice.call(arguments)
    else if @engine
      return new Operation(engine)
    @engine = engine

  sanitize: (exps, soft, parent = exps.parent, index = exps.index) ->
    if exps[0] == 'value' && exps.operation
      return parent[index] = @sanitize exps.operation, soft, parent, index
    for own prop, value of exps
      unless isFinite(parseInt(prop))
        unless prop == 'variables'
          delete exps[prop]
    for exp, i in exps
      if exp?.push
        @sanitize exp, soft, exps, i
    exps.parent = parent
    exps.index  = index
    exps

  orphanize: (operation) ->
    if operation.domain
      delete operation.domain
    for arg in operation
      if arg?.push
        @orphanize arg
    operation


  # Return element that is used as a context for given DOM operation
  getContext: (operation, args, scope, node) ->
    index = args[0].def && 4 || 0
    if (args.length != index && (args[index]?.nodeType))
      return args[index]
    if !operation.bound
      if (operation.def.serialized && operation[1].def && args[index]?)
        return args[index]
      return @engine.scope
    return scope

  getDomain: (operation, domain) ->
    if typeof operation[0] == 'string'
      if !domain.linear.signatures[operation[0]]
        return @engine.linear.maybe()
      for arg in operation
        if arg.domain && arg.domain.priority > domain.priority && arg.domain < 0
          return arg.domain
    return domain

  # get topmost meaniningful function call with matching domain
  ascend: (operation, domain = operation.domain) ->
    parent = operation
    while parent.parent &&  typeof parent.parent[0] == 'string' && 
          (!@engine.Command(parent.parent) || parent.domain == domain)
      parent = parent.parent
    while parent.parent?.domain == parent.domain
      parent = parent.parent
    return parent


  getRoot: (operation) ->
    while !operation.def.noop
      operation = operation.parent
    return operation


  # Return shared absolute path of a dom query ($id selector) 
  getQueryPath: (operation, continuation) ->
    if continuation
      if continuation.nodeType
        return @engine.identity.provide(continuation) + ' ' + operation.path
      else if operation.marked && operation.arity == 2
        return continuation + operation.path
      else
        return continuation + (operation.key || operation.path)
    else
      return operation.key


module.exports = Operation