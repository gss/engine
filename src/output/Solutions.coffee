class Solutions
  constructor: (@input, @output) ->
    @solver = new c.SimplexSolver()
    @solver.autoSolve = false
    c.debug = true
    
  # Read commands
  pull: (commands)-> 
    @response = response = {}
    @lastInput = commands
    for command in commands
      if command instanceof Array
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
    @push(response)
    return

  push: (results) ->
    @output.pull(results) if @output

  remove: (constrain, path) ->
    if constrain instanceof c.Constraint
      console.info('removed constraint', path, constrain)
      @solver.removeConstraint(constrain)
      for variable in constrain.variables
        if group = @[variable.path]
          if (index = group.indexOf(constrain)) > -1
            group.splice(index, 1)
          unless group.length
            delete @[variable.path]
        
        unless --@[variable.name]
          delete @[variable.name]
          @solver._externalParametricVars.delete(variable)
          (@nullified ||= {})[variable.name] = null


  add: (command) ->
    if command instanceof c.Constraint
      @solver.addConstraint(command)
      if command.variables
        for variable in command.variables
          (@[variable.path] ||= []).push(command)
          @[variable.name] = (@[variable.name] || 0) + 1
          
    else if @[command[0]]
      @[command[0]].apply(@, Array.prototype.slice.call(command))

  edit: (variable) ->
    @solver.addEditVar(variable)

  suggest: (variable, value, strength, weight) ->
    @solver.solve()
    @edit(variable, @strength(strength), @weight(weight))
    @solver.suggestValue(variable, value)
    @solver.resolve()

  stay: (path, v) ->
    for i in [1..arguments.length]
      @solver.addStay(v)
    return

module.exports = Solutions