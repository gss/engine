# Schedule, group, sort expressions by domain, graph and worker
# Then evaluate it asynchronously, in order. Re-evaluate side-effects.

Updater = (engine) ->
  Update = (domain, problem, parent) ->
    # Handle constructor invocation (e.g. new engine.update)
    if @ instanceof Update
      @domains  = domain  && (domain.push && domain  || [domain] ) || []
      @problems = problem && (domain.push && problem || [problem]) || []
      return

    # Handle invokation without specified domain (e.g. engine.update [...])
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
        vardomain = @Variable.getDomain(arg)
        path = arg.property = @Variable.getPath(arg[1], arg[2])
        if vardomain.MAYBE && domain && domain != true
          vardomain.frame = domain
        effects = new Update vardomain, [arg]

        # Convert fast-lane constraint into regular constraint
        if typeof (bypasser = @variables[path]) == 'string'
          bypassers = @engine.bypassers
          property = bypassers[bypasser]
          i = 0
          while op = property[i]
            if op.variables[path]
              effects.push [op], [vardomain], true
              property.splice(i, 1)
            else 
              i++

          if Object.keys(property).length == 0
            delete bypassers[bypasser]
          delete @variables[path]
      else
        # Handle framed expressions
        stringy = true
        for a in arg
          if a?.push
            if arg[0] == 'framed'
              if typeof arg[1] == 'string'
                d = arg[1]
              else
                d = arg[0].uid ||= (@uids = (@uids ||= 0) + 1)
            else
              d = domain || true
            effects = @update(d, arg, parent)
            break
          else if typeof a != 'string'
            stringy = false
        if !effects && typeof arg?[0] == 'string' && stringy
          effects = new @update([null], [arg], parent)

      # Merge updates
      if effects
        if update && update != effects
          update.push(effects)
        else
          update = effects
          parent ||= update
      effects = undefined

    # Handle broadcasted commands (e.g. remove)
    if !update
      if typeof problem[0] == 'string'
        problem = [problem]
      foreign = true
      update = new @update [domain != true && domain || null], [problem]

    # Replace arguments updates with parent function update
    if typeof problem[0] == 'string'
      index = update.wrap(problem, parent)

      if index?
        update.connect(index)
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
        root = solution.domain.Operation.ascend(parent)
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



  merge: (from, to, parent) ->
    domain = @domains[from]
    return if domain.frame
    other = @domains[to]
    probs = @problems[from]

    # Apply removes from parent update
    if parent
      globals = parent.domains.indexOf(null, parent.index + 1)
      if !domain.MAYBE
        if globals > -1# && globals < from
          globs = parent.problems[globals]
          if typeof globs[0] == 'string'
            if globs[0] == 'remove'
              domain.remove.apply(domain, globs.slice(1))
          else
            for glob in globs
              if glob[0] == 'remove'
                domain.remove.apply(domain, glob.slice(1))
            
    # Apply removes from global update
    if @engine.updating
      globals = @engine.updating.domains.indexOf(null, @engine.updating.index + 1)
      if !domain.MAYBE
        if globals > -1# && globals < from
          globs = @engine.updating.problems[globals]
          if typeof globs[0] == 'string'
            if globs[0] == 'remove'
              domain.remove.apply(domain, globs.slice(1))
          else
            for glob in globs
              if glob[0] == 'remove'
                domain.remove.apply(domain, glob.slice(1))

    # Apply removes scheduled for exported domain
    while prob = probs[i++]
      if prob[0] == 'remove'
        domain.remove.apply(domain, prob.slice(1))
        probs.splice(i, 1)
      else
        i++

    result = @problems[to]
    @setVariables(result, probs, other)
    exported = domain.export()
    result.push.apply(result, exported)
    @setVariables(result, exported, other)
    for prob in probs
      if result.indexOf(prob) == -1
        result.push(prob)
      if prob.domain == domain
        prob.domain = other
    if domain.nullified
      solution = {}
      for prop of domain.nullified
        (solution ||= {})[prop] = null
      @engine.updating.apply solution 
    @domains.splice(from, 1)
    @problems.splice(from, 1)
    for constraint in domain.constraints by -1
      domain.unconstrain(constraint, undefined, true)
    if (i = @engine.domains.indexOf(domain)) > -1
      @engine.domains.splice i, 1
    if @engine.domains.indexOf(other) == -1
      @engine.domains.push(other)
    return true

  # Group expressions
  wrap: (problem, parent) -> 
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
                      if @merge n, index, parent
                        1#probs.splice(j, 1)
                    else
                      unless @merge index, n, parent
                        exps.splice(--i, 1)

                      other = domain
                      i = j + 1
                      exps = @problems[n]

                    break
                  else if !other.MAYBE
                    @merge n, index
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
          opdomain = @engine.Operation.getDomain(problem, other)
        if opdomain && (opdomain.displayName != other.displayName)
          if (index = @domains.indexOf(opdomain, @index + 1)) == -1
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
            bubbled = exps
            if exps.indexOf(problem) == -1
              exps[i - 1] = problem
            else 
              exps.splice(--i, 1)
            problem.domain = other

        if other
          for domain, counter in @domains by -1
            if domain && (domain != other || bubbled)
              if (other.MAYBE && domain.MAYBE) || domain.displayName == other.displayName
                problems = @problems[counter]
                for arg in problem
                  if (j = problems.indexOf(arg)) > -1
                    problems.splice(j, 1)
                    if problems.length == 0
                      @problems.splice(counter, 1)
                      @domains.splice(counter, 1)

        if bubbled
          for arg in problem
            if arg.push
              if arg[0] == 'get'
                if !arg.domain || arg.domain.displayName == other.displayName
                  @setVariable(problem, arg.property, arg)
                  @setVariable(exp, arg.property, arg)

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
        if !operation.domain || operation.domain.displayName == other.displayName
          operation.domain = other
          variables[property] = operation
    return

  # Simplify groupped multi-domain expression down to variables
  unwrap: (problems, domain, result = []) ->
    if problems[0] == 'get' 
      problems.exported = true
      problems.parent = undefined
      result.push(problems)
      path = @engine.Variable.getPath(problems[1], problems[2])
      exports = (@exports ||= {})[path] ||= []
      exports.push domain
      imports = (@imports ||= [])
      index = imports.indexOf(domain)
      if index == -1
        index = imports.push(domain) - 1
      imports.splice(index + 1, 0, path)
    else
      problems.domain = domain
      for problem in problems
        if problem.push
          @unwrap(problem, domain, result)
    return result



  finish: ->
    @time = @engine.time(@start)
    @start = undefined

  # Last minute changes to queue before execution
  optimize: ->
    @defer()

    @

  # change all maybe-domains to this domain
  reify: (operation, domain) ->
    if !operation
      for domain, i in @domains by -1
        break if i == @index
        if domain
          @reify @problems[i], domain
    else
      if operation.domain?.MAYBE
        operation.domain = domain
      if operation?.push
        for arg in operation
          if arg?.push
            @reify arg, domain
    return

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

  connect: (position) ->
    index = @index
    domain = @domains[position]
    return unless domain
    problems = @problems[position]
    
    while (other = @domains[++index]) != undefined
      continue if position == index
    
      `connector: {`
      if other?.displayName == domain.displayName
        if variables = @problems[index].variables
          for property of problems.variables
            if variable = variables[property]
              if variable.domain?.displayName == domain.displayName
                if domain.frame == other.frame
                  if other.constraints?.length > domain.constraints?.length || position > index
                    @merge position, index
                    position = index
                  else
                    @merge index, position
                  if index < position
                    position--
                  else
                    index--
                  `break connector;`
                else
                  framed = domain.frame && domain || other
    `}`
    return


  # Merge source update into target update
  push: (problems, domain, reverse) ->
    if domain == undefined
      for domain, index in problems.domains
        @push problems.problems[index], domain
      return @
    priority = @domains.length
    position = @index + 1
    while (other = @domains[position]) != undefined
      if other || !domain
        if other == domain || (domain && !domain?.solve && other.url == domain.url)
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
                if reverse || (domain && !domain.solve && other.url == domain.url && problem[0] == 'remove')
                  cmds.unshift problem
                else
                  cmds.push problem
                @setVariables(cmds, problem, other)
                @reify(problem, other)

          @connect(position)

          return true

        else if other && domain
          if ((other.priority < domain.priority) || 
              (other.priority == domain.priority && other.MAYBE && !domain.MAYBE)) && 
              (!other.frame || other.frame == domain.frame)
            if priority == @domains.length
              priority = position
        else if !domain
          priority--
      position++

    @domains.splice(priority, 0, domain)
    @problems.splice(priority, 0, problems)
    for problem in problems
      @setVariables(problems, problem, domain)
    @reify(problems, domain)
    @connect(priority)
    return @


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
      for url, message of @posted
        @engine.workers[url].postMessage(message)
        while (i = @busy.indexOf(url)) > -1 && @busy.lastIndexOf(url) != i
          @busy.splice(i, 1)
      @posted = undefined

  each: (callback, bind, solution) ->
    if solution
      @apply(solution) 

    return unless @problems[@index + 1]

     
    @optimize()
    previous = @domains[@index]
    while (domain = @domains[++@index]) != undefined
      #if ((!previous || previous.priority < 0) && domain?.priority > 0)
      #  @reset()
      previous = domain

      @reify(@problems[@index], domain)

      result = (@solutions ||= [])[@index] = 
        callback.call(bind || @, domain, @problems[@index], @index, @)

      if @effects
        @apply(@effects, (result = @solutions[@index] ||= {}))
        @effects = undefined

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

  apply: (result, solution = @solution) ->
    if result != @solution
      solution ||= @solution = {}
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
    return

  getProblems: (callback, bind) ->
    return GSS.clone @problems

  index: -1


module.exports = Update