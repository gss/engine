var Update, Updater;

Updater = function(engine) {
  var Update, property, value, _ref;
  Update = function(domain, problem) {
    var a, arg, d, foreign, index, offset, start, vardomain, workflow, workload, _base, _i, _j, _len, _len1;
    if (this instanceof Update) {
      this.domains = domain && (domain.push && domain || [domain]) || [];
      this.problems = problem && (domain.push && problem || [problem]) || [];
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
        workload = new Update(vardomain, [arg]);
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
            workload = this.update(d, arg);
            break;
          }
        }
      }
      if (workflow && workflow !== workload) {
        workflow.push(workload);
      } else {
        workflow = workload;
      }
    }
    if (!workflow) {
      if (typeof arg[0] === 'string') {
        arg = [arg];
      }
      foreign = true;
      workflow = new this.update([domain !== true && domain || null], [arg]);
    }
    if (typeof problem[0] === 'string') {
      workflow.wrap(problem, this);
      workflow.compact();
    }
    if (start || foreign) {
      if (this.updating) {
        if (this.updating !== workflow) {
          return this.updating.push(workflow);
        }
      } else {
        return workflow.each(this.resolve, this.engine);
      }
    }
    return workflow;
  };
  if (this.prototype) {
    _ref = this.prototype;
    for (property in _ref) {
      value = _ref[property];
      Update.prototype[property] = value;
    }
  }
  if (engine) {
    Update.prototype.engine = engine;
  }
  return Update;
};

Update = Updater();

Update.compile = Updater;

Update.prototype = {
  substitute: function(parent, operation, solution) {
    var child, index, _i, _len;
    if (parent === operation) {
      return solution;
    }
    for (index = _i = 0, _len = parent.length; _i < _len; index = ++_i) {
      child = parent[index];
      if (child != null ? child.push : void 0) {
        if (child === operation) {
          parent[index] = solution;
        } else {
          this.substitute(child, operation, solution);
        }
      }
    }
    return parent;
  },
  provide: function(solution) {
    var domain, i, index, operation, p, parent, problems, root, _i, _len, _ref, _ref1;
    if ((operation = solution.operation).exported) {
      return;
    }
    parent = operation.parent;
    if (domain = parent.domain) {
      if (((_ref = parent.parent) != null ? _ref.domain : void 0) === domain) {
        root = solution.domain.getRootOperation(parent);
      } else {
        root = parent;
      }
      index = this.domains.indexOf(domain, this.index + 1);
      if (index === -1) {
        index += this.domains.push(domain);
      }
      if (problems = this.problems[index]) {
        if (problems.indexOf(root) === -1) {
          problems.push(root);
        }
      } else {
        this.problems[index] = [root];
      }
    } else {
      _ref1 = this.problems;
      for (index = _i = 0, _len = _ref1.length; _i < _len; index = ++_i) {
        problems = _ref1[index];
        p = parent;
        while (p) {
          if ((i = problems.indexOf(p)) > -1) {
            this.substitute(problems[i], operation, solution);
          }
          p = p.parent;
        }
      }
    }
  },
  merge: function(from, to) {
    var constraint, domain, other, _i, _ref;
    domain = this.domains[from];
    if (domain.frame) {
      return;
    }
    other = this.domains[to];
    this.problems[to].push.apply(this.problems[to], domain["export"]());
    this.problems[to].push.apply(this.problems[to], this.problems[from]);
    this.domains.splice(from, 1);
    this.problems.splice(from, 1);
    _ref = domain.constraints;
    for (_i = _ref.length - 1; _i >= 0; _i += -1) {
      constraint = _ref[_i];
      domain.unconstrain(constraint);
    }
    this.engine.domains.splice(this.engine.domains.indexOf(domain), 1);
    return true;
  },
  wrap: function(problem) {
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
                        if (this.merge(n, index)) {
                          probs.splice(j, 1);
                        }
                      } else {
                        if (!this.merge(index, n)) {
                          exps.splice(--i, 1);
                        }
                        other = domain;
                        i = j + 1;
                        exps = this.problems[n];
                      }
                      break;
                    }
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
        if (other) {
          opdomain = this.engine.getOperationDomain(problem, other);
        }
        if (opdomain && (opdomain.displayName !== other.displayName)) {
          if ((index = this.domains.indexOf(opdomain)) === -1) {
            index = this.domains.push(opdomain) - 1;
            this.problems[index] = [problem];
          } else {
            this.problems[index].push(problem);
          }
          strong = exp.domain && !exp.domain.MAYBE;
          for (_k = 0, _len = exp.length; _k < _len; _k++) {
            arg = exp[_k];
            if (arg.domain && !arg.domain.MAYBE) {
              strong = true;
            }
          }
          if (!strong) {
            exps.splice(--i, 1);
          }
        } else if (!bubbled) {
          if (problem.indexOf(exps[i - 1]) > -1) {
            bubbled = true;
            exps[i - 1] = problem;
          }
        }
        if (other) {
          _ref2 = this.domains;
          for (counter = _l = 0, _len1 = _ref2.length; _l < _len1; counter = ++_l) {
            domain = _ref2[counter];
            if (domain !== other || bubbled) {
              if ((other.MAYBE && domain.MAYBE) || domain.displayName === other.displayName) {
                problems = this.problems[counter];
                for (_m = 0, _len2 = problem.length; _m < _len2; _m++) {
                  arg = problem[_m];
                  if ((j = problems.indexOf(arg)) > -1) {
                    problems.splice(j, 1);
                  }
                }
              }
            }
          }
          this.setVariables(problem, null, opdomain || other);
        }
        return true;
      }
    }
  },
  unwrap: function(problems, domain, result) {
    var exports, problem, _base, _i, _len, _name;
    if (result == null) {
      result = [];
    }
    if (problems[0] === 'get') {
      problems.exported = true;
      problems.parent = void 0;
      result.push(problems);
      exports = (_base = (this.exports || (this.exports = {})))[_name = this.engine.getPath(problems[1], problems[2])] || (_base[_name] = []);
      exports.push(domain);
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
  setVariables: function(problem, target, domain) {
    var arg, variables, _i, _len;
    if (target == null) {
      target = problem;
    }
    variables = void 0;
    for (_i = 0, _len = problem.length; _i < _len; _i++) {
      arg = problem[_i];
      if (arg[0] === 'get') {
        if (!arg.domain || arg.domain.MAYBE || (arg.domain.displayName === domain.displayName && domain.priority < 0)) {
          (variables || (variables = [])).push(this.engine.getPath(arg[1], arg[2]));
        }
      } else if (arg.variables) {
        (variables || (variables = [])).push.apply(variables, arg.variables);
      }
    }
    return target.variables = variables;
  },
  optimize: function() {
    this.compact();
    if (this.connect()) {
      this.compact();
    }
    this.defer();
    return this;
  },
  defer: function() {
    var domain, i, j, p, prob, problem, probs, url, _i, _j, _k, _ref, _ref1, _ref2, _ref3, _ref4;
    _ref = this.domains;
    for (i = _i = _ref.length - 1; _i >= 0; i = _i += -1) {
      domain = _ref[i];
      if (i === this.index) {
        break;
      }
      for (j = _j = _ref1 = i + 1, _ref2 = this.domains.length; _ref1 <= _ref2 ? _j < _ref2 : _j > _ref2; j = _ref1 <= _ref2 ? ++_j : --_j) {
        if ((url = (_ref3 = this.domains[j]) != null ? _ref3.url : void 0) && (typeof document !== "undefined" && document !== null)) {
          _ref4 = this.problems[i];
          for (p = _k = _ref4.length - 1; _k >= 0; p = _k += -1) {
            prob = _ref4[p];
            while (prob) {
              problem = this.problems[j];
              if (problem.indexOf(prob) > -1) {
                probs = this.problems[i][p];
                if (!probs.unwrapped) {
                  this.problems[i].splice(p--, 1);
                  probs.unwrapped = this.unwrap(probs, this.domains[j], [], this.problems[j]);
                  this.engine.update(probs.unwrapped);
                }
                break;
              }
              prob = prob.parent;
            }
          }
        }
      }
    }
  },
  connect: function() {
    var connected, domain, framed, i, j, other, problems, variable, variables, vars, _i, _j, _k, _len, _ref, _ref1;
    connected = void 0;
    _ref = this.domains;
    for (i = _i = _ref.length - 1; _i >= 0; i = _i += -1) {
      domain = _ref[i];
      if (i === this.index) {
        break;
      }
      problems = this.problems[i];
      this.setVariables(problems, null, domain);
      if (vars = problems.variables) {
        _ref1 = this.domains;
        for (j = _j = _ref1.length - 1; _j >= 0; j = _j += -1) {
          other = _ref1[j];
          if (j === i) {
            break;
          }
          if ((variables = this.problems[j].variables) && domain.displayName === this.domains[j].displayName) {
            for (_k = 0, _len = variables.length; _k < _len; _k++) {
              variable = variables[_k];
              if (vars.indexOf(variable) > -1) {
                if (domain.frame === other.frame) {
                  problems.push.apply(problems, this.problems[j]);
                  this.setVariables(this.problems[j], null, domain);
                  this.problems.splice(j, 1);
                  this.domains.splice(j, 1);
                  if (this.index >= j) {
                    --this.index;
                  }
                  connected = true;
                  break;
                } else {
                  framed = domain.frame && domain || other;
                }
              }
            }
          }
        }
      }
    }
    while (connected) {
      if (!this.connect()) {
        break;
      }
    }
    return connected;
  },
  compact: function() {
    var domain, i, problem, problems, _i, _j, _ref;
    _ref = this.problems;
    for (i = _i = _ref.length - 1; _i >= 0; i = _i += -1) {
      problems = _ref[i];
      if (i === this.index) {
        break;
      }
      if (!problems.length) {
        this.problems.splice(i, 1);
        this.domains.splice(i, 1);
        if (this.index >= i) {
          --this.index;
        }
      }
      for (_j = problems.length - 1; _j >= 0; _j += -1) {
        problem = problems[_j];
        domain = this.domains[i];
        problem.domain = domain;
      }
    }
  },
  push: function(problems, domain, reverse) {
    var cmd, cmds, exported, index, merged, other, position, priority, problem, _i, _j, _k, _len, _len1, _len2, _ref;
    if (domain === void 0) {
      _ref = problems.domains;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        domain = _ref[index];
        this.push(problems.problems[index], domain);
      }
      return this;
    }
    merged = void 0;
    priority = this.domains.length;
    position = this.index + 1;
    while ((other = this.domains[position]) !== void 0) {
      if (other || !domain) {
        if (other === domain) {
          cmds = this.problems[position];
          for (_j = 0, _len1 = problems.length; _j < _len1; _j++) {
            problem = problems[_j];
            exported = void 0;
            if (problem.exported) {
              for (_k = 0, _len2 = cmds.length; _k < _len2; _k++) {
                cmd = cmds[_k];
                if (cmd[0] === problem[0] && cmd[1] === problem[1] && cmd[2] === problem[2]) {
                  if (cmd.exported && cmd.parent.domain === problem.parent.domain) {
                    exported = true;
                    break;
                  }
                }
              }
            }
            if (!exported) {
              if (reverse) {
                cmds.unshift(problem);
              } else {
                cmds.push(problem);
              }
            }
          }
          merged = true;
          break;
        } else if (other && domain) {
          if (((other.priority < domain.priority) || (other.priority === domain.priority && other.MAYBE && !domain.MAYBE)) && (!other.frame || other.frame === domain.frame)) {
            if (priority === this.domains.length) {
              priority = position;
            }
          }
        }
      }
      position++;
    }
    if (!merged) {
      if (!domain) {
        debugger;
      }
      this.domains.splice(priority, 0, domain);
      this.problems.splice(priority, 0, problems);
    }
    return this;
  },
  each: function(callback, bind, solution) {
    var domain, result, _ref, _ref1;
    console.log('each', !!callback, bind, solution);
    if (solution) {
      this.apply(solution);
    }
    if (!this.problems[this.index + 1]) {
      return;
    }
    this.optimize();
    while ((domain = this.domains[++this.index]) !== void 0) {
      result = (this.solutions || (this.solutions = []))[this.index] = callback.call(bind || this, domain, this.problems[this.index], this.index, this);
      if (((_ref = this.busy) != null ? _ref.length : void 0) && this.busy.indexOf((_ref1 = this.domains[this.index + 1]) != null ? _ref1.url : void 0) === -1) {
        return result;
      }
      if (result) {
        if (result.push) {
          this.engine.update(result);
        } else {
          this.apply(result);
          solution = this.apply(result, solution || {});
        }
      }
    }
    this.index--;
    return solution || this;
  },
  apply: function(result, solution) {
    var property, value;
    if (solution == null) {
      solution = this.solution;
    }
    if (solution && result !== this.solution) {
      for (property in result) {
        value = result[property];
        solution[property] = value;
      }
    } else if (!solution) {
      this.solution = solution = result;
    }
    return solution;
  },
  getProblems: function(callback, bind) {
    return GSS.clone(this.problems);
  },
  index: -1
};

module.exports = Update;
