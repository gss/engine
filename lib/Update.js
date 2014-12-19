var Update, Updater,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Updater = function(engine) {
  var Update, property, value, _ref;
  Update = function(problem, domain, parent, Domain) {
    var arg, index, object, result, update, vardomain, _i, _len;
    if (this instanceof Update) {
      this.problems = problem && (domain.push && problem || [problem]) || [];
      this.domains = domain && (domain.push && domain || [domain]) || [];
      return;
    }
    update = void 0;
    for (index = _i = 0, _len = problem.length; _i < _len; index = ++_i) {
      arg = problem[index];
      if (!(arg != null ? arg.push : void 0)) {
        continue;
      }
      if (!(arg[0] instanceof Array)) {
        arg.parent || (arg.parent = problem);
        if (arg[0] === 'get') {
          vardomain = arg.domain || (arg.domain = this.domain.getVariableDomain(arg, Domain));
          (update || (update = new this.update)).push([arg], vardomain);
        } else {
          if (result = this.update(arg, domain, update || false, Domain)) {
            update || (update = result);
          }
        }
        object = true;
      }
    }
    if (!object) {
      if (!(problem instanceof Array)) {
        update.push([problem], null);
      }
    }
    if (!(problem[0] instanceof Array)) {
      if (update) {
        update.wrap(problem, parent, domain || Domain);
      } else if (problem[0] !== 'remove') {
        return;
      } else {
        update = new this.update([problem], [domain || Domain || null]);
      }
    }
    if (parent === false) {
      return update;
    } else if (parent || (parent = this.updating)) {
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
  push: function(problems, domain, reverse) {
    var index, other, position, _i, _len, _ref;
    if (domain === void 0) {
      _ref = problems.domains;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        domain = _ref[index];
        this.push(problems.problems[index], domain);
      }
      return this;
    }
    if ((position = this.domains.indexOf(domain, this.index + 1)) > -1) {
      return this.append(position, problems, reverse);
    }
    if (!domain) {
      position = this.index + 1;
    } else {
      position = this.domains.length;
      while (position - 1 > this.index && (other = this.domains[position - 1])) {
        if (!(other.priority < domain.priority || (reverse && this.problems[position - 1][0][0] !== 'remove'))) {
          break;
        }
        --position;
      }
    }
    this.insert(position, domain, problems);
    return position;
  },
  append: function(position, problems, reverse) {
    var cmds, domain, problem, _i, _len;
    cmds = this.problems[position];
    domain = this.domains[position];
    this.mix(cmds, problems);
    for (_i = 0, _len = problems.length; _i < _len; _i++) {
      problem = problems[_i];
      if (domain) {
        this.setVariables(cmds, problem);
        this.reify(problem, domain);
      }
    }
    if (domain) {
      return this.connect(position);
    }
  },
  insert: function(position, domain, problems) {
    var problem, property, variable, variables, _i, _len;
    for (_i = 0, _len = problems.length; _i < _len; _i++) {
      problem = problems[_i];
      this.setVariables(problems, problem);
    }
    this.domains.splice(position, 0, domain);
    this.problems.splice(position, 0, problems);
    if (variables = this.variables) {
      for (property in variables) {
        variable = variables[property];
        if (variable >= position) {
          variables[property]++;
        }
      }
    }
    this.reify(problems, domain);
    return this.connect(position);
  },
  splice: function(index) {
    var domain, name, variable, _ref;
    domain = this.domains[index];
    this.domains.splice(index, 1);
    this.problems.splice(index, 1);
    if (this.variables) {
      _ref = this.variables;
      for (name in _ref) {
        variable = _ref[name];
        if (variable >= index) {
          if (variable === index) {
            this.variables[name] = void 0;
          } else {
            this.variables[name] = variable - 1;
          }
        }
      }
    }
  },
  wrap: function(operation, parent, Domain) {
    var argument, domain, i, index, j, other, position, positions, problems, signed, _i, _j, _k, _l, _len, _len1, _len2, _len3, _m, _ref;
    positions = void 0;
    _ref = this.problems;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      problems = _ref[index];
      if (domain = this.domains[index]) {
        signed = typeof operation[0] !== 'string' || domain.signatures[operation[0]];
        for (_j = 0, _len1 = operation.length; _j < _len1; _j++) {
          argument = operation[_j];
          if (signed && problems.indexOf(argument) > -1) {
            if (!other || (domain.Solver && !other.Solver)) {
              position = index;
              other = domain;
            }
          }
          if (!positions || positions.indexOf(index) === -1) {
            (positions || (positions = [])).push(index);
          }
        }
      }
    }
    if (Domain && (!other || other.displayName !== Domain.displayName)) {
      other = Domain;
      position = this.push([operation], Domain);
    }
    if (!positions) {
      this.push([operation], null);
      return;
    }
    for (j = _k = positions.length - 1; _k >= 0; j = _k += -1) {
      index = positions[j];
      if ((domain = this.domains[index]).displayName !== other.displayName) {
        positions.splice(j, 1);
      } else {
        problems = this.problems[index];
        for (_l = 0, _len2 = operation.length; _l < _len2; _l++) {
          argument = operation[_l];
          if ((i = problems.indexOf(argument)) > -1) {
            if (argument.push) {
              this.reify(argument, other, domain);
            }
            if (index === position && problems.indexOf(operation) === -1) {
              problems[i] = operation;
              positions.splice(j, 1);
              operation.domain = domain;
            } else {
              problems.splice(i, 1);
              if (problems.length === 0 && !domain.paths) {
                this.splice(index, 1);
                if (index < position) {
                  position--;
                }
                positions.splice(j, 1);
              }
            }
          }
        }
      }
    }
    if (other) {
      operation.domain = other;
      for (_m = 0, _len3 = operation.length; _m < _len3; _m++) {
        argument = operation[_m];
        if (argument.push) {
          operation.variables = argument.variables = this.setVariables(operation, argument, true);
        }
      }
      this.setVariables(this.problems[position], operation);
    }
    if (positions.length) {
      return this.connect(position, positions);
    } else {
      return this.connect(position);
    }
  },
  match: function(target, domain, positions) {
    var Solver, i, index, problems, property, variable, variables, _ref;
    problems = this.problems[target];
    variables = this.variables || (this.variables = {});
    if (Solver = domain.Solver) {
      _ref = problems.variables;
      for (property in _ref) {
        variable = _ref[property];
        if (variable.domain.Solver === Solver) {
          if (((i = variables[property]) != null) && (i !== target)) {
            if (__indexOf.call((positions || (positions = [])), i) < 0) {
              index = 0;
              while (positions[index] < i) {
                index++;
              }
              positions.splice(index, 0, i);
            }
          } else {
            variables[property] = target;
          }
        }
      }
    }
    return positions;
  },
  connect: function(target, positions) {
    var a, b, condition, domain, from, i, index, j, to, _i, _j, _ref, _ref1, _ref2;
    if (!(domain = this.domains[target])) {
      return;
    }
    if (positions || (positions = this.match(target, domain, positions))) {
      b = domain.constraints;
      for (index = _i = 0, _ref = positions.length; _i < _ref; index = _i += 1) {
        i = positions[index];
        a = this.domains[i].constraints;
        condition = a || b ? (a && a.length) < (b && b.length) : target < i;
        if (condition) {
          from = i;
          to = target;
        } else {
          from = target;
          to = i;
        }
        target = this.merge(from, to);
        for (j = _j = _ref1 = index + 1, _ref2 = positions.length; _j < _ref2; j = _j += 1) {
          if (positions[j] >= from) {
            positions[j]--;
          }
        }
      }
    }
    return target;
  },
  merge: function(from, to, parent) {
    var Solver, domain, exported, other, prob, problems, property, result, variable, _i, _j, _len, _len1, _ref;
    other = this.domains[to];
    problems = this.problems[from];
    result = this.problems[to];
    if (domain = this.domains[from]) {
      if (domain.paths && !domain.consumed) {
        domain.transfer(parent, this, other);
        exported = domain["export"]();
        domain.register(false);
      }
      for (_i = 0, _len = problems.length; _i < _len; _i++) {
        prob = problems[_i];
        if (result.indexOf(prob) === -1) {
          (exported || (exported = [])).push(prob);
        } else {
          this.reify(prob, other, domain);
        }
      }
    }
    this.splice(from, 1);
    if (from < to) {
      to--;
    }
    if (exported) {
      this.mix(result, exported);
      for (_j = 0, _len1 = exported.length; _j < _len1; _j++) {
        prob = exported[_j];
        this.setVariables(result, prob);
      }
      this.reify(exported, other, domain);
      if (Solver = domain.Solver) {
        _ref = result.variables;
        for (property in _ref) {
          variable = _ref[property];
          if (variable.domain.Solver === Solver) {
            (this.variables || (this.variables = {}))[property] = to;
          }
        }
      }
    }
    other.register();
    return to;
  },
  mix: function(result, exported) {
    var index, prob, problem, _i, _j, _len, _len1, _ref, _results;
    _results = [];
    for (_i = 0, _len = exported.length; _i < _len; _i++) {
      prob = exported[_i];
      for (index = _j = 0, _len1 = result.length; _j < _len1; index = ++_j) {
        problem = result[index];
        if (((_ref = problem.index) != null ? _ref : Infinity) > prob.index) {
          break;
        }
      }
      _results.push(result.splice(index, 0, prob));
    }
    return _results;
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
    var domain, previous, property, result, variable, _ref;
    if (solution) {
      this.apply(solution);
    }
    if (!this.problems[this.index + 1]) {
      return;
    }
    previous = this.domains[this.index];
    while ((domain = this.domains[++this.index]) !== void 0) {
      previous = domain;
      if (this.variables) {
        _ref = this.variables;
        for (property in _ref) {
          variable = _ref[property];
          if (variable <= this.index) {
            delete this.variables[property];
          }
        }
      }
      result = (this.solutions || (this.solutions = []))[this.index] = callback.call(bind || this, domain, this.problems[this.index], this.index, this);
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
        if (solution[property] !== value) {
          if (this.solved == null) {
            this.solved = true;
          }
          solution[property] = value;
        }
      }
    }
    return solution;
  },
  remove: function(continuation, problem) {
    var i, index, problems, _i, _j, _ref;
    this.push([['remove', continuation]], null);
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
  perform: function(domain) {
    var glob, globals, globs, _i, _len;
    globals = this.domains.indexOf(null, this.index + 1);
    if (globals > -1) {
      globs = this.problems[globals];
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
  },
  setVariables: function(result, operation, share) {
    var property, variable, variables;
    if (variables = operation.variables) {
      if (!result.variables && share) {
        result.variables = variables;
      } else {
        for (property in variables) {
          variable = variables[property];
          (result.variables || (result.variables = {}))[property] = variable;
        }
      }
    } else if (operation[0] === 'get') {
      (result.variables || (result.variables = {}))[operation[1]] = operation;
    }
    return result.variables;
  },
  reify: function(operation, domain, from) {
    var arg, _i, _len;
    if (operation.domain === from) {
      operation.domain = domain;
    }
    for (_i = 0, _len = operation.length; _i < _len; _i++) {
      arg = operation[_i];
      if (arg && arg.push) {
        this.reify(arg, domain, from);
      }
    }
    return operation;
  },
  cleanup: function(name, continuation) {
    var length, old, prop, _results;
    old = this[name];
    if (continuation) {
      if (old) {
        length = continuation.length;
        _results = [];
        for (prop in old) {
          if (prop.length > length) {
            if (prop.substring(0, length) === continuation) {
              _results.push(delete old[prop]);
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    } else {
      return this[name] = void 0;
    }
  },
  reset: function(continuation) {
    this.cleanup('queries', continuation);
    this.cleanup('collections', continuation);
    return this.cleanup('mutations');
  },
  getProblems: function(callback, bind) {
    return GSS.prototype.clone(this.problems);
  },
  finish: function() {
    this.time = this.engine.console.getTime(this.start);
    return this.start = void 0;
  },
  isDone: function() {
    return (this.domains.length === this.index + 1) && this.isDocumentDone();
  },
  isDocumentDone: function() {
    return !this.mutations && !this.ascending && !this.pairs && !this.stylesheets && !this.branches;
  },
  hadSideEffects: function() {
    return this.domains.length > 0 || this.hasOwnProperty('restyled');
  },
  block: function() {
    return this.blocking++;
  },
  unblock: function() {
    return --this.blocking === 0;
  },
  blocking: 0,
  index: -1
};

module.exports = Update;
