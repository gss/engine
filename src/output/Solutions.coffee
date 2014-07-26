### Output: Constraints

Manages constraints, executes solver commands.
Removes dereferenced variables. Outputs solutions. 

State:

  @_variables: - records variables by name
                 and constraints by continuation

###

require('cassowary')
Space = require('../concepts/Space')

class Solutions extends Space
  constructor: (@engine, @output) ->
    @solver = new c.SimplexSolver()
    @solver.autoSolve = false
    c.debug = true
    @variables = {}
    
  # Read commands
  pull: (commands)->
    @response = response = {}
    @lastInput = commands

    # Add constraints, execute solver commands (suggest, remove, stay)
    for command in commands
      if command instanceof Array && typeof command[0] == 'object'
        @add(subcommand) for subcommand in command
      else 
        @add(command)

    # Solve constraints if constraints were changed, otherwise resolve
    if @constrained
      @constrained = undefined
      @solver.solve()
    else
      @solver.resolve()

    # Read updated solutions
    for property, value of @solver._changed
      response[property] = value
    @solver._changed = undefined

    # Nullify variables that are not referenced by any constraint
    if @nullified
      for property, value of @nullified
        if !@added || !(@added[property]?)
          @nullify(value)
          response[property] = null

    # Add new properties that equal to zero
    if @added
      for property, value of @added
        if !response[property] && (!@nullified || !@nullified[property])
          response[property] = 0

    @added = @nullified = undefined
    @lastOutput = response

    if startTime = @engine.expressions.startTime
      
      @engine.console.row('Result', JSON.parse(JSON.stringify(response)), GSS.time(startTime) + 'ms')

    @push(response)
    return

  push: (results) ->
    if @output
      @output.pull(results)
    else
      @engine.values.merge(results)
      @engine.push(results)

  remove: (constrain, path) ->
    if constrain instanceof c.Constraint
      @solver.removeConstraint(constrain)
      for path in constrain.paths
        if typeof path == 'string'
          if group = @variables[path]
            if (index = group.indexOf(constrain)) > -1
              group.splice(index, 1)
            unless group.length
              delete @variables[path]
        else
          unless --path.counter
            (@nullified ||= {})[path.name] = path
    else if constrain instanceof c.Variable
      if constrain.editing
        (@nullified ||= {})[constrain.name] = constrain

  nullify: (variable) ->
    if variable.editing
      if cei = @solver._editVarMap.get(variable)
        @solver.removeColumn(cei.editMinus)
        @solver._editVarMap.delete(variable)
    delete @variables[variable.name]
    # Explicitly remove variable from cassowary
    @solver._externalParametricVars.delete(variable)
    console.log('nullify', variable.name)

  add: (command) ->
    if command instanceof c.Constraint
      @constrained = true
      @solver.addConstraint(command)
      if command.paths
        for path in command.paths
          if typeof path == 'string'
            (@variables[path] ||= []).push(command)
          else
            path.counter = (path.counter || 0) + 1
            if path.counter == 1
              if @nullified && @nullified[path.name]
                delete @nullified[path.name]
              else
                (@added ||= {})[path.name] = 0
          
    else if @[command[0]]
      @[command[0]].apply(@, Array.prototype.slice.call(command, 1))

  edit: (variable, strength, weight, continuation) ->
    strength = @engine.strength(strength, 'strong')
    weight = @engine.weight(weight)
    constraint = new c.EditConstraint(variable, strength, weight)
    @solver.addConstraint(constraint)
    variable.editing = constraint
    return constraint

  suggest: (path, value, strength, weight, continuation) ->
    if typeof path == 'string'
      unless variable = @variables[path]
        if continuation
          variable = @engine.var(path)
          variables = (@variables[continuation] ||= [])
          if variables.indexOf(variable) == -1
            variables.push(variable)
        else
          return @response[path] = value
    else
      variable = path

    unless variable.editing
      @edit(variable, strength, weight, continuation)
    @solver.suggestValue(variable, value)
    return variable

  stay: ->
    for arg in arguments
      @solver.addStay(arg)
    return

module.exports = Solutions