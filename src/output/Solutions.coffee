class Solutions
  constructor: (@engine, @output) ->
    @solver = new c.SimplexSolver()
    @solver.autoSolve = false
    c.debug = true
    
  # Read commands
  pull: (commands)->
    @response = response = {}
    @lastInput = commands
    for command in commands
      if command instanceof Array && typeof command[0] == 'object'
        @add(subcommand) for subcommand in command
      else 
        @add(command)
    @solver.solve()
    for property, value of @solver._changed
      response[property] = value
    if @nullified
      for property, value of @nullified
        response[property] = null
      delete @nullified
    console.log("Solutions output", JSON.parse(JSON.stringify(@response)))
    @lastOutput = response
    @push(response)
    return

  push: (results) ->
    @output.pull(results) if @output

  remove: (constrain, path) ->
    if constrain instanceof c.Constraint
      console.info('removed constraint', path, constrain)
      @solver.removeConstraint(constrain)
      for path in constrain.paths
        if typeof path == 'string'
          if group = @[path]
            if (index = group.indexOf(constrain)) > -1
              group.splice(index, 1)
            unless group.length
              delete @[path]
        else
          unless --path.counter
            delete @[path.name]
            @solver._externalParametricVars.delete(path)
            (@nullified ||= {})[path.name] = null


  add: (command) ->
    if command instanceof c.Constraint
      @solver.addConstraint(command)
      if command.paths
        for path in command.paths
          if typeof path == 'string'
            (@[path] ||= []).push(command)
          else
            path.counter = (path.counter || 0) + 1
          
    else if @[command[0]]
      @[command[0]].apply(@, Array.prototype.slice.call(command, 1))

  edit: (variable, strength, weight) ->
    @solver.addEditVar(variable, @engine.context.strength(strength), @engine.context.weight(weight))

  suggest: (variable, value, strength, weight) ->
    #@solver.solve()
    @edit(variable, strength, weight)
    @solver.suggestValue(variable, value)
    #@solver.resolve()
    return value

  stay: (path, v) ->
    for i in [1..arguments.length]
      @solver.addStay(v)
    return

module.exports = Solutions