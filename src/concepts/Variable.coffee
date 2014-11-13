class Variable

  constructor: (engine) ->
    unless engine
      args = Array.prototype.slice.call(arguments)
      args.unshift 'get'
      return args
    else if @engine
      return new Variable(engine)
    @engine = engine


  # Return domain that should be used to evaluate given variable
  getDomain: (operation, force, quick) ->
    if operation.domain && !force
      return operation.domain
    [cmd, scope, property] = variable = operation
    path = @getPath(scope, property)
    
    intrinsic = @engine.intrinsic
    if (scope || path.indexOf('[') > -1) && property && intrinsic?.properties[path]?
      domain = intrinsic
    else if scope && property && intrinsic?.properties[property] && !intrinsic.properties[property].matcher
      domain = intrinsic
    else
      for d in @engine.domains
        if d.values.hasOwnProperty(path) && (d.priority >= 0 || d.variables[path]) && d.displayName != 'Solved'
          domain = d
          break
        if d.substituted
          for constraint in d.substituted
            if constraint.substitutions?[path]
              domain = d
              break
    unless domain
      if property && (index = property.indexOf('-')) > -1
        prefix = property.substring(0, index)
        if (domain = @engine[prefix])
          unless domain instanceof @engine.Domain
            domain = undefined

      unless domain
        #if scope && property && @intrinsic?.properties[property]
        #  domain = @intrinsic.maybe()
        #else
        if !quick
          domain = @engine.linear.maybe()
    if variable && !force
      variable.domain = domain
    return domain


  # Return computed path for id and property e.g. $id[property]
  getPath: (id, property) ->
    unless property
      property = id
      id = undefined
    if property.indexOf('[') > -1 || !id
      return property
    else
      if typeof id != 'string'
        if id.nodeType
          id = @engine.identity.provide(id)
        else 
          id = id.path
      return id + '[' + property + ']'

module.exports = Variable
