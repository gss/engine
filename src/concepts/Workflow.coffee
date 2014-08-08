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
      @assumed.watch(arg[1], arg[2], arg, arg[3])
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

  workflow.bubble(problem, @)

  if start && !domain
    if @workflow
      return @workflow.merge(workflow)
    else
      return workflow.each @resolve, @engine

  if !domain
    console.log('Workflow', workflow)
  return workflow

Workflow.prototype =
  provide: (solution) ->
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
    debugger
    for other, index in @domains
      updated = undefined
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
            for domain, n in @domains
              if domain != other
                if (j = @problems[n].indexOf(previous)) > -1
                  if domain.priority < 0 && domain.priority > other.priority
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
        else
          exps[i - 1] = problem
        for domain, counter in @domains
          if domain.displayName == other.displayName
            problems = @problems[counter]
            for arg in problem
              if (j = problems.indexOf(arg)) > -1
                problems.splice(j, 1)

        return true

  optimize: ->
    for domain, index in @domains by -1
      problems = @problems[index]
      if problems.length == 0
        @problems.splice(index, 1)
        @domains.splice(index, 1)
      if domain.MAYBE
        if (j = @domains.indexOf(domain.MAYBE)) > -1
          @problems[j].push.apply(@problems[j], @problems[index])
          @problems.splice(index, 1)
          @domains.splice(index, 1)



  # Merge source workflow into target workflow
  merge: (workload, domain, index, updated) ->
    if !domain
      for domain, index in workload.domains
        @merge workload, domain, index
      return @
    merged = undefined
    priority = @domains.length
    for other, position in @domains
      if other == domain
        if updated
          @problems[position] = workload.problems[index]
        else
          cmds = @problems[position]
          cmds.push.apply(cmds, workload.problems[index])
        merged = true
        break
      else 
        if other.priority <= domain.priority
          priority = position

        if isFinite(other.priority) && isFinite(domain.priority)
          if other.priority >= domain.priority
            if merged = domain.merge other
              @problems[index].push.apply(@problems[index], workload.problems[position])
          else
            if merged = other.merge domain
              @problems[position].push.apply(@problems[position], workload.problems[index])
    if !merged
      @domains.splice(priority, 0, domain)
      @problems.splice(priority, 0, workload.problems[index])

    return @

  each: (callback, bind) ->
    @optimize()
    for domain, index in @domains
      result = callback.call(bind || @, domain, @problems[index], index)
    return result

module.exports = Workflow