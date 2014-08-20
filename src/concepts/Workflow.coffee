# Queue and group expressions by domain

Workflower = (engine) ->
  Workflow = (domain, problem) ->
    if @ instanceof Workflow
      @domains  = domain  && (domain.push && domain  || [domain] ) || []
      @problems = problem && (domain.push && problem || [problem]) || []
      return
    if arguments.length == 1
      problem = domain
      domain = undefined
      start = true
    for arg, index in problem
      continue unless arg?.push
      arg.parent ?= problem
      arg.index  ?= index
      offset = 0
      if arg[0] == 'get'
        vardomain = @getVariableDomain(arg)
        console.log(domain, arg, vardomain)
        if vardomain.MAYBE && domain && domain != true
          vardomain.frame = domain
        workload = new Workflow vardomain, [arg]
      else
        for a in arg
          if a?.push
            if arg[0] == 'framed'
              if typeof arg[1] == 'string'
                d = arg[1]
              else
                d = arg[0].uid ||= (@uids = (@uids ||= 0) + 1)
            else
              d = domain || true
            workload = @Workflow(d, arg)
            console.log('phramed', d, arg, workload)
            break

      if workflow && workflow != workload
        workflow.merge(workload)
      else
        workflow = workload
    if !workflow
      if typeof arg[0] == 'string'
        arg = [arg]
      foreign = true
      workflow = new @Workflow [domain != true && domain || null], [arg]
    if typeof problem[0] == 'string'
      workflow.wrap(problem, @)
    if start || foreign
      if @workflow
        if @workflow != workflow
          return @workflow.merge(workflow)
      else
        return workflow.each @resolve, @engine

    return workflow
  if @prototype
    for property, value of @prototype 
      Workflow::[property] = value
  Workflow::engine = engine if engine
  return Workflow

Workflow = Workflower()
Workflow.compile = Workflower
Workflow.prototype =
  substitute: (parent, operation, solution) ->
    if parent == operation
      return solution
    for child, index in parent
      if child.push
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
      root = solution.domain.getRootOperation(parent)
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
        p = parent
        while p
          if (i = problems.indexOf(p)) > -1
            @substitute(problems[i], operation, solution)
          p = p.parent
    return

  # Group expressions
  wrap: (problem) -> 
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
                  if !domain.MAYBE
                    if !other.MAYBE
                      if index < n
                        exps.push.apply(exps, domain.export())
                        exps.push.apply(exps, probs)
                        @domains.splice(n, 1)
                        @problems.splice(n, 1)
                        @engine.domains.splice @engine.domains.indexOf(domain), 1
                      else
                        probs.push.apply(probs, other.export())
                        probs.push.apply(probs, exps)
                        @domains.splice(index, 1)
                        @problems.splice(index, 1)
                        @engine.domains.splice @engine.domains.indexOf(other), 1
                        other = domain
                        i = j + 1
                        exps = @problems[n]
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

        # Force operation domain
        opdomain = @engine.getOperationDomain(problem, other)
        if opdomain && opdomain.displayName != other.displayName
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

          console.error(opdomain, '->', other, problem)
        else unless bubbled
          bubbled = true
          exps[i - 1] = problem


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
    console.log('unwrapping', problems, domain)
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
        if !arg.domain || arg.domain.MAYBE || arg.domain.displayName == domain.displayName
          (variables ||= []).push(@engine.getPath(arg[1], arg[2]))
      else if arg.variables
        (variables ||= []).push.apply(variables, arg.variables)
    target.variables = variables

  # Last minute changes to workflow before execution
  optimize: ->
    console.log(JSON.stringify(@problems))
    @compact()

    if @connect()
      @compact()

    @defer()

    console.log(JSON.stringify(@problems))

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
                @problems[i].splice(p, 1)
                console.error('!!!!!!!!!!!!!!!!', probs)
                @engine.Workflow(@unwrap(probs, @domains[j], [], @problems[j]))
                break
              prob = prob.parent
    return


  # Merge connected graphs 
  connect: ->
    connected = undefined
    for domain, i in @domains by -1
      if i == @index
        debugger
      break if i == @index
      problems = @problems[i]
      @setVariables(problems, null, domain)
      if vars = problems.variables
        for other, j in @domains by -1
          break if j == i
          if (variables = @problems[j].variables) && domain.displayName == @domains[j].displayName
            for variable in variables
              if vars.indexOf(variable) > -1
                if domain.frame == other.frame
                  problems.push.apply(problems, @problems[j])
                  @setVariables(@problems[j], null, domain)
                  @problems.splice(j, 1)
                  @domains.splice(j, 1)
                  if @index >= j
                    --@index
                  connected = true
                  break
                else
                  framed = domain.frame && domain || other
                  console.log(variable, 'framed')
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



  # Merge source workflow into target workflow
  merge: (problems, domain) ->
    if domain == undefined
      for domain, index in problems.domains
        @merge problems.problems[index], domain
      return @
    merged = undefined
    priority = @domains.length
    position = @index + 1
    while (other = @domains[position]) != undefined
      if other
        if other == domain
          cmds = @problems[position]
          for problem in problems
            exported = undefined
            if problem.exported
              for cmd in cmds
                if cmd.exported && cmd.parent.domain == problem.parent.domain
                  exported = true
                  break
            unless exported
              cmds.push problem
          merged = true
          break
        else 
          if (other.priority < domain.priority) && (!other.frame || other.frame == domain.frame)
            priority = position
      position++
    if !merged
      @domains.splice(priority, 0, domain)
      @problems.splice(priority, 0, problems)

    return @

  each: (callback, bind, solution = @solution) ->
    return solution unless @problems[@index + 1]
    @optimize()
    console.log("Workflow", @)
    while (domain = @domains[++@index]) != undefined
      result = (@solutions ||= [])[@index] = 
        callback.call(bind || @, domain, @problems[@index], @index, @)
      if result && !result.push
        for own prop, value of result
          (solution ||= {})[prop] = value
    @index--

    return @solution = (solution || result)

  getProblems: (callback, bind) ->
    return GSS.clone @problems

  index: -1


module.exports = Workflow