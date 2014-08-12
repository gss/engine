# Queue and group expressions by domain

Workflow = (domain, problem) ->
  if @ instanceof Workflow
    @domains  = domain  && (domain.push && domain  || [domain] ) || []
    @problems = problem && (domain.push && problem || [problem]) || []
    return
  if arguments.length == 1
    problem = domain
    domain = undefined
    start = true
  if domain && domain != true
    domain = true

  for arg, index in problem
    continue unless arg?.push
    arg.parent ?= problem
    arg.index  ?= index
    offset = 0
    if arg[0] == 'get'
      @assumed.watch(arg[1], arg[2], arg, arg[3] || '')
      workload = new Workflow @getVariableDomain(arg), [arg]
    else
      for a in arg
        if a.push
          workload = @Workflow true, arg 
          break

    if workflow && workflow != workload
      workflow.merge(workload)
    else
      workflow = workload
  if problem[0] == '=='
    debugger
  if typeof problem[0] == 'string'
    workflow.bubble(problem, @)
  if start && !domain

    if arguments.length == 1
      console.log('Workflow', workflow)
    if @workflow
      return @workflow.merge(workflow)
    else
      return workflow.each @resolve, @engine

  return workflow

Workflow.prototype =
  provide: (solution) ->
    debugger
    operation = solution.domain.getRootOperation(solution.operation.parent)
    domain = operation.domain
    index = @domains.indexOf(domain)
    if index == -1
      index += @domains.push(domain)
    if problems = @problems[index]
      if problems.indexOf(operation) == -1
        problems.push operation
    else
      @problems[index] = [operation]
    return

  # Group expressions
  bubble: (problem, engine) -> 
    bubbled = undefined
    for other, index in @domains by -1
      exps = @problems[index]
      i = 0
      while exp = exps[i++]
        # If this domain contains argument of given expression
        continue unless  (j = problem.indexOf(exp)) > -1

        # Replace last argument of the strongest domain 
        # with the given expression (bubbles up domain info)
        k = l = j
        while (next = problem[++k]) != undefined
          if next && next.push
            break
        continue if next
        while (previous = problem[--l]) != undefined
          if previous && previous.push && exps.indexOf(previous) == -1
            for domain, n in @domains by -1
              continue if n == index 
              probs = @problems[n]
              if (j = probs.indexOf(previous)) > -1
                if domain != other && domain.priority < 0 && other.priority < 0
                  debugger
                  if !domain.MAYBE
                    if !other.MAYBE
                      if index < n
                        exps.push.apply(exps, domain.export())
                        exps.push.apply(exps, probs)
                        @domains.splice(n, 1)
                        @problems.splice(n, 1)
                        engine.domains.splice engine.domains.indexOf(domain), 1
                      else
                        probs.push.apply(probs, other.export())
                        probs.push.apply(probs, exps)
                        @domains.splice(index, 1)
                        @problems.splice(index, 1)
                        engine.domains.splice engine.domains.indexOf(other), 1
                        other = domain
                    break
                  else if !other.MAYBE
                    @problems[i].push.apply(@problems[i], @problems[n])
                    @domains.splice(n, 1)
                    @problems.splice(n, 1)
                    continue
                if domain.priority < 0 && (domain.priority > other.priority || other.priority > 0)
                  i = j + 1
                  exps = @problems[n]
                  other = domain
                break
            break

        #console.log('grouping', problem, exp, problem == exp)
        opdomain = engine.getOperationDomain(problem, other)
        if opdomain && opdomain != other
          if (index = @domains.indexOf(opdomain)) == -1
            index = @domains.push(opdomain) - 1
            @problems[index] = [problem]
          else
            @problems[index].push problem
          strong = undefined
          for arg in exp
            if arg.domain && !arg.domain.MAYBE
              strong = true
          unless strong
            exps.splice(--i, 1)

          other = opdomain
          console.error(opdomain, '->', other, problem)
        else unless bubbled
          bubbled = true
          exps[i - 1] = problem
        for domain, counter in @domains
          if domain.displayName == other.displayName
            problems = @problems[counter]
            for arg in problem
              if (j = problems.indexOf(arg)) > -1
                problems.splice(j, 1)

        @setVariables(problem, engine)
        return true

  setVariables: (problem, engine, target = problem) ->
    for arg in problem
      if arg[0] == 'get'
        (target.variables ||= []).push(engine.getPath(arg[1], arg[2]))
      else if arg.variables
        (target.variables ||= []).push.apply(target.variables, arg.variables)


  optimize: ->
    for problems, i in @problems by -1
      unless problems.length
        @problems.splice i, 1
        @domains.splice i, 1
      for problem in problems
        problem.domain = @domains[i]

    for domain, i in @domains by -1
      problems = @problems[i]
      @setVariables(problems)
      if vars = problems.variables
        for other, j in @domains by -1
          break if j == i
          console.log(vars, @problems[j].variables)
          if (variables = @problems[j].variables) && domain.displayName == @domains[j].displayName
            for variable in variables
              if vars.indexOf(variable) > -1
                problems.push.apply(problems, @problems[j])
                @setVariables(@problems[j], null, problems)
                @problems.splice(j, 1)
                @domains.splice(j, 1)
                debugger
                break




      #if domain.MAYBE
      #  if (j = @domains.indexOf(domain.MAYBE)) > -1
      #    @problems[j].push.apply(@problems[j], @problems[index])
      #    @problems.splice(index, 1)
      #    @domains.splice(index, 1)
    @



  # Merge source workflow into target workflow
  merge: (workload, domain, index) ->
    if !domain
      for domain, index in workload.domains
        @merge workload, domain, index
      return @
    merged = undefined
    priority = @domains.length
    for other, position in @domains
      if other == domain
        cmds = @problems[position]
        cmds.push.apply(cmds, workload.problems[index])
        merged = true
        break
      else 
        if other.priority <= domain.priority
          priority = position
    if !merged
      @domains.splice(priority, 0, domain)
      @problems.splice(priority, 0, workload.problems[index])

    return @

  each: (callback, bind) ->
    @optimize()
    console.log("optimized", @)
    solution = undefined
    console.error(@problems[0].slice(), @problems[1]?.slice())
    for domain, index in @domains
      result = (@solutions ||= [])[index] = 
        callback.call(bind || @, domain, @problems[index], index)
      if result && !result.push
        for own prop, value of result
          (solution ||= {})[prop] = value

    return solution || result

module.exports = Workflow