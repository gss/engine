# Schedule, group, sort expressions by domain, dependencies and worker
# Evaluates commands and their side effects in ordered batches

Updater = (engine) ->
  Update = (problem, domain, parent, Domain, Auto) ->
    # Handle constructor call (e.g. new engine.update)
    if @ instanceof Update
      @problems = problem && (domain.push && problem || [problem]) || []
      @domains  = domain  && (domain.push && domain  || [domain] ) || []
      return
    
    update = undefined

    if typeof problem[0] == 'string'
      unless @solver.signatures[problem[0]]
        Domain = @output

    # Process arguments
    for arg, index in problem
      continue unless arg?.push
      unless arg[0] instanceof Array
        arg.parent ||= problem
        # Variable
        if arg[0] == 'get'
          vardomain = arg.domain ||= @getVariableDomain(arg, Domain)
          (update ||= new @update).push [arg], vardomain
        # Function call
        else
          if result = @update(arg, domain, update || false, Domain)
            update ||= result

        object = true
    unless object
      unless problem instanceof Array
        update.push [problem], null

    # Replace arguments updates with parent function update
    unless problem[0] instanceof Array
      if update
        update.wrap(problem, parent, domain || Domain)
      else if problem[0] != 'remove'
        return
      else
        update = new @update([problem], [domain || Domain || null])
    
    # Unroll recursion, deal with the update
    if parent == false
      return update
    else if parent ||= @updating
      return parent.push(update)
    else
      return update.each @resolve, @

  if @prototype
    for property, value of @prototype 
      Update::[property] = value
  Update::engine = engine if engine
  return Update

Update = Updater()
Update.compile = Updater
Update.prototype =

  # Merge given problem-domain pair or update
  push: (problems, domain, reverse) ->
    if domain == undefined
      for domain, index in problems.domains
        @push problems.problems[index], domain
      return @

    # Combine with other problems scheduled for this domain
    if (position = @domains.indexOf(domain, @index + 1)) > -1
      return @append position, problems, reverse

    # Find an insertion point
    if !domain
      position = @index + 1
    else
      position = @domains.length
      while position - 1 > @index && (other = @domains[position - 1])
        unless (other.priority < domain.priority || 
            (reverse && @problems[position - 1][0][0] != 'remove'))
          break
        --position
    @insert(position, domain, problems)
    return position

  # Add given problems to a problem list at given position
  append: (position, problems, reverse) ->
    cmds = @problems[position]
    domain = @domains[position]
    @mix cmds, problems
    
    for problem in problems
      if domain
        @setVariables(cmds, problem)
        @reify(problem, domain)
    if domain
      @connect(position)

  # Add new domain/problems pair to the queue
  insert: (position, domain, problems) ->
    for problem in problems
      @setVariables(problems, problem)

    @domains.splice(position, 0, domain)
    @problems.splice(position, 0, problems)

    if variables = @variables
      for property, variable of variables
        if variable >= position
          variables[property]++

    @reify(problems, domain)
    @connect(position)

  # Remove domain/problem pair at given index
  splice: (index) ->
    domain = @domains[index]
    @domains.splice(index, 1)
    @problems.splice(index, 1)

    if @variables
      for name, variable of @variables
        if variable >= index
          if variable == index
            @variables[name] = undefined
          else
            @variables[name] = variable - 1
    
    return

  # Replace queued arguments with their parent function call
  wrap: (operation, parent, Domain, Auto) ->
    positions = undefined
    for problems, index in @problems
      if domain = @domains[index]
        signed = typeof operation[0] != 'string' || domain.signatures[operation[0]]
        for argument in operation
          if signed && problems.indexOf(argument) > -1
            if !other || (domain.Engine && !other.Engine)
              position = index
              other = domain
          if !positions || positions.indexOf(index) == -1
            (positions ||= []).push(index)

    # Use suggested domain if no argument domain can handle operation
    if (!other || (Domain && other.displayName != Domain.displayName))
      other = Domain
      position = @push [operation], other

    if !positions
      @push [operation], null
      return

    # Replace chosen argument with operation, clean arguments
    for index, j in positions by -1
      if (domain = @domains[index]).displayName != other.displayName
        positions.splice j, 1
      else
        problems = @problems[index]
        for argument in operation
          if (i = problems.indexOf(argument)) > -1
            if argument.push
              @reify(argument, other, domain)
            if index == position && problems.indexOf(operation) == -1
              problems[i] = operation
              positions.splice(j, 1)
              operation.domain = domain
            else
              problems.splice(i, 1)
              if problems.length == 0 && !domain.paths
                @splice(index, 1)
                if index < position
                  position--
                positions.splice(j, 1)

    if other
      operation.domain = other
      for argument in operation
        if argument.push
          operation.variables = argument.variables = @setVariables(operation, argument, true)
      @setVariables(@problems[position], operation)

    if positions.length
      return @connect(position, positions)
    else
      return @connect(position)

  # Find operations that use same variables with the same kind of solver
  match: (target, domain, positions) ->
    problems = @problems[target]
    variables = @variables ||= {}
    if Solver = domain.Engine
      for property, variable of problems.variables
        if variable.domain.Engine == Solver
          if (i = variables[property])? && (i != target)
            unless i in (positions ||= [])
              index = 0
              while positions[index] < i
                index++
              positions.splice index, 0, i
          else
            variables[property] = target

    return positions

  # Attempt to find and merge new domains that share variables
  connect: (target, positions) ->
    unless domain = @domains[target]
      return 

    if positions ||= @match(target, domain, positions)
      b = domain.constraints
      for index in [0 ... positions.length] by 1
        i = positions[index]
        a = @domains[i].constraints  
        condition =
          if a || b
            (a && a.length) < (b && b.length)
          else
            target < i

        if condition
          from = i
          to = target
        else
          from = target
          to = i
        
        target = @merge(from, to)

        for j in [index + 1 ... positions.length] by 1
          if positions[j] >= from
            positions[j]--

    return target

  # Combine two groups in the queue, and their domains if necessary
  merge: (from, to, parent) ->
    other = @domains[to]
    problems = @problems[from]
    result = @problems[to]

    if domain = @domains[from]
      if domain.paths && !domain.consumed 
        domain.transfer(parent, @, other)
        #domain.Constraint::split(domain)
        exported = domain.export()
        domain.register(false)

      for prob in problems
        if result.indexOf(prob) == -1
          (exported ||= []).push(prob)
        else
          @reify(prob, other, domain)

    @splice from, 1

    if from < to
      to--

    if exported
      @mix(result, exported)

      for prob in exported
        @setVariables(result, prob)

      @reify(exported, other, domain)

      if Solver = domain.Engine
        for property, variable of result.variables
          if variable.domain.Engine == Solver
            (@variables ||= {})[property] = to

    other.register()

    return to

  mix: (result, exported) ->
    for prob in exported
      for problem, index in result
        if (problem.index ? Infinity) > prob.index
          break
      result.splice(index, 0, prob)

  # Indicate that update is blocked on solutions from specific url
  await: (url) ->
    (@busy ||= []).push(url)

  # Queue and group messages by url to send them in batch
  postMessage: (url, message) ->
    ((@posted ||= {})[url.url || url] ||= []).push(@engine.clone(message))

  # Send queued messages to the workers
  terminate: ->
    if @posted
      for url, message of @posted
        worker = @engine.workers[url]
        paths = (worker.paths ||= {})
        values = (worker.values ||= {})
        changes = {}
        commands = [changes]
        removes = []
        for group in message
          for command in group
            first = command[0]
            if first == 'remove'
              for i in [1 ... command.length]
                delete paths[command[i]]
                removes.push(command[i])
            else if first == 'value'
              if command[2] != values[command[1]]
                changes[command[1]] = command[2]
            else
              if (path = first.key)?
                paths[path] = true
                if constants = first.values
                  for property, value of constants
                    if value != values[property]
                      changes[property] = value
              commands.push command
        if removes.length
          removes.unshift('remove')
          commands.splice(1, 0, removes)

        worker.postMessage(commands)
        while (i = @busy.indexOf(url)) > -1 && @busy.lastIndexOf(url) != i
          @busy.splice(i, 1)
      @posted = undefined

  # Iterate and execute groupped expressions 
  each: (callback, bind, solution) ->
    if solution
      @apply(solution) 

    return unless @problems[@index + 1]

    previous = @domains[@index]
    while (domain = @domains[++@index]) != undefined
      previous = domain

      # Update variable lookup table 
      if @variables
        for property, variable of @variables
          if variable <= @index
            delete @variables[property]

      # Use domain to solve groupped problems
      result = (@solutions ||= [])[@index] = 
        callback.call(bind || @, domain, @problems[@index], @index, @)

      # Send queued commands to worker
      if @busy?.length && @busy.indexOf(@domains[@index + 1]?.url) == -1
        @terminate()
        return result

      if result && result.onerror == undefined
        if result.push
          @engine.update(result)
        else
          @apply(result)
          solution = @apply(result, solution || {})

    @terminate()
    @index--

    return solution || @

  # Save results, check if solvers are caught in a re-solving loop
  apply: (result, solution = @solution) ->
    if result != @solution
      solution ||= @solution ||= {}
      for property, value of result
        if (redefined = @redefined?[property])
          i = redefined.indexOf(value)
          if i > -1
            last = redefined[redefined.length - 1]
            if Math.abs(last - value) < 2
              solution[property] = redefined[redefined.length - 1]
              if i != redefined.length - 1
                console?.error(property, 'is looping: ', @redefined[property], ' and now ', value, 'again')
            continue
        if solution == @solution
          redefined = (@redefined ||= {})[property] ||= []
          if redefined[redefined.length - 1] != value && value?
            redefined.push(value)

        if solution[property] != value
          @solved ?= true
          solution[property] = value
    return solution

  # Remove queued commands that match given key
  remove: (continuation, problem) ->
    @push([['remove', continuation]], null)

    for problems, index in @problems by -1
      break if index == @index
      for problem, i in problems by -1
        if problem && problem[0] && problem[0].key == continuation
          problems.splice(i, 1)
          if problems.length == 0
            @splice index, 1
    return

  # Find globally broadcasted commands and apply them to a domain
  # So it can be safely merged into another 
  perform: (domain) -> 
    globals = @domains.indexOf(null, @index)
    if globals > -1
      globs = @problems[globals]
      if typeof globs[0] == 'string'
        if globs[0] == 'remove'
          domain.remove.apply(domain, globs.slice(1))
      else
        for glob in globs
          if glob[0] == 'remove'
            domain.remove.apply(domain, glob.slice(1))
    
    return

  # Register expression variables in a given variable lookup table
  setVariables: (result, operation, share) ->
    if variables = operation.variables
      if !result.variables && share
        result.variables = variables
      else
        for property, variable of variables
          (result.variables ||= {})[property] = variable
    else if operation[0] == 'get'
      (result.variables ||= {})[operation[1]] = operation
    return result.variables
    
  # Replace domain references in given expression tree
  reify: (operation, domain, from) ->
    if operation.domain == from
      operation.domain = domain
    for arg in operation
      if arg && arg.push
        @reify arg, domain, from
    return operation


  # clean cache by prefix
  cleanup: (name, continuation) ->
    old = @[name]
    if continuation
      if old
        length = continuation.length
        for prop of old
          if prop.length > length
            if prop.substring(0, length) == continuation
              delete old[prop]
    else
      @[name] = undefined

  reset: (continuation) ->
    @cleanup 'queries', continuation
    @cleanup 'collections', continuation
    @cleanup 'mutations'
    
  commit: ->
    @restyled = undefined if @restyled
    @solved   = undefined if @solved
    @reflown  = undefined if @reflown

  getProblems: (callback, bind) ->
    return @engine.clone @problems
    
  finish: ->
    @time = @engine.console.getTime(@started)
    @started = undefined

  start: ->
    @started ?= @engine.console.getTime()

  isDone: ->
    return (@domains.length == @index + 1) && @isDocumentDone()

  isDocumentDone: ->
    return !@mutations && !@deferred && !@pairs && !@stylesheets && !@branches

  isDirty: ->
    return @restyled || @solved || @reflown
    
  hadSideEffects: (solution)->
    return solution || @domains.length > 0 || @hasOwnProperty('restyled')# || @solution

  block: ->
    @blocking++

  unblock: ->
    return --@blocking == 0

  blocking: 0

  index: -1
module.exports = Update