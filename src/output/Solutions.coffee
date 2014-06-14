class Solutions
  # Read commands
  read: (commands)-> 
    console.log("Solver input:", commands)
    for command in commands
      if command instanceof Array
        @process(subcommand) for subcommand in command
      else 
        @process(command)
    @solver.solve()
    console.log("Solver output", @solver._changed)
    return

  process: (command) ->
    if command instanceof c.Constraint
      @solver.addConstraint(command)

  # Assign styles
  write: (command) ->

  constructor: (@input, @output) ->
    @solver = new c.SimplexSolver()
    @solver.autoSolve = false
    c.debug = true

  write: (results) ->
    console.log('lolelo')
    @solver.addConstraint(result)
    if @output
      @output.read(results)

  edit: (variable) ->
    @solver.addEditVar(variable)

  suggest: (variable, value, strength, weight) ->
    @solver.solve()
    @edit variable, @strength(strength), @weight(weight)
    @solver.suggestValue(variable, value)
    @solver.resolve()

  stay: (path, v) ->
    for i in [1..arguments.length]
      @solver.addStay(v)
    return

module.exports = Solutions