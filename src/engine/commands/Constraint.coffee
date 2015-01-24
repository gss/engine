Command = require('../Command')

Constraint = Command.extend
  type: 'Constraint'

  signature: [
    left:     ['Variable', 'Number'],
    right:    ['Variable', 'Number']
    [
      strength: ['String']
      weight:   ['Number']
    ]
  ]

  # Provide logging for an action
  log: (args, engine, operation, continuation, scope, name) ->
    engine.console.push(name || operation[0], args, operation.hash ||= @toExpression(operation))

  # Create a hash that represents substituted variables
  toHash: (meta) ->
    hash = ''
    if meta.values
      for property of meta.values
        hash += property
    return hash

  # Shared interface:

  # Find applied constraint by expression ignoring input variables
  fetch: (engine, operation) ->
    if operations = engine.operations?[operation.hash ||= @toExpression(operation)]
      for signature, constraint of operations
        if engine.constraints?.indexOf(constraint) > -1
          return constraint

  # Register constraints in variables to handle external mutations
  declare: (engine, constraint) ->
    for path, op of constraint.variables
      if definition = engine.variables[path]
        constraints = definition.constraints ||= []
        unless constraints[0]?.operations[0]?.parent.values?[path]?
          if constraints.indexOf(constraint) == -1
            constraints.push(constraint)
    return

  # Unregister constraint from variables
  undeclare: (engine, constraint, quick) ->
    for path, op of constraint.variables
      if object = engine.variables[path]
        if (i = object.constraints?.indexOf(constraint)) > -1
          object.constraints.splice(i, 1)
          matched = false
          for other in object.constraints
            if engine.constraints.indexOf(other) > -1 && !other.operations[0].parent[0].values?[path]?
              matched = true
              break
          unless matched
            op.command.undeclare(engine, object, quick)
      #if constraint = engine.editing?['%' + path]
      #  engine.unedit(path)
    return

  # Add constraint by tracker if it wasnt added before
  add: (constraint, engine, operation, continuation) ->
    other = @fetch(engine, operation)

    operations = constraint.operations ||= other?.operations || []
    constraint.variables = operation.variables
    if operations.indexOf(operation) == -1
      for op, i in operations by -1
        if op.hash == operation.hash && op.parent[0].key == continuation
          operations.splice(i, 1)
          @unwatch engine, op, continuation
      operations.push(operation)


    @watch engine, operation, continuation
    if other != constraint
      if other
        @unset engine, other
      @set engine, constraint


    return

  reset: (engine) ->
    if engine.constrained
      for constraint in engine.constrained
        engine.Constraint::declare engine, constraint

    if engine.unconstrained
      for constraint in engine.unconstrained
        engine.Constraint::undeclare engine, constraint


    # Throw old solver away and make another when replacing constraints
    # To recompute things from a clean state
    
    if engine.instance._changed && engine.constrained && engine.unconstrained
      engine.instance = undefined
      engine.construct()
      if editing = engine.editing
        engine.editing = undefined

        for property, constraint of editing
          engine.edit(engine.variables[property], engine.variables[property].value)
      if engine.constraints
        for constraint in engine.constraints
          engine.Constraint::inject engine, constraint
    else
      if engine.unconstrained
        for constraint in engine.unconstrained
          engine.Constraint::eject engine, constraint
      if engine.constrained
        for constraint in engine.constrained
          engine.Constraint::inject engine, constraint
      engine.constrained ||= []


    engine.unconstrained = undefined


  # Register constraint in the domain
  set: (engine, constraint) ->
    if (engine.constraints ||= []).indexOf(constraint) == -1
      engine.constraints.push(constraint)
      (engine.constrained ||= []).push(constraint)
    if (index = engine.unconstrained?.indexOf(constraint)) > -1
      engine.unconstrained.splice(index, 1)

  # Unregister constraint in the domain
  unset: (engine, constraint) ->
    if (index = engine.constraints.indexOf(constraint)) > -1
      engine.constraints.splice(index, 1)
    if (index = engine.constrained?.indexOf(constraint)) > -1
      engine.constrained.splice(index, 1)
    else
      if (engine.unconstrained ||= []).indexOf(constraint) == -1
        engine.unconstrained.push(constraint)
    for operation in constraint.operations
      if (path = operation.parent[0].key)?
        @unwatch(engine, operation, path)
    return

  unwatch: (engine, operation, continuation) ->
    if paths = engine.paths[continuation]
      if (i = paths.indexOf(operation)) > -1
        paths.splice(i, 1)
        if paths.length == 0
          delete engine.paths[continuation]

  watch: (engine, operation, continuation) ->
    engine.add continuation, operation

  # Remove constraint from domain by tracker string
  remove: (engine, operation, continuation) ->
    if constraint = @fetch(engine, operation)
      if operations = constraint.operations
        if (index = operations.indexOf(operation)) > -1
          operations.splice(index, 1)
          if operations.length == 0
            @unset(engine, constraint)
          @unwatch engine, operation, continuation

  # Find constraint in the domain for given variable
  find: (engine, variable) ->
    for other in variable.constraints
      if other.operations[0].variables[variable.name].domain == engine
        if engine.constraints.indexOf(other) > -1
          return true

  # Find groups of constraints that dont reference each other
  group: (constraints) ->
    groups = []
    for constraint in constraints
      groupped = undefined
      vars = constraint.variables

      for group in groups by -1
        for other in group
          others = other.variables
          for path of vars
            if others[path]
              if groupped && groupped != group
                groupped.push.apply(groupped, group)
                groups.splice(groups.indexOf(group), 1)
              else
                groupped = group
              break
          if groups.indexOf(group) == -1
            break
      unless groupped
        groups.push(groupped = [])
      groupped.push(constraint)
    return groups

  # Separate independent groups of constraints into multiple domains
  split: (engine) ->
    groups = @group(engine.constraints).sort (a, b) ->
      al = a.length
      bl = b.length
      return bl - al

    separated = groups.splice(1)
    commands = []
    if separated.length
      shift = 0
      for group, index in separated
        for constraint, index in group
          @unset engine, constraint
          for operation in constraint.operations
            commands.push operation.parent

    if commands?.length
      if commands.length == 1
        commands = commands[0]
      args = arguments
      if args.length == 1
        args = args[0]
      if commands.length == args.length
        equal = true
        for arg, i in args
          if commands.indexOf(arg) == -1
            equal = false
            break
        if equal
          throw new Error 'Trying to separate what was just added. Means loop. '
      return engine.Command.orphanize commands

module.exports = Constraint
