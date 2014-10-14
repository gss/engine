var Update, Updater;

Updater = function(engine) {
  var Update, property, value, _ref;
  Update = function(domain, problem, parent) {
    var a, arg, bypasser, bypassers, d, effects, foreign, index, offset, op, path, property, start, stringy, update, vardomain, _base, _i, _j, _len, _len1;
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
        vardomain = this.Variable.getDomain(arg);
        path = arg.property = this.Variable.getPath(arg[1], arg[2]);
        if (vardomain.MAYBE && domain && domain !== true) {
          vardomain.frame = domain;
        }
        effects = new Update(vardomain, [arg]);
        if (typeof (bypasser = this.variables[path]) === 'string') {
          bypassers = this.engine.bypassers;
          property = bypassers[bypasser];
          index = 0;
          while (op = property[index]) {
            if (op.variables[path]) {
              effects.push([op], [vardomain], true);
              property.splice(index, 1);
            } else {
              index++;
            }
          }
          if (Object.keys(property).length === 0) {
            delete bypassers[bypasser];
          }
          delete this.variables[path];
        }
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
            effects = this.update(d, arg, parent);
            break;
          } else if (typeof a !== 'string') {
            stringy = false;
          }
        }
        if (!effects && typeof (arg != null ? arg[0] : void 0) === 'string' && stringy) {
          effects = new this.update([null], [arg], parent);
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
      update = new this.update([domain !== true && domain || null], [problem]);
    }
    if (typeof problem[0] === 'string') {
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
        root = solution.domain.Operation.ascend(parent);
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
        if (index >= this.index) {
          p = parent;
          while (p) {
            if ((i = problems.indexOf(p)) > -1) {
              this.substitute(problems[i], operation, solution);
            }
            p = p.parent;
          }
        }
      }
    }
  },
  merge: function(from, to, parent) {
    var constraint, domain, glob, globals, globs, i, other, prob, probs, prop, result, solution, _i, _j, _k, _l, _len, _len1, _len2, _len3, _m, _ref;
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
    result.push.apply(result, domain["export"]());
    for (_k = 0, _len2 = probs.length; _k < _len2; _k++) {
      prob = probs[_k];
      if (result.indexOf(prob) === -1) {
        result.push(prob);
      }
    }
    for (_l = 0, _len3 = probs.length; _l < _len3; _l++) {
      prob = probs[_l];
      if (prob.domain === domain) {
        prob.domain = other;
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
    _ref = domain.constraints;
    for (_m = _ref.length - 1; _m >= 0; _m += -1) {
      constraint = _ref[_m];
      domain.unconstrain(constraint, void 0, true);
    }
    if ((i = this.engine.domains.indexOf(domain)) > -1) {
      this.engine.domains.splice(i, 1);
    }
    return true;
  },
  wrap: function(problem, parent) {
    var arg, bubbled, counter, domain, exp, exps, i, index, j, k, l, m, n, next, opdomain, other, previous, problems, probs, prop, strong, value, _i, _j, _k, _l, _len, _len1, _len2, _len3, _m, _n, _o, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
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
                      if (this.merge(n, index, parent)) {
                        1;
                      }
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
                    this.problems[index].push.apply(this.problems[index], this.problems[n]);
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
          opdomain = this.engine.Operation.getDomain(problem, other);
        }
        if (opdomain && (opdomain.displayName !== other.displayName)) {
          if ((index = this.domains.indexOf(opdomain, this.index + 1)) === -1) {
            index = this.domains.push(opdomain) - 1;
            this.problems[index] = [problem];
          } else {
            this.problems[index].push(problem);
          }
          strong = exp.domain && !exp.domain.MAYBE;
          for (_l = 0, _len1 = exp.length; _l < _len1; _l++) {
            arg = exp[_l];
            if (arg.domain && !arg.domain.MAYBE) {
              strong = true;
            }
          }
          if (!strong) {
            exps.splice(--i, 1);
          }
        } else if (!bubbled) {
          if (problem.indexOf(exps[i - 1]) > -1) {
            bubbled = exps;
            exps[i - 1] = problem;
            problem.domain = other;
          }
        }
        if (other) {
          _ref5 = this.domains;
          for (counter = _m = _ref5.length - 1; _m >= 0; counter = _m += -1) {
            domain = _ref5[counter];
            if (domain && (domain !== other || bubbled)) {
              if ((other.MAYBE && domain.MAYBE) || domain.displayName === other.displayName) {
                problems = this.problems[counter];
                for (_n = 0, _len2 = problem.length; _n < _len2; _n++) {
                  arg = problem[_n];
                  if ((j = problems.indexOf(arg)) > -1) {
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
          for (_o = 0, _len3 = problem.length; _o < _len3; _o++) {
            arg = problem[_o];
            if (arg.push) {
              if (arg[0] === 'get') {
                (problem.variables || (problem.variables = {}))[arg.property] = arg;
              } else if (arg.variables) {
                _ref6 = arg.variables;
                for (prop in _ref6) {
                  value = _ref6[prop];
                  (problem.variables || (problem.variables = {}))[prop] = value;
                }
              }
            }
          }
          return this.problems.indexOf(bubbled);
        }
        return;
      }
    }
  },
  unwrap: function(problems, domain, result) {
    var exports, imports, index, path, problem, _base, _i, _len;
    if (result == null) {
      result = [];
    }
    if (problems[0] === 'get') {
      problems.exported = true;
      problems.parent = void 0;
      result.push(problems);
      path = this.engine.Variable.getPath(problems[1], problems[2]);
      exports = (_base = (this.exports || (this.exports = {})))[path] || (_base[path] = []);
      exports.push(domain);
      imports = (this.imports || (this.imports = []));
      index = imports.indexOf(domain);
      if (index === -1) {
        index = imports.push(domain) - 1;
      }
      imports.splice(index + 1, 0, path);
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
  finish: function() {
    this.time = this.engine.time(this.start);
    this.start = void 0;
    console.info('update time', this.time, this.problems.length);
    return console.profileEnd(1);
  },
  optimize: function() {
    this.defer();
    this.reify();
    return this;
  },
  reify: function(operation, domain) {
    var arg, i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (!operation) {
      _ref = this.domains;
      _results = [];
      for (i = _i = _ref.length - 1; _i >= 0; i = _i += -1) {
        domain = _ref[i];
        if (i === this.index) {
          break;
        }
        if (domain) {
          _results.push(this.reify(this.problems[i], domain));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    } else {
      if ((_ref1 = operation.domain) != null ? _ref1.MAYBE : void 0) {
        operation.domain = domain;
      }
      if (operation != null ? operation.push : void 0) {
        _results1 = [];
        for (_j = 0, _len = operation.length; _j < _len; _j++) {
          arg = operation[_j];
          if (arg && typeof arg === 'object') {
            _results1.push(this.reify(arg, domain));
          } else {
            _results1.push(void 0);
          }
        }
        return _results1;
      }
    }
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
  connect: function(position) {
    var cmd, domain, framed, index, other, problem, problems, property, variable, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
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
      if (other && ((_ref = other.domain) != null ? _ref.displayName : void 0) === domain.displayName) {
        _ref1 = this.problems[index];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          cmd = _ref1[_i];
          if (cmd.variables) {
            for (_j = 0, _len1 = problems.length; _j < _len1; _j++) {
              problem = problems[_j];
              for (property in problem.variables) {
                if (variable = cmd.variables[property]) {
                  if (!variable.domain || variable.domain.displayName === domain.displayName) {
                    if (domain.frame === other.frame) {
                      if (((_ref2 = other.constraints) != null ? _ref2.length : void 0) > ((_ref3 = domain.constraints) != null ? _ref3.length : void 0) || position > index) {
                        this.merge(position, index);
                        position = index;
                      } else {
                        this.merge(index, position);
                      }
                      break connector;;
                      if (index < position) {
                        position--;
                      } else {
                        index--;
                      }
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
      }
    }
    };
  },
  push: function(problems, domain, reverse) {
    var cmd, cmds, copy, exported, index, merged, other, position, priority, problem, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref;
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
        if (other === domain || (domain && !(domain != null ? domain.solve : void 0) && other.url === domain.url)) {
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
              copy = void 0;
              for (_l = 0, _len3 = cmds.length; _l < _len3; _l++) {
                cmd = cmds[_l];
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
        } else if (!domain) {
          priority--;
        }
      }
      position++;
    }
    if (!merged) {
      this.domains.splice(priority, 0, domain);
      this.problems.splice(priority, 0, problems);
      this.connect(priority);
    }
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
    var domain, index, preceeding, previous, property, redefined, result, solved, value, _i, _ref, _ref1, _ref2;
    if (solution) {
      this.apply(solution);
    }
    if (!this.problems[this.index + 1]) {
      return;
    }
    this.optimize();
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
          preceeding = [];
          index = this.index;
          redefined = {};
          while (previous = this.domains[--index]) {
            if (previous && previous === domain) {
              preceeding.push(index);
            }
          }
          if (preceeding.length > 1) {
            for (_i = preceeding.length - 1; _i >= 0; _i += -1) {
              index = preceeding[_i];
              for (property in result) {
                value = result[property];
                if (solved = this.solutions[index]) {
                  if (solved.hasOwnProperty(property)) {
                    if (((_ref2 = redefined[property]) != null ? _ref2.indexOf(solved[property]) : void 0) > -1) {
                      this.engine.console.error(property, 'is looping', value, redefined[property], solved[property]);
                      delete result[property];
                    } else if (solved[property] != null) {
                      (redefined[property] || (redefined[property] = [])).push(solved[property]);
                    }
                  }
                }
              }
            }
          }
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
    var property, value;
    if (solution == null) {
      solution = this.solution;
    }
    if (result !== this.solution) {
      solution || (solution = this.solution = {});
      for (property in result) {
        value = result[property];
        solution[property] = value;
      }
    }
    return solution;
  },
  remove: function(continuation, problem) {
    var arg, i, index, problems, spliced, _i, _len, _results;
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
      _results = [];
      while (problems = this.problems[index++]) {
        _results.push((function() {
          var _j, _results1;
          _results1 = [];
          for (i = _j = problems.length - 1; _j >= 0; i = _j += -1) {
            problem = problems[i];
            if (this.remove(continuation, problem)) {
              problems.splice(i, 1);
              if (!problems.length) {
                _results1.push(spliced = true);
              } else {
                _results1.push(void 0);
              }
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        }).call(this));
      }
      return _results;
    }
  },
  getProblems: function(callback, bind) {
    return GSS.clone(this.problems);
  },
  index: -1
};

module.exports = Update;
