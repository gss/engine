var Workflow;

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
      this.assumed.watch(arg[1], arg[2], arg, arg[3]);
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
  workflow.bubble(problem, this);
  if (start && !domain) {
    if (this.workflow) {
      return this.workflow.merge(workflow);
    } else {
      return workflow.each(this.resolve, this.engine);
    }
  }
  if (!domain) {
    console.log('Workflow', workflow);
  }
  return workflow;
};

Workflow.prototype = {
  provide: function(solution) {
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
    debugger;
    var arg, counter, domain, exp, exps, i, index, j, k, l, n, next, opdomain, other, previous, problems, strong, updated, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2;
    _ref = this.domains;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      other = _ref[index];
      updated = void 0;
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
            for (n = _j = 0, _len1 = _ref1.length; _j < _len1; n = ++_j) {
              domain = _ref1[n];
              if (domain !== other) {
                if ((j = this.problems[n].indexOf(previous)) > -1) {
                  if (domain.priority < 0 && domain.priority > other.priority) {
                    i = j + 1;
                    exps = this.problems[n];
                    other = domain;
                  }
                  break;
                }
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
          for (_k = 0, _len2 = exp.length; _k < _len2; _k++) {
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
        } else {
          exps[i - 1] = problem;
        }
        _ref2 = this.domains;
        for (counter = _l = 0, _len3 = _ref2.length; _l < _len3; counter = ++_l) {
          domain = _ref2[counter];
          if (domain.displayName === other.displayName) {
            problems = this.problems[counter];
            for (_m = 0, _len4 = problem.length; _m < _len4; _m++) {
              arg = problem[_m];
              if ((j = problems.indexOf(arg)) > -1) {
                problems.splice(j, 1);
              }
            }
          }
        }
        return true;
      }
    }
  },
  optimize: function() {
    var domain, index, j, problems, _i, _ref, _results;
    _ref = this.domains;
    _results = [];
    for (index = _i = _ref.length - 1; _i >= 0; index = _i += -1) {
      domain = _ref[index];
      problems = this.problems[index];
      if (problems.length === 0) {
        this.problems.splice(index, 1);
        this.domains.splice(index, 1);
      }
      if (domain.MAYBE) {
        if ((j = this.domains.indexOf(domain.MAYBE)) > -1) {
          this.problems[j].push.apply(this.problems[j], this.problems[index]);
          this.problems.splice(index, 1);
          _results.push(this.domains.splice(index, 1));
        } else {
          _results.push(void 0);
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  },
  merge: function(workload, domain, index, updated) {
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
        if (updated) {
          this.problems[position] = workload.problems[index];
        } else {
          cmds = this.problems[position];
          cmds.push.apply(cmds, workload.problems[index]);
        }
        merged = true;
        break;
      } else {
        if (other.priority <= domain.priority) {
          priority = position;
        }
        if (isFinite(other.priority) && isFinite(domain.priority)) {
          if (other.priority >= domain.priority) {
            if (merged = domain.merge(other)) {
              this.problems[index].push.apply(this.problems[index], workload.problems[position]);
            }
          } else {
            if (merged = other.merge(domain)) {
              this.problems[position].push.apply(this.problems[position], workload.problems[index]);
            }
          }
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
    var domain, index, result, _i, _len, _ref;
    this.optimize();
    _ref = this.domains;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      domain = _ref[index];
      result = callback.call(bind || this, domain, this.problems[index], index);
    }
    return result;
  }
};

module.exports = Workflow;
