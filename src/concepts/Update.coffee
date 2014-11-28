# Schedule, group, sort expressions by domain, graph and worker
# Then evaluate it asynchronously, in order. Re-evaluate side-effects.

Updater = (engine) ->
  Update = (problem, domain, parent, Default) ->
    # Handle constructor call (e.g. new engine.update)
    if @ instanceof Update
      @problems = problem && (domain.push && problem || [problem]) || []
      @domains  = domain  && (domain.push && domain  || [domain] ) || []
      return

    if start = !parent
      parent = @updating

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

    # Handle broadcasted commands (e.g. remove)
    #if !update
    #  if typeof problem[0] == 'string'
    #    problem = [problem]
    #  foreign = true
    #  update = new @update [problem], [domain != true && domain || null]

    # Replace arguments updates with parent function update
    unless problem[0] instanceof Array
      index = update.wrap(problem, parent, Default)


      #if index?
      #  update.connect(index)

    # Unroll recursion, solve problems
    
    if parent
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
        @setVariables(result, prob, other)

      @reify(exported, other, domain)

      for property, variable of result.variables
        if variable.domain.priority < 0 && variable.domain.displayName == domain.displayName
          (@variables ||= {})[property] = to

    if !other.url && @engine.domains.indexOf(other) == -1
      @engine.domains.push(other)

    return to

  # Group expressions
  wrap: (problem, parent, Default) -> 
    bubbled = undefined


    for other, index in @domains by -1
      exps = @problems[index]
      i = 0
      break if index == @index
      while exp = exps[i++]
        # If this domain contains argument of given expression
        continue unless  (j = problem.indexOf(exp)) > -1

        # Replace last argument of the strongest domain 
        # with the given expression (bubbles up domain info)
        k = l = j
        while (next = problem[++k]) != undefined
          if next && next.push
            for problems in @problems
              if (m = problems.indexOf(next)) > -1
                break
            if m > -1
              break
        continue if next

        # Iterate other arguments to join variable graphs
        while (previous = problem[--l]) != undefined
          if previous && previous.push && exps.indexOf(previous) == -1
            for domain, n in @domains by -1
              continue if n == index
              break if n == @index
              probs = @problems[n]

              if (j = probs.indexOf(previous)) > -1
                if domain != other && domain.priority < 0 && other.priority < 0
                  if !domain.MAYBE

                    if index < n || other.constraints?.length > domain.constraints?.length
                      @merge n, index, parent
                    else
                      unless (@merge index, n, parent)?
                        exps.splice(--i, 1)

                      other = domain
                      i = j + 1
                      exps = @problems[n]

                    break
                  else if !other.MAYBE
                    @merge n, index

                    continue
                if domain.priority < 0 && (domain.priority > other.priority || other.priority > 0)
                  i = j + 1
                  exps = @problems[n]
                  other = domain
                break
            break

        # Replace that last argument with the given function call
        if !other.signatures[problem[0]]
          opdomain = Default
        if opdomain && (opdomain.displayName != other.displayName)
          if (j = @domains.indexOf(opdomain, @index + 1)) == -1
            j = @domains.push(opdomain) - 1
            @problems[j] = [problem]
          else
            @problems[j].push problem
          problem.domain = opdomain
          #strong = exp.domain && !exp.domain.MAYBE
          #for arg in exp
          #  if arg.domain && !arg.domain.MAYBE
          #    strong = true
          #unless strong
          exps.splice(--i, 1)
          if exps.length == 0
            @splice index, 1
        else unless bubbled
          if problem.indexOf(exps[i - 1]) > -1
            bubbled = exps
            if exps.indexOf(problem) == -1
              exps[i - 1] = problem
            else 
              exps.splice(--i, 1)

            problem.domain = other

        # Update variables table (???)
        if other
          for domain, counter in @domains by -1
            if domain && (domain != other || bubbled)
              if (other.MAYBE && domain.MAYBE) || domain.displayName == other.displayName
                problems = @problems[counter]
                for arg in problem
                  if (j = problems.indexOf(arg)) > -1
                    @reify(arg, other, domain)
                    problems.splice(j, 1)
                    if problems.length == 0
                      @splice counter, 1

        if bubbled
          for arg in problem
            if arg.push
              if arg[0] == 'get'
                #if !arg.domain || arg.domain.displayName == other.displayName
                @setVariable(problem, arg[1], arg)
                @setVariable(exp, arg[1], arg)

              else if arg.variables
                for prop, value of arg.variables
                  @setVariable(problem, prop, value)
                  @setVariable(exp, prop, value)
          @setVariables(bubbled, problem, other)
          return @problems.indexOf(bubbled)
        return

  setVariable: (result, prop, arg, domain) ->
    variables = (result.variables ||= {})
    variables[prop] = arg

  setVariables: (result, probs, other) ->
    if probs.variables
      variables = result.variables ||= {}
      for property, operation of probs.variables
        #operation.domain = other
        variables[property] = operation
    return

  splice: (index) ->
    #unless @domains[index].constraints?.length > 0
    if (i = @engine.domains.indexOf(@domains[index])) > -1
      @engine.domains.splice i, 1
    @domains.splice(index, 1)
    @problems.splice(index, 1)

    if @variables
      for name, variable of @variables
        if variable > index
          @variables[name] = variable - 1
    
    return

  finish: ->
    @time = @engine.console.time(@start)
    @start = undefined

  # change all maybe-domains to this domain
  reify: (operation, domain, from) ->
    if operation.domain == from
      operation.domain = domain
    for arg in operation
      if arg?.push
        @reify arg, domain, from
    return operation

  register: (variables) ->


  connect: (position, inserted) ->
    index = @index
    domain = @domains[position]
    return unless domain
    problems = @problems[position]

    variables = @variables ||= {}
    connecting = undefined

    if inserted
      for property, variable of variables
        if variable >= position
          variables[property]++

    for property, variable of problems.variables
      if variable.domain.priority < 0 && variable.domain.displayName == domain.displayName
        if (i = variables[property])? && (i > index) && (i != position)
          unless i in (connecting ||= [])
            j = 0
            while connecting[j] < i
              j++
            connecting.splice j, 0, i
        else
          variables[property] = position


    offset = 0
    if connecting
      for index in [0 ... connecting.length] by 1
        i = connecting[index]
        other = @domains[i]
        condition = 
          if other.constraints && domain.constraints
            other.constraints.length > domain.constraints.length
          else
            position > i

        if condition
          from = i
          to = position
        else
          from = position
          to = i
        
        position = @merge(from, to)

        for j in [index + 1 ... connecting.length]
          if connecting[j] >= from
            connecting[j]--
    return

  # Merge source update into target update
  push: (problems, domain, reverse) ->
    if domain == undefined
      for domain, index in problems.domains
        @push problems.problems[index], domain
      return @
    priority = @domains.length
    position = @index + 1
    unless domain?
      debugger
    while (other = @domains[position]) != undefined
      if other || !domain
        if other == domain || (domain && !domain?.solve && other.url == domain.url)
          cmds = @problems[position]
          for problem in problems
            if reverse || (domain && !domain.solve && other.url == domain.url && problem[0] == 'remove')
              cmds.unshift problem
            else
              cmds.push problem
            @setVariables(cmds, problem, other)
            @reify(problem, other, domain)

          @connect(position)

          return true

        else if other && domain
          if (other.priority < domain.priority)
            priority = position
            break
          else if (other.priority == domain.priority && other.MAYBE && !domain.MAYBE) && 
              (!other.frame || other.frame == domain.frame)
            priority = position + 1
        else# if !domain || !other
          priority--
      position++
    for problem in problems
      @setVariables(problems, problem, domain)

    @insert priority, domain, problems

    @reify(problems, domain)
    @connect(priority, true)
    return @

  insert: (index, domain, problems) ->
    @domains.splice(index, 0, domain)
    @problems.splice(index, 0, problems)


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

  await: (url) ->
    (@busy ||= []).push(url)

  postMessage: (url, message) ->
    ((@posted ||= {})[url.url || url] ||= []).push(@engine.clone(message))

  terminate: ->
    if @posted
      #if (i = @domains.indexOf(@engine.intrinsic)) > -1
      #  if i == @domains.lastIndexOf(@engine.intrinsic)
      #    @engine.intrinsic.batch()
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

  getProblems: (callback, bind) ->
    return GSS.prototype.clone @problems

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
  index: -1


module.exports = Update