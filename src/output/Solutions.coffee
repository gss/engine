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
    @write(@solver._changed)
    return

  write: (results) ->
    @output.read(results) if @output

  remove: (command) ->
    if command instanceof c.Constraint
      @solver.removeConstraint(command)


  add: (command) ->
    if command instanceof c.Constraint
      @solver.addConstraint(command)
      if command.paths
        for path in command.paths
          (@[path] ||= []).push(command)
          
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