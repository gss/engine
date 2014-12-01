# Schedule, group, sort expressions by domain, graph and worker
# Then evaluate it asynchronously, in order. Re-evaluate side-effects.

Updater = (engine) ->
  Update = (problem, domain, parent, Default) ->
    # Handle constructor call (e.g. new engine.update)
    if @ instanceof Update
      @problems = problem && (domain.push && problem || [problem]) || []
      @domains  = domain  && (domain.push && domain  || [domain] ) || []
      return
    
    update = new @update

    # Process arguments
    for arg, index in problem
      continue unless arg?.push
      if typeof arg[0] == 'string'
        arg.parent ||= problem
        # Variable
        if arg[0] == 'get'
          vardomain = arg.domain ||= @getVariableDomain(@, arg, Default)
          update.push [arg], vardomain
        # Function call
        else
          @update(arg, null, update, Default)
        object = true
    unless object
      update.push [problem], null

    # Replace arguments updates with parent function update
    unless problem[0] instanceof Array
      index = update.wrap(problem, parent, Default)

    # Unroll recursion, solve problems
    if parent ||= @updating
      return parent.push(update)
    else
      return update.each @resolve, @engine

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
    if reverse || !domain
      position = @index + 1
    else
      position = @domains.length
      while (other = @domains[position - 1]) && (other.priority < domain.priority)
        --position
    @insert(position, domain, problems)


  # Add given problems to a problem list at given position
  append: (position, problems, reverse) ->
    cmds = @problems[position]
    domain = @domains[position]
    if reverse
      cmds.unshift.apply cmds, problems
    else
      cmds.push.apply cmds, problems
    for problem in problems
      if domain
        @setVariables(cmds, problem)
        @reify(problem, domain)
    if domain
      @connect(position)

  # Add new domain/problems pair to the queue
  insert: (position, domain, problems) ->
    for problem in problems
      problem.variables = @setVariables(problems, problem)

    @domains.splice(position, 0, domain)
    @problems.splice(position, 0, problems)

    @reify(problems, domain)
    @connect(position, false)

  # Remove domain/problem pair at given index
  splice: (index) ->
    if (i = @engine.domains.indexOf(@domains[index])) > -1
      @engine.domains.splice i, 1
    @domains.splice(index, 1)
    @problems.splice(index, 1)

    if @variables
      for name, variable of @variables
        if variable > index
          @variables[name] = variable - 1
    
    return

  # Replace queued arguments with their parent function call
  wrap: (operation, parent, Default) ->
    positions = undefined
    for problems, index in @problems
      if domain = @domains[index]
        for argument in operation
          if problems.indexOf(argument) > -1
            if !other || other.priority > domain.priority
              position = index
              other = domain
            if !positions || positions.indexOf(index) == -1
              (positions ||= []).push(index)

    return unless positions

    for index, j in positions by -1
      if @domains[index].displayName != other.displayName
        positions.splice index, 1
      else
        problems = @problems[index]
        for argument in operation
          if (i = problems.indexOf(argument)) > -1
            if index == position && problems.indexOf(operation) == -1
              problems[i] = operation
              positions.splice(j, 1)
            else
              problems.splice(i, 1)

    if other
      for argument in operation
        if argument.push
          operation.variables = argument.variables = @setVariables(operation, argument, true)
      @setVariables(@problems[position], operation)

    if positions.length
      return @connect(position, positions)
    else
      return @connect(position)

  # Attempt to find and merge new domains that share variables
  connect: (target, positions) ->
    domain = @domains[target]
    problems = @problems[target]
    variables = @variables ||= {}

    unless positions
      if positions == false
        for property, variable of variables
          if variable >= target
            variables[property]++

      for property, variable of problems.variables
        if variable.domain.priority < 0 && variable.domain.displayName == domain.displayName
          if (i = variables[property])? && (i > @index) && (i != target)
            unless i in (positions ||= [])
              index = 0
              while positions[index] < i
                index++
              positions.splice index, 0, i
          else
            variables[property] = target

    offset = 0
    if positions
      for index in [0 ... positions.length] by 1
        i = positions[index]
        condition = 
          if domain.constraints && @domains[i].constraints
            @domains[i].constraints.length > domain.constraints.length
          else
            target > i

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
    domain = @domains[from]
    other = @domains[to]
    problems = @problems[from]
    result = @problems[to]

    unless domain.MAYBE
      domain.transfer(parent, other)
      exported = domain.export()

    for prob in problems
      if result.indexOf(prob) == -1
        (exported ||= []).push(prob)

    @splice from, 1

    if from < to
      method = 'unshift'
      to--

    if exported
      result[method || 'push'].apply(result, exported)

      for prob in exported
        @setVariables(result, prob)

      @reify(exported, other, domain)

      for property, variable of result.variables
        if variable.domain.priority < 0 && variable.domain.displayName == domain.displayName
          (@variables ||= {})[property] = to

    if !other.url && @engine.domains.indexOf(other) == -1
      @engine.domains.push(other)

    return to

  await: (url) ->
    (@busy ||= []).push(url)

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
            solution[property] = redefined[redefined.length - 1]
            if i != redefined.length - 1
              console.error(property, 'is looping: ', @redefined[property], ' and now ', value, 'again')
            continue
        if solution == @solution
          redefined = (@redefined ||= {})[property] ||= []
          if redefined[redefined.length - 1] != value && value?
            redefined.push(value)
        solution[property] = value
    return solution

  # Remove queued commands that match given key
  remove: (continuation, problem) ->
    for problems, index in @problems by -1
      break if index == @index
      for problem, i in problems by -1
        if problem && problem[0] && problem[0].key == continuation
          problems.splice(i, 1)
          if problems.length == 0
            @splice index, 1
    return

  # Find globally broadcasted commands and apply them to a domain
  perform: (domain) -> 
    globals = @domains.indexOf(null, @index + 1)
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
      if arg?.push
        @reify arg, domain, from
    return operation


  # clean cache by prefix
  cleanup: (name, continuation) ->
    old = @[name]
    if continuation
      if old
        length = continuation.length
        for prop of old
          if prop.substring(0, length) == continuation
            delete old[prop]
    else
      @[name] = {}
      @[name].previous = old

  reset: (continuation) ->
    @cleanup 'queries', continuation
    @cleanup 'collections', continuation
    @cleanup 'mutations'

  getProblems: (callback, bind) ->
    return GSS.prototype.clone @problems
    
  finish: ->
    @time = @engine.console.time(@start)
    @start = undefined

  index: -1
module.exports = Update