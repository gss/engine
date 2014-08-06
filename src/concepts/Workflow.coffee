# Queue and group expressions by domain

Workflow = (problem, recursive) ->
  if @ instanceof Workflow
    @domains = problem || []
    @problems = recursive || []
    return


  workflow = old = @workflow
  for arg, index in problem
    continue unless arg?.push
    arg.parent ?= problem
    arg.index  ?= index
    offset = 0
    if arg[0] == 'get'
      subtree = [arg]
      workload = new Workflow [@getDomain(arg)], [[arg]]
    else
      workload = @Workflow arg, true

    for domain, index in workload.domains
      updated = undefined

      # Group expressions
      exps = workload.problems[index]
      i = 0
      while exp = exps[i++]
        # We've got sub-exp in domain
        if (j = problem.indexOf(exp)) > -1
          # Replace last variable with parent expression (bubble up)
          k = l = j
          while (next = problem[++k]) != undefined
            if next && next.push
              break
          continue if next
          while (previous = problem[--l]) != undefined
            if previous && previous.push && exps.indexOf(previous) == -1
              for d, n in workload.domains
                if d != domain
                  if (j = workload.problems[n].indexOf(previous)) > -1
                    if d.priority > domain.priority
                      i = j + 1
                      exps = workload.problems[n]
                      domain = d
                    break
              break

          #console.log('grouping', problem, exp, problem == exp)
          if !updated
            exps[i - 1] = problem
            updated = domain
          else
            exps.splice(--i, 1)
          if d == domain
            break


      if workflow && workflow != workload
        workflow.merge(workload, domain, index, updated)
      else
        workflow = workload

  if !workflow && recursive
    return new Workflow [@engine.intrinsic], [problem]

  if !old && !recursive
    return workflow.each @resolve, @engine
  if !recursive
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
        if other.priority >= domain.priority
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
    for domain, index in @domains
      result = callback.call(bind || @, domain, @problems[index], index)
    return result

module.exports = Workflow