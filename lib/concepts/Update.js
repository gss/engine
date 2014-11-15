var Update, Updater;

Updater = function(engine) {
  var Update, property, value, _ref;
  Update = function(problem, domain, parent, Default) {
    var a, arg, d, effects, foreign, index, offset, path, start, stringy, update, vardomain, _base, _i, _j, _len, _len1;
    if (this instanceof Update) {
      if (domain != null ? domain.push : void 0) {
        debugger;
      }
      this.problems = problem && (domain.push && problem || [problem]) || [];
      this.domains = domain && (domain.push && domain || [domain]) || [];
      return;
    }
    start = !parent;
    for (index = _i = 0, _len = problem.length; _i < _len; index = ++_i) {
      arg = problem[index];
      if (!(arg != null ? arg.push : void 0)) {
        continue;
      }
      if (typeof problem[0] === 'string') {
        arg.parent = problem;
      }
      offset = 0;
      if (arg[0] === 'get') {
        vardomain = arg.domain || (arg.domain = this.getVariableDomain(this, arg, Default));
        path = arg[1];
        if (vardomain.MAYBE && domain && domain !== true) {
          vardomain.frame = domain;
        }
        effects = new Update([arg], vardomain);
      } else {
        stringy = true;
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
            effects = this.update(arg, d, parent, Default);
            break;
          } else if (typeof a !== 'string') {
            stringy = false;
          }
        }
        if (!effects && typeof (arg != null ? arg[0] : void 0) === 'string' && stringy) {
          effects = new this.update([arg], [null], parent);
        }
      }
      if (effects) {
        if (update && update !== effects) {
          update.push(effects);
        } else {
          update = effects;
          parent || (parent = update);
        }
      }
      effects = void 0;
    }
    if (!update) {
      if (typeof problem[0] === 'string') {
        problem = [problem];
      }
      foreign = true;
      update = new this.update([problem], [domain !== true && domain || null]);
    }
    if (!(problem[0] instanceof Array)) {
      index = update.wrap(problem, parent);
      if (index != null) {
        update.connect(index);
      }
    }
    if (start || foreign) {
      if (this.updating) {
        if (this.updating !== update) {
          return this.updating.push(update);
        }
      } else {
        return update.each(this.resolve, this.engine);
      }
    }
    return update;
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
  merge: function(from, to, parent) {
    var constraint, constraints, domain, exported, glob, globals, globs, i, other, prob, probs, prop, result, solution, _i, _j, _k, _l, _len, _len1, _len2;
    domain = this.domains[from];
    if (domain.frame) {
      return;
    }
    other = this.domains[to];
    probs = this.problems[from];
    if (parent) {
      globals = parent.domains.indexOf(null, parent.index + 1);
      if (!domain.MAYBE) {
        if (globals > -1) {
          globs = parent.problems[globals];
          if (typeof globs[0] === 'string') {
            if (globs[0] === 'remove') {
              domain.remove.apply(domain, globs.slice(1));
            }
          } else {
            for (_i = 0, _len = globs.length; _i < _len; _i++) {
              glob = globs[_i];
              if (glob[0] === 'remove') {
                domain.remove.apply(domain, glob.slice(1));
              }
            }
          }
        }
      }
    }
    if (this.engine.updating) {
      globals = this.engine.updating.domains.indexOf(null, this.engine.updating.index + 1);
      if (!domain.MAYBE) {
        if (globals > -1) {
          globs = this.engine.updating.problems[globals];
          if (typeof globs[0] === 'string') {
            if (globs[0] === 'remove') {
              domain.remove.apply(domain, globs.slice(1));
            }
          } else {
            for (_j = 0, _len1 = globs.length; _j < _len1; _j++) {
              glob = globs[_j];
              if (glob[0] === 'remove') {
                domain.remove.apply(domain, glob.slice(1));
              }
            }
          }
        }
      }
    }
    while (prob = probs[i++]) {
      if (prob[0] === 'remove') {
        domain.remove.apply(domain, prob.slice(1));
        probs.splice(i, 1);
      } else {
        i++;
      }
    }
    result = this.problems[to];
    this.setVariables(result, probs, other);
    if (exported = domain["export"]()) {
      result.push.apply(result, this.reify(exported, other, domain));
      this.setVariables(result, exported, other);
    }
    for (_k = 0, _len2 = probs.length; _k < _len2; _k++) {
      prob = probs[_k];
      if (result.indexOf(prob) === -1) {
        result.push(this.reify(prob, other, domain));
      }
    }
    if (domain.nullified) {
      solution = {};
      for (prop in domain.nullified) {
        (solution || (solution = {}))[prop] = null;
      }
      this.engine.updating.apply(solution);
    }
    this.domains.splice(from, 1);
    this.problems.splice(from, 1);
    if (constraints = domain.constraints) {
      for (_l = constraints.length - 1; _l >= 0; _l += -1) {
        constraint = constraints[_l];
        domain.unconstrain(constraint, void 0, true);
      }
    }
    if ((i = this.engine.domains.indexOf(domain)) > -1) {
      this.engine.domains.splice(i, 1);
    }
    return true;
  },
  wrap: function(problem, parent) {
    var arg, bubbled, counter, domain, exp, exps, i, index, j, k, l, m, n, next, other, previous, problems, probs, prop, value, _i, _j, _k, _l, _len, _len1, _len2, _m, _n, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
    bubbled = void 0;
    _ref = this.domains;
    for (index = _i = _ref.length - 1; _i >= 0; index = _i += -1) {
      other = _ref[index];
      exps = this.problems[index];
      i = 0;
      if (index === this.index) {
        break;
      }
      while (exp = exps[i++]) {
        if (!((j = problem.indexOf(exp)) > -1)) {
          continue;
        }
        k = l = j;
        while ((next = problem[++k]) !== void 0) {
          if (next && next.push) {
            _ref1 = this.problems;
            for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
              problems = _ref1[_j];
              if ((m = problems.indexOf(next)) > -1) {
                break;
              }
            }
            if (m > -1) {
              break;
            }
          }
        }
        if (next) {
          continue;
        }
        while ((previous = problem[--l]) !== void 0) {
          if (previous && previous.push && exps.indexOf(previous) === -1) {
            _ref2 = this.domains;
            for (n = _k = _ref2.length - 1; _k >= 0; n = _k += -1) {
              domain = _ref2[n];
              if (n === index) {
                continue;
              }
              if (n === this.index) {
                break;
              }
              probs = this.problems[n];
              if ((j = probs.indexOf(previous)) > -1) {
                if (domain !== other && domain.priority < 0 && other.priority < 0) {
                  if (!domain.MAYBE) {
                    if (index < n || ((_ref3 = other.constraints) != null ? _ref3.length : void 0) > ((_ref4 = domain.constraints) != null ? _ref4.length : void 0)) {
                      this.merge(n, index, parent);
                    } else {
                      if (!this.merge(index, n, parent)) {
                        exps.splice(--i, 1);
                      }
                      other = domain;
                      i = j + 1;
                      exps = this.problems[n];
                    }
                    break;
                  } else if (!other.MAYBE) {
                    this.merge(n, index);
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
        if (!bubbled) {
          if (problem.indexOf(exps[i - 1]) > -1) {
            bubbled = exps;
            if (exps.indexOf(problem) === -1) {
              exps[i - 1] = problem;
            } else {
              exps.splice(--i, 1);
            }
            problem.domain = other;
          }
        }
        if (other) {
          _ref5 = this.domains;
          for (counter = _l = _ref5.length - 1; _l >= 0; counter = _l += -1) {
            domain = _ref5[counter];
            if (domain && (domain !== other || bubbled)) {
              if ((other.MAYBE && domain.MAYBE) || domain.displayName === other.displayName) {
                problems = this.problems[counter];
                for (_m = 0, _len1 = problem.length; _m < _len1; _m++) {
                  arg = problem[_m];
                  if ((j = problems.indexOf(arg)) > -1) {
                    this.reify(arg, other, domain);
                    problems.splice(j, 1);
                    if (problems.length === 0) {
                      this.problems.splice(counter, 1);
                      this.domains.splice(counter, 1);
                    }
                  }
                }
              }
            }
          }
        }
        if (bubbled) {
          for (_n = 0, _len2 = problem.length; _n < _len2; _n++) {
            arg = problem[_n];
            if (arg.push) {
              if (arg[0] === 'get') {
                this.setVariable(problem, arg[1], arg);
                this.setVariable(exp, arg[1], arg);
              } else if (arg.variables) {
                _ref6 = arg.variables;
                for (prop in _ref6) {
                  value = _ref6[prop];
                  this.setVariable(problem, prop, value);
                  this.setVariable(exp, prop, value);
                }
              }
            }
          }
          this.setVariables(bubbled, problem, other);
          return this.problems.indexOf(bubbled);
        }
        return;
      }
    }
  },
  setVariable: function(result, prop, arg, domain) {
    var variables;
    variables = (result.variables || (result.variables = {}));
    return variables[prop] = arg;
  },
  setVariables: function(result, probs, other) {
    var operation, property, variables, _ref;
    if (probs.variables) {
      variables = result.variables || (result.variables = {});
      _ref = probs.variables;
      for (property in _ref) {
        operation = _ref[property];
        variables[property] = operation;
      }
    }
  },
  finish: function() {
    this.time = this.engine.console.time(this.start);
    return this.start = void 0;
  },
  reify: function(operation, domain, from) {
    var arg, i, _i, _j, _len, _ref;
    if (!operation) {
      _ref = this.domains;
      for (i = _i = _ref.length - 1; _i >= 0; i = _i += -1) {
        domain = _ref[i];
        if (i === this.index) {
          break;
        }
        if (domain) {
          this.reify(this.problems[i], domain, from);
        }
      }
    } else {
      if (operation != null ? operation.push : void 0) {
        if (operation.domain === from) {
          operation.domain = domain;
        }
        for (_j = 0, _len = operation.length; _j < _len; _j++) {
          arg = operation[_j];
          if (arg != null ? arg.push : void 0) {
            this.reify(arg, domain, from);
          }
        }
      }
    }
    return operation;
  },
  connect: function(position) {
    var domain, framed, index, other, problems, property, variable, variables, _ref, _ref1, _ref2;
    index = this.index;
    domain = this.domains[position];
    if (!domain) {
      return;
    }
    problems = this.problems[position];
    while ((other = this.domains[++index]) !== void 0) {
      if (position === index) {
        continue;
      }
      connector: {;
      if ((typeof other !== "undefined" && other !== null ? other.displayName : void 0) === domain.displayName) {
        if (variables = this.problems[index].variables) {
          for (property in problems.variables) {
            if (variable = variables[property]) {
              if (((_ref = variable.domain) != null ? _ref.displayName : void 0) === domain.displayName) {
                if (domain.frame === other.frame) {
                  if (((_ref1 = other.constraints) != null ? _ref1.length : void 0) > ((_ref2 = domain.constraints) != null ? _ref2.length : void 0) || position > index) {
                    this.merge(position, index);
                    position = index;
                  } else {
                    this.merge(index, position);
                  }
                  if (index < position) {
                    position--;
                  } else {
                    index--;
                  }
                  break connector;;
                } else {
                  framed = domain.frame && domain || other;
                }
              }
            }
          }
        }
      }
    }
    };
  },
  push: function(problems, domain, reverse) {
    var cmd, cmds, copy, exported, index, other, position, priority, problem, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref;
    if (domain === void 0) {
      _ref = problems.domains;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        domain = _ref[index];
        this.push(problems.problems[index], domain);
      }
      return this;
    }
    priority = this.domains.length;
    position = this.index + 1;
    while ((other = this.domains[position]) !== void 0) {
      if (other || !domain) {
        if (other === domain || (domain && !(domain != null ? domain.solve : void 0) && other.url === domain.url)) {
          cmds = this.problems[position];
          for (_j = 0, _len1 = problems.length; _j < _len1; _j++) {
            problem = problems[_j];
            exported = void 0;
            copy = void 0;
            for (_k = 0, _len2 = cmds.length; _k < _len2; _k++) {
              cmd = cmds[_k];
              if ((cmd === problem) || (cmd.parent && cmd.parent === problem.parent && cmd.index === problem.index)) {
                copy = true;
              }
            }
            if (!copy) {
              if (reverse || (domain && !domain.solve && other.url === domain.url && problem[0] === 'remove')) {
                cmds.unshift(problem);
              } else {
                cmds.push(problem);
              }
              this.setVariables(cmds, problem, other);
              this.reify(problem, other, domain);
            }
          }
          this.connect(position);
          return true;
        } else if (other && domain) {
          if (((other.priority < domain.priority) || (other.priority === domain.priority && other.MAYBE && !domain.MAYBE)) && (!other.frame || other.frame === domain.frame)) {
            if (priority === this.domains.length) {
              priority = position;
            }
          }
        } else if (!domain) {
          priority--;
        }
      }
      position++;
    }
    this.domains.splice(priority, 0, domain);
    this.problems.splice(priority, 0, problems);
    for (_l = 0, _len3 = problems.length; _l < _len3; _l++) {
      problem = problems[_l];
      this.setVariables(problems, problem, domain);
    }
    this.reify(problems, domain);
    this.connect(priority);
    return this;
  },
  cleanup: function(name, continuation) {
    var length, old, prop, _results;
    old = this[name];
    if (continuation) {
      if (old) {
        length = continuation.length;
        _results = [];
        for (prop in old) {
          if (prop.substring(0, length) === continuation) {
            _results.push(delete old[prop]);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    } else {
      this[name] = {};
      return this[name].previous = old;
    }
  },
  reset: function(continuation) {
    this.cleanup('queries', continuation);
    this.cleanup('collections', continuation);
    return this.cleanup('mutations');
  },
  await: function(url) {
    return (this.busy || (this.busy = [])).push(url);
  },
  postMessage: function(url, message) {
    var _base, _name;
    return ((_base = (this.posted || (this.posted = {})))[_name = url.url || url] || (_base[_name] = [])).push(this.engine.clone(message));
  },
  terminate: function() {
    var i, message, url, _ref;
    if (this.posted) {
      _ref = this.posted;
      for (url in _ref) {
        message = _ref[url];
        this.engine.workers[url].postMessage(message);
        while ((i = this.busy.indexOf(url)) > -1 && this.busy.lastIndexOf(url) !== i) {
          this.busy.splice(i, 1);
        }
      }
      return this.posted = void 0;
    }
  },
  each: function(callback, bind, solution) {
    var domain, previous, result, _base, _name, _ref, _ref1;
    if (solution) {
      this.apply(solution);
    }
    if (!this.problems[this.index + 1]) {
      return;
    }
    previous = this.domains[this.index];
    while ((domain = this.domains[++this.index]) !== void 0) {
      previous = domain;
      result = (this.solutions || (this.solutions = []))[this.index] = callback.call(bind || this, domain, this.problems[this.index], this.index, this);
      if (this.effects) {
        this.apply(this.effects, (result = (_base = this.solutions)[_name = this.index] || (_base[_name] = {})));
        this.effects = void 0;
      }
      if (((_ref = this.busy) != null ? _ref.length : void 0) && this.busy.indexOf((_ref1 = this.domains[this.index + 1]) != null ? _ref1.url : void 0) === -1) {
        this.terminate();
        return result;
      }
      if (result && result.onerror === void 0) {
        if (result.push) {
          this.engine.update(result);
        } else {
          this.apply(result);
          solution = this.apply(result, solution || {});
        }
      }
    }
    this.terminate();
    this.index--;
    return solution || this;
  },
  apply: function(result, solution) {
    var i, property, redefined, value, _base, _ref;
    if (solution == null) {
      solution = this.solution;
    }
    if (result !== this.solution) {
      solution || (solution = this.solution = {});
      for (property in result) {
        value = result[property];
        if ((redefined = (_ref = this.redefined) != null ? _ref[property] : void 0)) {
          i = redefined.indexOf(value);
          if (i > -1) {
            solution[property] = redefined[redefined.length - 1];
            if (i !== redefined.length - 1) {
              console.error(property, 'is looping: ', this.redefined[property], ' and now ', value, 'again');
            }
            continue;
          }
        }
        if (solution === this.solution) {
          redefined = (_base = (this.redefined || (this.redefined = {})))[property] || (_base[property] = []);
          if (redefined[redefined.length - 1] !== value && (value != null)) {
            redefined.push(value);
          }
        }
        solution[property] = value;
      }
    }
    return solution;
  },
  remove: function(continuation, problem) {
    var arg, i, index, problems, spliced, _i, _j, _len;
    if (problem) {
      if ((problem[0] === 'value' && problem[2] === continuation) || (problem[0] === 'get' && problem[3] === continuation)) {
        return true;
      } else {
        for (_i = 0, _len = problem.length; _i < _len; _i++) {
          arg = problem[_i];
          if (arg != null ? arg.push : void 0) {
            if (this.remove(continuation, arg)) {
              return true;
            }
          }
        }
      }
    } else {
      index = this.index;
      spliced = false;
      while (problems = this.problems[index++]) {
        for (i = _j = problems.length - 1; _j >= 0; i = _j += -1) {
          problem = problems[i];
          if (this.remove(continuation, problem)) {
            problems.splice(i, 1);
            if (!problems.length) {
              spliced = true;
            }
          }
        }
      }
    }
  },
  getProblems: function(callback, bind) {
    return GSS.prototype.clone(this.problems);
  },
  index: -1
};

module.exports = Update;
