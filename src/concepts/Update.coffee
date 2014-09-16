# Schedule, group, sort expressions by domain, graph and worker
# Then evaluate it asynchronously, in order. Re-evaluate side-effects.

Updater = (engine) ->
  Update = (domain, problem) ->
    # Handle constructor invocation
    if @ instanceof Update
      @domains  = domain  && (domain.push && domain  || [domain] ) || []
      @problems = problem && (domain.push && problem || [problem]) || []
      return

    # Handle invokation without specified domain
    if arguments.length == 1
      problem = domain
      domain = undefined
      start = true


    # Process arguments
    for arg, index in problem
      continue unless arg?.push
      arg.parent ?= problem
      arg.index  ?= index
      offset = 0

      # Analyze variable
      if arg[0] == 'get'
        vardomain = @getVariableDomain(arg)
        if vardomain.MAYBE && domain && domain != true
          vardomain.frame = domain
        effects = new Update vardomain, [arg]
      else
        # Handle framed expressions
        for a in arg
          if a?.push
            if arg[0] == 'framed'
              if typeof arg[1] == 'string'
                d = arg[1]
              else
                d = arg[0].uid ||= (@uids = (@uids ||= 0) + 1)
            else
              d = domain || true
            effects = @update(d, arg)
            break

      # Merge updates
      if effects
        if update && update != effects
          update.push(effects)
        else
          update = effects
      effects = undefined

    # Handle broadcasted commands (e.g. remove)
    if !update
      if typeof problem[0] == 'string'
        problem = [problem]
      foreign = true
      update = new @update [domain != true && domain || null], [problem]

    # Replace arguments updates with parent function update
    if typeof problem[0] == 'string'
      update.wrap(problem, @)
      update.compact()

    # Unroll recursion, solve problems
    if start || foreign
      if @updating
        if @updating != update
          return @updating.push(update)
      else
        return update.each @resolve, @engine

    return update

  if @prototype
    for property, value of @prototype 
      Update::[property] = value
  Update::engine = engine if engine
  return Update

Update = Updater()
Update.compile = Updater
Update.prototype =
  substitute: (parent, operation, solution) ->
    if parent == operation
      return solution
    for child, index in parent
      if child?.push
        if child == operation 
          parent[index] = solution
        else
          @substitute(child, operation, solution)

    return parent



  provide: (solution) ->
    return if (operation = solution.operation).exported
    parent = operation.parent
    # Provide solution for constraint that was set before
    if domain = parent.domain
      if parent.parent?.domain == domain
        root = solution.domain.getRootOperation(parent)
      else
        root = parent
      index = @domains.indexOf(domain, @index + 1)
      if index == -1
        index += @domains.push(domain)
      if problems = @problems[index]
        if problems.indexOf(root) == -1
          problems.push root
      else
        @problems[index] = [root]
    # Update queued constraint that was not evaluated yet
    else
      for problems, index in @problems
        if index >= @index
          p = parent
          while p
            if (i = problems.indexOf(p)) > -1
              @substitute(problems[i], operation, solution)
            p = p.parent
    return

  merge: (from, to) ->
    domain = @domains[from]
    return if domain.frame
    other = @domains[to]
    
    @problems[to].push.apply(@problems[to], domain.export())
    @problems[to].push.apply(@problems[to], @problems[from])
    @domains.splice(from, 1)
    @problems.splice(from, 1)
    for constraint in domain.constraints by -1
      domain.unconstrain(constraint)
    if (i = @engine.domains.indexOf(domain)) > -1
      @engine.domains.splice i, 1
    return true

  # Group expressions
  wrap: (problem) -> 
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
                      if @merge n, index
                        1#probs.splice(j, 1)
                    else
                      unless @merge index, n
                        exps.splice(--i, 1)

                      other = domain
                      i = j + 1
                      exps = @problems[n]

                    break
                  else if !other.MAYBE
                    @problems[index].push.apply(@problems[index], @problems[n])
                    @domains.splice(n, 1)
                    @problems.splice(n, 1)
                    continue
                if domain.priority < 0 && (domain.priority > other.priority || other.priority > 0)
                  i = j + 1
                  exps = @problems[n]
                  other = domain
                break
            break

        # Force operation domain
        if other
          opdomain = @engine.getOperationDomain(problem, other)
        if opdomain && (opdomain.displayName != other.displayName)
          if (index = @domains.indexOf(opdomain)) == -1
            index = @domains.push(opdomain) - 1
            @problems[index] = [problem]
          else
            @problems[index].push problem
          strong = exp.domain && !exp.domain.MAYBE
          for arg in exp
            if arg.domain && !arg.domain.MAYBE
              strong = true
          unless strong
            exps.splice(--i, 1)
        else unless bubbled
          if problem.indexOf(exps[i - 1]) > -1
            bubbled = true
            exps[i - 1] = problem

        if other
          for domain, counter in @domains
            if domain != other || bubbled
              if (other.MAYBE && domain.MAYBE) || domain.displayName == other.displayName
                problems = @problems[counter]
                for arg in problem
                  if (j = problems.indexOf(arg)) > -1
                    problems.splice(j, 1)

          @setVariables(problem, null, opdomain || other)
        return true

  # Simplify groupped multi-domain expression down to variables
  unwrap: (problems, domain, result = []) ->
    if problems[0] == 'get'
      problems.exported = true
      problems.parent = undefined
      result.push(problems)
      exports = (@exports ||= {})[@engine.getPath(problems[1], problems[2])] ||= []
      exports.push domain
    else
      problems.domain = domain
      for problem in problems
        if problem.push
          @unwrap(problem, domain, result)
    return result

  setVariables: (problem, target = problem, domain) ->
    variables = undefined
    for arg in problem
      if arg[0] == 'get'
        if !arg.domain || arg.domain.MAYBE || (arg.domain.displayName == domain.displayName && domain.priority < 0)
          (variables ||= []).push(@engine.getPath(arg[1], arg[2]))
      else if arg.variables
        (variables ||= []).push.apply(variables, arg.variables)
    target.variables = variables

  # Last minute changes to update before execution
  optimize: ->
    @compact()

    if @connect()
      @compact()

    @defer()


    @

  # Defer substitutions to thread
  defer: ->
    for domain, i in @domains by -1
      break if i == @index
      for j in [i + 1 ... @domains.length]
        if (url = @domains[j]?.url) && document?
          for prob, p in @problems[i] by -1
            while prob
              problem = @problems[j]
              if problem.indexOf(prob) > -1
                probs = @problems[i][p]
                unless probs.unwrapped
                  @problems[i].splice(p--, 1)
                  probs.unwrapped = @unwrap(probs, @domains[j], [], @problems[j])
                  @engine.update(probs.unwrapped)
                break
              prob = prob.parent
    return


  # Merge connected graphs 
  connect: ->
    connected = breaking = undefined
    i = @domains.length
    while domain = @domains[--i]
      break if i == @index
      problems = @problems[i]
      @setVariables(problems, null, domain)
      if vars = problems.variables
        for other, j in @domains by -1
          break if j == i || domain != @domains[i]
          if (variables = @problems[j].variables) && domain.displayName == @domains[j].displayName
            for variable in variables
              if vars.indexOf(variable) > -1
                if domain.frame == other.frame
                  if other.constraints?.length > domain.constraints?.length
                    @merge i, j--
                  else
                    @merge j, i
                  connected = true
                  break
                else
                  framed = domain.frame && domain || other
    while connected
      break unless @connect()
    return connected

  # Remove empty domains again
  compact: ->
    for problems, i in @problems by -1
      break if i == @index
      unless problems.length
        @problems.splice i, 1
        @domains.splice i, 1
        if @index >= i
          --@index
      for problem in problems by -1
        domain = @domains[i]
        problem.domain = domain
    return



  # Merge source update into target update
  push: (problems, domain, reverse) ->
    if domain == undefined
      for domain, index in problems.domains
        @push problems.problems[index], domain
      return @
    merged = undefined
    priority = @domains.length
    position = @index + 1
    while (other = @domains[position]) != undefined
      if other || !domain
        if other == domain
          cmds = @problems[position]
          for problem in problems
            exported = undefined
            if problem.exported
              for cmd in cmds
                if cmd[0] == problem[0] && cmd[1] == problem[1] && cmd[2] == problem[2]
                  if cmd.exported && cmd.parent.domain == problem.parent.domain
                    exported = true
                    break
            unless exported
              copy = undefined
              for cmd in cmds
                if (cmd == problem) || (cmd.parent && cmd.parent == problem.parent && cmd.index == problem.index)
                  copy = true

              unless copy
                if reverse
                  cmds.unshift problem
                else
                  cmds.push problem
          merged = true
          break
        else if other && domain
          if ((other.priority < domain.priority) || 
              (other.priority == domain.priority && other.MAYBE && !domain.MAYBE)) && 
              (!other.frame || other.frame == domain.frame)
            if priority == @domains.length
              priority = position
      position++
    if !merged
      @domains.splice(priority, 0, domain)
      @problems.splice(priority, 0, problems)

    return @

  each: (callback, bind, solution) ->
    if solution
      @apply(solution) 

    return unless @problems[@index + 1]

     
    @optimize()
    while (domain = @domains[++@index]) != undefined
      result = (@solutions ||= [])[@index] = 
        callback.call(bind || @, domain, @problems[@index], @index, @)

      console.info JSON.stringify(result)

      if @busy?.length && @busy.indexOf(@domains[@index + 1]?.url) == -1
        return result

      if result && result.onerror == undefined
        if result.push
          @engine.update(result)
        else
          @apply(result)
          solution = @apply(result, solution || {})
    @index--

    return solution || @

  apply: (result, solution = @solution) ->
    if solution && result != @solution
      for property, value of result
        solution[property] = value
    else unless solution
      @solution = solution = result
    return solution

  remove: (continuation, problem) ->
    if problem
      if (problem[0] == 'value' && problem[2] == continuation) || 
         (problem[0] == 'get'   && problem[3] == continuation)
        return true
      else for arg in problem
        if arg?.push
          if @remove continuation, arg
            return true
    else
      index = @index
      spliced = false
      while problems = @problems[index++]
        for problem, i in problems by -1
          if @remove continuation, problem
            problems.splice(i, 1)
            if !problems.length
              spliced = true
      if spliced
        @compact()




  getProblems: (callback, bind) ->
    return GSS.clone @problems

  index: -1


module.exports = Update