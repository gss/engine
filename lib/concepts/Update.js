var Update, Updater,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Updater = function(engine) {
  var Update, property, value, _ref;
  Update = function(problem, domain, parent, Default) {
    var arg, index, object, start, update, vardomain, _i, _len;
    if (this instanceof Update) {
      this.problems = problem && (domain.push && problem || [problem]) || [];
      this.domains = domain && (domain.push && domain || [domain]) || [];
      return;
    }
    if (start = !parent) {
      parent = this.updating;
    }
    update = new this.update;
    for (index = _i = 0, _len = problem.length; _i < _len; index = ++_i) {
      arg = problem[index];
      if (!(arg != null ? arg.push : void 0)) {
        continue;
      }
      if (typeof arg[0] === 'string') {
        arg.parent || (arg.parent = problem);
        if (arg[0] === 'get') {
          vardomain = arg.domain || (arg.domain = this.getVariableDomain(this, arg, Default));
          update.push([arg], vardomain);
        } else {
          this.update(arg, null, update, Default);
        }
        object = true;
      }
    }
    if (!object) {
      update.push([problem], null);
    }
    if (!(problem[0] instanceof Array)) {
      index = update.wrap(problem, parent, Default);
    }
    if (parent) {
      return parent.push(update);
    } else {
      return update.each(this.resolve, this.engine);
    }
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
    var domain, exported, method, other, prob, problems, property, result, variable, _i, _j, _len, _len1, _ref;
    domain = this.domains[from];
    other = this.domains[to];
    problems = this.problems[from];
    result = this.problems[to];
    if (!domain.MAYBE) {
      domain.transfer(parent, other);
      exported = domain["export"]();
    }
    for (_i = 0, _len = problems.length; _i < _len; _i++) {
      prob = problems[_i];
      if (result.indexOf(prob) === -1) {
        (exported || (exported = [])).push(prob);
      }
    }
    this.splice(from, 1);
    if (from < to) {
      method = 'unshift';
      to--;
    }
    if (exported) {
      result[method || 'push'].apply(result, exported);
      for (_j = 0, _len1 = exported.length; _j < _len1; _j++) {
        prob = exported[_j];
        this.setVariables(result, prob, other);
      }
      this.reify(exported, other, domain);
      _ref = result.variables;
      for (property in _ref) {
        variable = _ref[property];
        if (variable.domain.priority < 0 && variable.domain.displayName === domain.displayName) {
          (this.variables || (this.variables = {}))[property] = to;
        }
      }
    }
    if (!other.url && this.engine.domains.indexOf(other) === -1) {
      this.engine.domains.push(other);
    }
    return to;
  },
  wrap: function(problem, parent, Default) {
    var arg, bubbled, counter, domain, exp, exps, i, index, j, k, l, m, n, next, opdomain, other, previous, problems, probs, prop, value, _i, _j, _k, _l, _len, _len1, _len2, _m, _n, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
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
                      if ((this.merge(index, n, parent)) == null) {
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
        if (!other.signatures[problem[0]]) {
          opdomain = Default;
        }
        if (opdomain && (opdomain.displayName !== other.displayName)) {
          if ((j = this.domains.indexOf(opdomain, this.index + 1)) === -1) {
            j = this.domains.push(opdomain) - 1;
            this.problems[j] = [problem];
          } else {
            this.problems[j].push(problem);
          }
          problem.domain = opdomain;
          exps.splice(--i, 1);
          if (exps.length === 0) {
            this.splice(index, 1);
          }
        } else if (!bubbled) {
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
                      this.splice(counter, 1);
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
  splice: function(index) {
    var i, name, variable, _ref;
    if ((i = this.engine.domains.indexOf(this.domains[index])) > -1) {
      this.engine.domains.splice(i, 1);
    }
    this.domains.splice(index, 1);
    this.problems.splice(index, 1);
    if (this.variables) {
      _ref = this.variables;
      for (name in _ref) {
        variable = _ref[name];
        if (variable > index) {
          this.variables[name] = variable - 1;
        }
      }
    }
  },
  finish: function() {
    this.time = this.engine.console.time(this.start);
    return this.start = void 0;
  },
  reify: function(operation, domain, from) {
    var arg, _i, _len;
    if (operation.domain === from) {
      operation.domain = domain;
    }
    for (_i = 0, _len = operation.length; _i < _len; _i++) {
      arg = operation[_i];
      if (arg != null ? arg.push : void 0) {
        this.reify(arg, domain, from);
      }
    }
    return operation;
  },
  register: function(variables) {},
  connect: function(position, inserted) {
    var condition, connecting, domain, from, i, index, j, offset, other, problems, property, to, variable, variables, _i, _j, _ref, _ref1, _ref2, _ref3;
    index = this.index;
    domain = this.domains[position];
    if (!domain) {
      return;
    }
    problems = this.problems[position];
    variables = this.variables || (this.variables = {});
    connecting = void 0;
    if (inserted) {
      for (property in variables) {
        variable = variables[property];
        if (variable >= position) {
          variables[property]++;
        }
      }
    }
    _ref = problems.variables;
    for (property in _ref) {
      variable = _ref[property];
      if (variable.domain.priority < 0 && variable.domain.displayName === domain.displayName) {
        if (((i = variables[property]) != null) && (i > index) && (i !== position)) {
          if (__indexOf.call((connecting || (connecting = [])), i) < 0) {
            j = 0;
            while (connecting[j] < i) {
              j++;
            }
            connecting.splice(j, 0, i);
          }
        } else {
          variables[property] = position;
        }
      }
    }
    offset = 0;
    if (connecting) {
      for (index = _i = 0, _ref1 = connecting.length; _i < _ref1; index = _i += 1) {
        i = connecting[index];
        other = this.domains[i];
        condition = other.constraints && domain.constraints ? other.constraints.length > domain.constraints.length : position > i;
        if (condition) {
          from = i;
          to = position;
        } else {
          from = position;
          to = i;
        }
        position = this.merge(from, to);
        for (j = _j = _ref2 = index + 1, _ref3 = connecting.length; _ref2 <= _ref3 ? _j < _ref3 : _j > _ref3; j = _ref2 <= _ref3 ? ++_j : --_j) {
          if (connecting[j] >= from) {
            connecting[j]--;
          }
        }
      }
    }
  },
  push: function(problems, domain, reverse) {
    var cmds, index, other, position, priority, problem, _i, _j, _k, _len, _len1, _len2, _ref;
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
    if (domain == null) {
      debugger;
    }
    while ((other = this.domains[position]) !== void 0) {
      if (other || !domain) {
        if (other === domain || (domain && !(domain != null ? domain.solve : void 0) && other.url === domain.url)) {
          cmds = this.problems[position];
          for (_j = 0, _len1 = problems.length; _j < _len1; _j++) {
            problem = problems[_j];
            if (reverse || (domain && !domain.solve && other.url === domain.url && problem[0] === 'remove')) {
              cmds.unshift(problem);
            } else {
              cmds.push(problem);
            }
            this.setVariables(cmds, problem, other);
            this.reify(problem, other, domain);
          }
          this.connect(position);
          return true;
        } else if (other && domain) {
          if (other.priority < domain.priority) {
            priority = position;
            break;
          } else if ((other.priority === domain.priority && other.MAYBE && !domain.MAYBE) && (!other.frame || other.frame === domain.frame)) {
            priority = position + 1;
          }
        } else {
          priority--;
        }
      }
      position++;
    }
    for (_k = 0, _len2 = problems.length; _k < _len2; _k++) {
      problem = problems[_k];
      this.setVariables(problems, problem, domain);
    }
    this.insert(priority, domain, problems);
    this.reify(problems, domain);
    this.connect(priority, true);
    return this;
  },
  insert: function(index, domain, problems) {
    this.domains.splice(index, 0, domain);
    return this.problems.splice(index, 0, problems);
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
    var changes, command, commands, constants, first, group, i, message, path, paths, property, removes, url, value, values, worker, _i, _j, _k, _len, _len1, _ref, _ref1;
    if (this.posted) {
      _ref = this.posted;
      for (url in _ref) {
        message = _ref[url];
        worker = this.engine.workers[url];
        paths = (worker.paths || (worker.paths = {}));
        values = (worker.values || (worker.values = {}));
        changes = {};
        commands = [changes];
        removes = [];
        for (_i = 0, _len = message.length; _i < _len; _i++) {
          group = message[_i];
          for (_j = 0, _len1 = group.length; _j < _len1; _j++) {
            command = group[_j];
            first = command[0];
            if (first === 'remove') {
              for (i = _k = 1, _ref1 = command.length; 1 <= _ref1 ? _k < _ref1 : _k > _ref1; i = 1 <= _ref1 ? ++_k : --_k) {
                delete paths[command[i]];
                removes.push(command[i]);
              }
            } else if (first === 'value') {
              if (command[2] !== values[command[1]]) {
                changes[command[1]] = command[2];
              }
            } else {
              if ((path = first.key) != null) {
                paths[path] = true;
                if (constants = first.values) {
                  for (property in constants) {
                    value = constants[property];
                    if (value !== values[property]) {
                      changes[property] = value;
                    }
                  }
                }
              }
              commands.push(command);
            }
          }
        }
        if (removes.length) {
          removes.unshift('remove');
          commands.splice(1, 0, removes);
        }
        worker.postMessage(commands);
        while ((i = this.busy.indexOf(url)) > -1 && this.busy.lastIndexOf(url) !== i) {
          this.busy.splice(i, 1);
        }
      }
      return this.posted = void 0;
    }
  },
  each: function(callback, bind, solution) {
    var domain, previous, result, _ref, _ref1;
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
      solution || (solution = this.solution || (this.solution = {}));
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
    var i, index, problems, _i, _j, _ref;
    _ref = this.problems;
    for (index = _i = _ref.length - 1; _i >= 0; index = _i += -1) {
      problems = _ref[index];
      if (index === this.index) {
        break;
      }
      for (i = _j = problems.length - 1; _j >= 0; i = _j += -1) {
        problem = problems[i];
        if (problem && problem[0] && problem[0].key === continuation) {
          problems.splice(i, 1);
          if (problems.length === 0) {
            this.splice(index, 1);
          }
        }
      }
    }
  },
  getProblems: function(callback, bind) {
    return GSS.prototype.clone(this.problems);
  },
  perform: function(domain) {
    var glob, globals, globs, _i, _len, _results;
    globals = this.domains.indexOf(null, this.index + 1);
    if (globals > -1) {
      globs = this.problems[globals];
      if (typeof globs[0] === 'string') {
        if (globs[0] === 'remove') {
          return domain.remove.apply(domain, globs.slice(1));
        }
      } else {
        _results = [];
        for (_i = 0, _len = globs.length; _i < _len; _i++) {
          glob = globs[_i];
          if (glob[0] === 'remove') {
            _results.push(domain.remove.apply(domain, glob.slice(1)));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    }
  },
  index: -1
};

module.exports = Update;
