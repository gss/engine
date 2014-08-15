var Workflow,
  __hasProp = {}.hasOwnProperty;

Workflow = function(domain, problem, frame) {
  var a, arg, d, foreign, index, offset, start, vardomain, workflow, workload, _base, _i, _j, _len, _len1;
  if (this instanceof Workflow) {
    this.domains = domain && (domain.push && domain || [domain]) || [];
    this.problems = problem && (domain.push && problem || [problem]) || [];
    this.frame = frame;
    return;
  }
  if (arguments.length === 1) {
    problem = domain;
    domain = void 0;
    start = true;
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
      vardomain = this.getVariableDomain(arg);
      if (vardomain.MAYBE && domain && domain !== true) {
        vardomain.frame = domain;
      }
      workload = new Workflow(vardomain, [arg]);
    } else {
      for (_j = 0, _len1 = arg.length; _j < _len1; _j++) {
        a = arg[_j];
        if (a != null ? a.push : void 0) {
          if (arg[0] === 'framed') {
            if (typeof arg[1] === 'string') {
              d = arg[1];
            } else {
              d = (_base = arg[0]).uid || (_base.uid = (this.uids = (this.uids || (this.uids = 0)) + 1));
            }
          } else {
            d = domain || true;
          }
          workload = this.Workflow(d, arg);
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
  if (!workflow) {
    if (typeof arg[0] === 'string') {
      arg = [arg];
    }
    foreign = true;
    d = workflow = new this.Workflow([domain !== true && domain || null], [arg]);
  }
  if (typeof problem[0] === 'string') {
    workflow.wrap(problem, this);
  }
  if (start || foreign) {
    if (this.workflow) {
      console.info(JSON.stringify(problem));
      return this.workflow.merge(workflow);
    } else {
      return workflow.each(this.resolve, this.engine);
    }
  }
  return workflow;
};

Workflow.prototype = {
  provide: function(solution) {
    var domain, index, operation, problems;
    if (solution.operation.exported) {
      return;
    }
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
  wrap: function(problem, engine) {
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
                  if (!domain.MAYBE) {
                    if (!other.MAYBE) {
                      debugger;
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
  unwrap: function(problems, domain, result) {
    var problem, _i, _len;
    if (result == null) {
      result = [];
    }
    if (problems[0] === 'get') {
      problems.exported = true;
      result.push(problems);
    } else {
      problems.domain = domain;
      for (_i = 0, _len = problems.length; _i < _len; _i++) {
        problem = problems[_i];
        if (problem.push) {
          this.unwrap(problem, domain, result);
        }
      }
    }
    return result;
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
    var domain, i, j, other, p, prob, problem, problems, url, variable, variables, vars, _i, _j, _k, _l, _len, _len1, _m, _n, _o, _p, _q, _r, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
    console.log(JSON.stringify(this.problems));
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
          if ((variables = this.problems[j].variables) && domain.displayName === this.domains[j].displayName) {
            if (domain.frame === other.frame) {
              for (_m = 0, _len1 = variables.length; _m < _len1; _m++) {
                variable = variables[_m];
                if (vars.indexOf(variable) > -1) {
                  problems.push.apply(problems, this.problems[j]);
                  this.setVariables(this.problems[j], null, problems);
                  this.problems.splice(j, 1);
                  this.domains.splice(j, 1);
                  break;
                }
              }
            }
          }
        }
      }
    }
    _ref3 = this.domains;
    for (i = _n = _ref3.length - 1; _n >= 0; i = _n += -1) {
      domain = _ref3[i];
      for (j = _o = _ref4 = i + 1, _ref5 = this.domains.length; _ref4 <= _ref5 ? _o < _ref5 : _o > _ref5; j = _ref4 <= _ref5 ? ++_o : --_o) {
        if ((url = (_ref6 = this.domains[j]) != null ? _ref6.url : void 0) && (typeof document !== "undefined" && document !== null)) {
          _ref7 = this.problems[i];
          for (p = _p = _ref7.length - 1; _p >= 0; p = _p += -1) {
            prob = _ref7[p];
            while (prob) {
              problem = this.problems[j];
              if (problem.indexOf(prob) > -1) {
                this.problems[i][p] = this.unwrap(this.problems[i][p], this.domains[j], [], this.problems[j]);
                break;
              }
              prob = prob.parent;
            }
          }
        }
      }
    }
    _ref8 = this.problems;
    for (i = _q = _ref8.length - 1; _q >= 0; i = _q += -1) {
      problems = _ref8[i];
      if (!problems.length) {
        this.problems.splice(i, 1);
        this.domains.splice(i, 1);
      }
      for (_r = problems.length - 1; _r >= 0; _r += -1) {
        problem = problems[_r];
        domain = this.domains[i];
        problem.domain = domain;
      }
    }
    return this;
  },
  merge: function(problems, domain) {
    var cmds, index, merged, other, position, priority, _i, _len, _ref;
    if (domain === void 0) {
      _ref = problems.domains;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        domain = _ref[index];
        this.merge(problems.problems[index], domain);
      }
      return this;
    }
    merged = void 0;
    priority = this.domains.length;
    position = (this.index || -1) + 1;
    while ((other = this.domains[position]) !== void 0) {
      if (other) {
        if (other === domain) {
          cmds = this.problems[position];
          cmds.push.apply(cmds, problems);
          merged = true;
          break;
        } else {
          if (other.priority <= domain.priority && (!other.frame || other.frame === domain.frame)) {
            priority = position;
          }
        }
      }
      position++;
    }
    if (!merged) {
      this.domains.splice(priority, 0, domain);
      this.problems.splice(priority, 0, problems);
    }
    return this;
  },
  each: function(callback, bind) {
    var domain, prop, result, solution, value;
    this.optimize();
    solution = void 0;
    if (this.index == null) {
      this.index = 0;
    }
    while ((domain = this.domains[this.index]) !== void 0) {
      result = (this.solutions || (this.solutions = []))[this.index] = callback.call(bind || this, domain, this.problems[this.index], this.index, this);
      if (result && !result.push) {
        for (prop in result) {
          if (!__hasProp.call(result, prop)) continue;
          value = result[prop];
          (solution || (solution = {}))[prop] = value;
        }
      }
      this.index++;
    }
    return solution || result;
  }
};

module.exports = Workflow;
