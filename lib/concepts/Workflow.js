var Workflow,
  __hasProp = {}.hasOwnProperty;

Workflow = function(domain, problem) {
  var a, arg, index, offset, start, workflow, workload, _i, _j, _len, _len1;
  if (this instanceof Workflow) {
    this.domains = domain && (domain.push && domain || [domain]) || [];
    this.problems = problem && (domain.push && problem || [problem]) || [];
    return;
  }
  if (arguments.length === 1) {
    problem = domain;
    domain = void 0;
    start = true;
  }
  if (domain && domain !== true) {
    domain = true;
  }
  for (index = _i = 0, _len = problem.length; _i < _len; index = ++_i) {
    arg = problem[index];
    if (!(arg != null ? arg.push : void 0)) {
      continue;
    }
    if (arg.parent == null) {
      arg.parent = problem;
    }
    if (arg.index == null) {
      arg.index = index;
    }
    offset = 0;
    if (arg[0] === 'get') {
      this.assumed.watch(arg[1], arg[2], arg, arg[3] || '');
      workload = new Workflow(this.getVariableDomain(arg), [arg]);
    } else {
      for (_j = 0, _len1 = arg.length; _j < _len1; _j++) {
        a = arg[_j];
        if (a.push) {
          workload = this.Workflow(true, arg);
          break;
        }
      }
    }
    if (workflow && workflow !== workload) {
      workflow.merge(workload);
    } else {
      workflow = workload;
    }
  }
  if (problem[0] === '==') {
    debugger;
  }
  if (typeof problem[0] === 'string') {
    workflow.bubble(problem, this);
  }
  if (start && !domain) {
    if (arguments.length === 1) {
      console.log('Workflow', workflow);
    }
    if (this.workflow) {
      return this.workflow.merge(workflow);
    } else {
      return workflow.each(this.resolve, this.engine);
    }
  }
  return workflow;
};

Workflow.prototype = {
  provide: function(solution) {
    debugger;
    var domain, index, operation, problems;
    operation = solution.domain.getRootOperation(solution.operation.parent);
    domain = operation.domain;
    index = this.domains.indexOf(domain);
    if (index === -1) {
      index += this.domains.push(domain);
    }
    if (problems = this.problems[index]) {
      if (problems.indexOf(operation) === -1) {
        problems.push(operation);
      }
    } else {
      this.problems[index] = [operation];
    }
  },
  bubble: function(problem, engine) {
    var arg, bubbled, counter, domain, exp, exps, i, index, j, k, l, n, next, opdomain, other, previous, problems, probs, strong, _i, _j, _k, _l, _len, _len1, _len2, _m, _ref, _ref1, _ref2;
    bubbled = void 0;
    _ref = this.domains;
    for (index = _i = _ref.length - 1; _i >= 0; index = _i += -1) {
      other = _ref[index];
      exps = this.problems[index];
      i = 0;
      while (exp = exps[i++]) {
        if (!((j = problem.indexOf(exp)) > -1)) {
          continue;
        }
        k = l = j;
        while ((next = problem[++k]) !== void 0) {
          if (next && next.push) {
            break;
          }
        }
        if (next) {
          continue;
        }
        while ((previous = problem[--l]) !== void 0) {
          if (previous && previous.push && exps.indexOf(previous) === -1) {
            _ref1 = this.domains;
            for (n = _j = _ref1.length - 1; _j >= 0; n = _j += -1) {
              domain = _ref1[n];
              if (n === index) {
                continue;
              }
              probs = this.problems[n];
              if ((j = probs.indexOf(previous)) > -1) {
                if (domain !== other && domain.priority < 0 && other.priority < 0) {
                  debugger;
                  if (!domain.MAYBE) {
                    if (!other.MAYBE) {
                      if (index < n) {
                        exps.push.apply(exps, domain["export"]());
                        exps.push.apply(exps, probs);
                        this.domains.splice(n, 1);
                        this.problems.splice(n, 1);
                        engine.domains.splice(engine.domains.indexOf(domain), 1);
                      } else {
                        probs.push.apply(probs, other["export"]());
                        probs.push.apply(probs, exps);
                        this.domains.splice(index, 1);
                        this.problems.splice(index, 1);
                        engine.domains.splice(engine.domains.indexOf(other), 1);
                        other = domain;
                      }
                    }
                    break;
                  } else if (!other.MAYBE) {
                    this.problems[i].push.apply(this.problems[i], this.problems[n]);
                    this.domains.splice(n, 1);
                    this.problems.splice(n, 1);
                    continue;
                  }
                }
                if (domain.priority < 0 && (domain.priority > other.priority || other.priority > 0)) {
                  i = j + 1;
                  exps = this.problems[n];
                  other = domain;
                }
                break;
              }
            }
            break;
          }
        }
        opdomain = engine.getOperationDomain(problem, other);
        if (opdomain && opdomain !== other) {
          if ((index = this.domains.indexOf(opdomain)) === -1) {
            index = this.domains.push(opdomain) - 1;
            this.problems[index] = [problem];
          } else {
            this.problems[index].push(problem);
          }
          strong = void 0;
          for (_k = 0, _len = exp.length; _k < _len; _k++) {
            arg = exp[_k];
            if (arg.domain && !arg.domain.MAYBE) {
              strong = true;
            }
          }
          if (!strong) {
            exps.splice(--i, 1);
          }
          other = opdomain;
          console.error(opdomain, '->', other, problem);
        } else if (!bubbled) {
          bubbled = true;
          exps[i - 1] = problem;
        }
        _ref2 = this.domains;
        for (counter = _l = 0, _len1 = _ref2.length; _l < _len1; counter = ++_l) {
          domain = _ref2[counter];
          if (domain.displayName === other.displayName) {
            problems = this.problems[counter];
            for (_m = 0, _len2 = problem.length; _m < _len2; _m++) {
              arg = problem[_m];
              if ((j = problems.indexOf(arg)) > -1) {
                problems.splice(j, 1);
              }
            }
          }
        }
        this.setVariables(problem, engine);
        return true;
      }
    }
  },
  setVariables: function(problem, engine, target) {
    var arg, _i, _len, _results;
    if (target == null) {
      target = problem;
    }
    _results = [];
    for (_i = 0, _len = problem.length; _i < _len; _i++) {
      arg = problem[_i];
      if (arg[0] === 'get') {
        _results.push((target.variables || (target.variables = [])).push(engine.getPath(arg[1], arg[2])));
      } else if (arg.variables) {
        _results.push((target.variables || (target.variables = [])).push.apply(target.variables, arg.variables));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  },
  optimize: function() {
    var domain, i, j, other, problem, problems, variable, variables, vars, _i, _j, _k, _l, _len, _len1, _m, _ref, _ref1, _ref2;
    _ref = this.problems;
    for (i = _i = _ref.length - 1; _i >= 0; i = _i += -1) {
      problems = _ref[i];
      if (!problems.length) {
        this.problems.splice(i, 1);
        this.domains.splice(i, 1);
      }
      for (_j = 0, _len = problems.length; _j < _len; _j++) {
        problem = problems[_j];
        problem.domain = this.domains[i];
      }
    }
    _ref1 = this.domains;
    for (i = _k = _ref1.length - 1; _k >= 0; i = _k += -1) {
      domain = _ref1[i];
      problems = this.problems[i];
      this.setVariables(problems);
      if (vars = problems.variables) {
        _ref2 = this.domains;
        for (j = _l = _ref2.length - 1; _l >= 0; j = _l += -1) {
          other = _ref2[j];
          if (j === i) {
            break;
          }
          console.log(vars, this.problems[j].variables);
          if ((variables = this.problems[j].variables) && domain.displayName === this.domains[j].displayName) {
            for (_m = 0, _len1 = variables.length; _m < _len1; _m++) {
              variable = variables[_m];
              if (vars.indexOf(variable) > -1) {
                problems.push.apply(problems, this.problems[j]);
                this.setVariables(this.problems[j], null, problems);
                this.problems.splice(j, 1);
                this.domains.splice(j, 1);
                debugger;
                break;
              }
            }
          }
        }
      }
    }
    return this;
  },
  merge: function(workload, domain, index) {
    var cmds, merged, other, position, priority, _i, _j, _len, _len1, _ref, _ref1;
    if (!domain) {
      _ref = workload.domains;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        domain = _ref[index];
        this.merge(workload, domain, index);
      }
      return this;
    }
    merged = void 0;
    priority = this.domains.length;
    _ref1 = this.domains;
    for (position = _j = 0, _len1 = _ref1.length; _j < _len1; position = ++_j) {
      other = _ref1[position];
      if (other === domain) {
        cmds = this.problems[position];
        cmds.push.apply(cmds, workload.problems[index]);
        merged = true;
        break;
      } else {
        if (other.priority <= domain.priority) {
          priority = position;
        }
      }
    }
    if (!merged) {
      this.domains.splice(priority, 0, domain);
      this.problems.splice(priority, 0, workload.problems[index]);
    }
    return this;
  },
  each: function(callback, bind) {
    var domain, index, prop, result, solution, value, _i, _len, _ref, _ref1;
    this.optimize();
    console.log("optimized", this);
    solution = void 0;
    console.error(this.problems[0].slice(), (_ref = this.problems[1]) != null ? _ref.slice() : void 0);
    _ref1 = this.domains;
    for (index = _i = 0, _len = _ref1.length; _i < _len; index = ++_i) {
      domain = _ref1[index];
      result = (this.solutions || (this.solutions = []))[index] = callback.call(bind || this, domain, this.problems[index], index);
      if (result && !result.push) {
        for (prop in result) {
          if (!__hasProp.call(result, prop)) continue;
          value = result[prop];
          (solution || (solution = {}))[prop] = value;
        }
      }
    }
    return solution || result;
  }
};

module.exports = Workflow;
