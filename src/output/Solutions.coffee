class Solutions
  constructor: (@input, @output) ->
    @solver = new c.SimplexSolver()
    @solver.autoSolve = false
    c.debug = true
    
  # Read commands
  read: (commands)-> 
    @lastInput = commands
    for command in commands
      if command instanceof Array
        @add(subcommand) for subcommand in command
      else 
        @add(command)
    @solver.solve()
    console.log("Solver output", @solver._changed)
    response = {}
    for property, value of @solver._changed
      if value == 0
        console.log('got zero', value, property, @[property], @)
        if @[property] == 0
          delete @[property]
          value = null
      response[property] = value
    @write(response)
    return

  write: (results) ->
    @output.read(results) if @output

  remove: (constrain, path) ->
    if constrain instanceof c.Constraint
      @solver.removeConstraint(constrain)
      for other in constrain.paths
        unless other == path
          if group = solutions[path]
            if index = group.indexOf(constrain) > -1
              group.splice(index, 1)
            unless group.length
              delete solutions[path] 
      debugger
      for prop in constrain.props
        @[prop]--


  add: (command) ->
    if command instanceof c.Constraint
      @solver.addConstraint(command)
      if command.paths
        for path in command.paths
          (@[path] ||= []).push(command)
        for prop in command.props
          @[prop] = (@[prop] || 0) + 1
          
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