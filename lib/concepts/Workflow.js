var Workflow;

Workflow = function(problem, recursive) {
  var arg, d, domain, exp, exps, i, index, j, k, l, n, next, offset, old, previous, subtree, updated, workflow, workload, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
  if (this instanceof Workflow) {
    this.domains = problem || [];
    this.problems = recursive || [];
    return;
  }
  workflow = old = this.workflow;
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
      subtree = [arg];
      workload = new Workflow([this.getDomain(arg)], [[arg]]);
    } else {
      workload = this.Workflow(arg, true);
    }
    _ref = workload.domains;
    for (index = _j = 0, _len1 = _ref.length; _j < _len1; index = ++_j) {
      domain = _ref[index];
      updated = void 0;
      exps = workload.problems[index];
      i = 0;
      while (exp = exps[i++]) {
        if ((j = problem.indexOf(exp)) > -1) {
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
              _ref1 = workload.domains;
              for (n = _k = 0, _len2 = _ref1.length; _k < _len2; n = ++_k) {
                d = _ref1[n];
                if (d !== domain) {
                  if ((j = workload.problems[n].indexOf(previous)) > -1) {
                    if (d.priority > domain.priority) {
                      i = j + 1;
                      exps = workload.problems[n];
                      domain = d;
                    }
                    break;
                  }
                }
              }
              break;
            }
          }
          if (!updated) {
            exps[i - 1] = problem;
            updated = domain;
          } else {
            exps.splice(--i, 1);
          }
          if (d === domain) {
            break;
          }
        }
      }
      if (workflow && workflow !== workload) {
        workflow.merge(workload, domain, index, updated);
      } else {
        workflow = workload;
      }
    }
  }
  if (!workflow && recursive) {
    return new Workflow([this.engine.intrinsic], [problem]);
  }
  if (!old && !recursive) {
    return workflow.each(this.resolve, this.engine);
  }
  if (!recursive) {
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
        if (other.priority >= domain.priority) {
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
    _ref = this.domains;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      domain = _ref[index];
      result = callback.call(bind || this, domain, this.problems[index], index);
    }
    return result;
  }
};

module.exports = Workflow;
