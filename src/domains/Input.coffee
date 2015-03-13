# Find, produce and observe variables
Domain      = require('../Domain')
Command     = require('../Command')
   
Variable    = require('../commands/Variable')
Constraint  = require('../commands/Constraint')

class Input extends Domain
  displayName: 'Input'
  url: undefined
  helps: true

  Iterator:   require('../commands/Iterator')
  Condition:  require('../commands/Condition')
  
  Properties: class
    
    right: (scope) ->
      id = @identify(scope)
      return ['+', ['get', @getPath(id, 'x')], ['get', @getPath(id, 'width')]]

    bottom: (scope, path) ->
      id = @identify(scope)
      return ['+', ['get', @getPath(id, 'y')], ['get', @getPath(id, 'height')]]
    
    center:
      x: (scope, path) ->
        id = @identify(scope)
        return ['+', ['get', @getPath(id, 'x')], ['/', ['get', @getPath(id, 'width')], 2]]

      y: (scope, path) ->
        id = @identify(scope)
        return ['+', ['get', @getPath(id, 'y')], ['/', ['get', @getPath(id, 'height')], 2]]

    computed: 
      right: (scope) ->
        id = @identify(scope)
        return ['+', ['get', @getPath(id, 'computed-x')], ['get', @getPath(id, 'computed-width')]]

      bottom: (scope, path) ->
        id = @identify(scope)
        return ['+', ['get', @getPath(id, 'computed-y')], ['get', @getPath(id, 'computed-height')]]
        


Input::Remove = Command.extend {
  signature: false

  extras: 1
},
  remove: (args..., engine)->
    for path in args
      engine.triggerEvent('remove', path)
    return true


# Catch-all class for unknown commands    
Input::Default = Command.Default.extend
  extras: 2

  execute: (args..., engine, operation) ->
    args.unshift operation[0]
    return args

# Topmost unknown command returns processed operation back to engine
Solving = Input::Default.extend
  
  condition: (engine, operation) ->
    if parent = operation.parent
      if parent.command instanceof Input::Default 
        return false

    operation.index ||= engine.input.index = (engine.input.index || 0) + 1
    return true

  extras: 4

  execute: (args..., engine, operation, continuation, scope) ->

    meta = 
      key: @delimit(continuation)
      #index: operation.index

    if scope != engine.scope
      meta.scope = engine.identify(scope)

    args.unshift operation[0]
    wrapper = @produce(meta, args, operation)
    wrapper.index = operation.index
    args.parent = wrapper

    if domain = @domain?(engine, operation)
      wrapper.parent = operation.parent
      wrapper.domain ||= domain

    (engine.updating.constraints ||= []).push(wrapper, domain)
    return

  produce: (meta, args)->
    return [meta, args]

  domain: (engine, operation) -> 
    if parent = operation.parent
      if domain = parent.command.domains?[parent.indexOf(operation)]
        return engine[domain]

# Dispatch commands to Output domain
Outputting = (engine, operation, command) ->
  if operation[0] == '='
    if operation[2].push
      Outputting.patch(engine.output, operation[2], true)
    return Outputting.patch(engine.output, operation, false)

  # Everything that's not for solver
  else if operation.command.type == 'Default' && 
      !engine.solver.signatures[operation[0]] && 
      (!engine.data.signatures[operation[0]]) && 
      (engine.output.signatures[operation[0]])

    return Outputting.patch(engine.output, operation)

Outputting.patch = (engine, operation, rematch) ->
  operation.domain = engine.output

  parent = operation.parent
  if parent?.command.sequence && parent.command.type != 'List'
    context = parent[parent.indexOf(operation) - 1]

  if parent?.command.domains?[parent.indexOf(operation)] == 'output'
    rematch = true

  if rematch != false 
    for argument, i in operation
      if argument.push
        if rematch || argument.command.type == 'Default' || argument.command.type == 'Variable'
          if engine.output.signatures[argument[0]]
            Outputting.patch(engine, argument, rematch)

  if (rematch || !engine.solver.signatures[operation[0]])
    if operation[0] == true
      match = Command.List
    else
      match = engine.Command.match(engine.output, operation, operation.parent, operation.parent?.indexOf(operation), context)
    
    Command.assign(engine, operation, match, context)
  
    unless context?
      Command.descend(operation.command, engine, operation)

  return match


# Register subclasses to be dispatched by condition
Input::Default::advices = [Outputting, Solving]

# Array of commands, stops command propagation
Input::List = Command.List

# Global variable
Input::Variable = Variable.extend {
  signature: [
    property: ['String']
  ],
}, 
  'get': (property, engine, operation, continuation, scope) ->
    if engine.queries
      if scope == engine.scope
        scope = undefined
      object = engine.Query::getScope(engine, scope, continuation)


    variable = ['get', engine.getPath(object, property)]
    if operation.domain != engine.input
      variable.domain = operation.domain
    return variable
    
# Scoped variable
Input::Variable.Getter = Input::Variable.extend {
  signature: [
    object:   ['Query', 'Selector', 'String']
    property: ['String']
  ]
},
  'get': (object, property, engine, operation, continuation, scope) ->
    if engine.queries
      prefix = engine.Query::getScope(engine, object, continuation)

    if prop = engine.properties[property]
      unless prop.matcher
        return prop.call(engine, object, continuation)
    
    if !prefix && engine.data.check(engine.scope, property)
      prefix = engine.scope

    variable = ['get', engine.getPath(prefix, property)]
    if operation.domain != engine.input
      variable.domain = operation.domain

    return variable
  
# Proxy math that passes basic expressions along
Input::Variable.Expression = Variable.Expression.extend {},
  '+': (left, right) ->
    ['+', left, right]
    
  '-': (left, right) ->
    ['-', left, right]
    
  '/': (left, right) ->
    ['/', left, right]
  
  '*': (left, right) ->
    ['*', left, right]
  
  
# Constant definition
Input::Assignment = Command.extend {
  type: 'Assignment'
  
  signature: [
    variable: ['String', 'Variable']
    value:    ['Variable', 'Number', 'Matrix', 'Command', 'Range', 'Default']
  ]
}


module.exports = Input