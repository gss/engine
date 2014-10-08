/* Domain: Observed values
Acts as input values for equations.

Interface:

  - (un)watch() - (un)subscribe expression to property updates
  - set()       - dispatches updates to subscribed expressions
  - get()       - retrieve value
  - remove()    - detach observes by continuation


State:
  - @watchers[key] - List of oservers of specific properties
                      as [operation, continuation, scope] triplets

  - @observers[continuation] - List of observers by continuation
                                as [operation, key, scope] triplets
*/

var Domain, Native,
  __hasProp = {}.hasOwnProperty;

Native = require('../methods/Native');

Domain = (function() {
  Domain.prototype.priority = 0;

  function Domain(engine, url, values, name) {
    if (!engine || engine instanceof Domain) {
      if (engine) {
        this.engine = engine;
      }
      if (name) {
        this.displayName = name;
      }
      if (url) {
        this.url = url;
      }
      if (!this.hasOwnProperty('values')) {
        this.values = {};
      }
      if (values) {
        this.merge(values);
      }
      if (this.url && this.getWorkerURL) {
        if (this.url && (this.url = typeof this.getWorkerURL === "function" ? this.getWorkerURL(this.url) : void 0)) {
          if (engine !== this) {
            if (!this.useWorker(this.url)) {
              this.url = void 0;
            }
          }
        }
      }
      return this;
    } else {
      return this.find.apply(this, arguments);
    }
  }

  Domain.prototype.setup = function(hidden) {
    var _base;
    if (hidden == null) {
      hidden = this.immutable;
    }
    this.variables || (this.variables = {});
    if (!this.hasOwnProperty('watchers')) {
      this.expressions = new this.Expressions(this);
      this.watchers = {};
      this.observers = {};
      this.paths = {};
      if (this.structured) {
        this.objects = {};
      }
      this.substituted = [];
      this.constraints = [];
      if (!this.hasOwnProperty('values')) {
        this.values = {};
      }
      (_base = this.engine).domains || (_base.domains = []);
      if (!hidden && this.domain !== this.engine) {
        this.domains.push(this);
      }
      return this.MAYBE = void 0;
    }
  };

  Domain.prototype.solve = function(args) {
    var commands, object, result, strategy, _ref, _ref1, _ref2;
    if (!args) {
      return;
    }
    if (this.disconnected) {
      if ((_ref = this.mutations) != null) {
        _ref.disconnect();
      }
    }
    this.setup();
    if (typeof args === 'object' && !args.push) {
      if (this.domain === this.engine) {
        this.assumed.merge(args);
      } else {
        this.merge(args);
      }
    } else if (strategy = this.strategy) {
      if ((object = this[strategy]).solve) {
        result = object.solve.apply(object, arguments) || {};
      } else {
        result = this[strategy].apply(this, arguments);
      }
    }
    if (this.constrained || this.unconstrained) {
      commands = this.validate.apply(this, arguments);
      this.restruct();
      if (commands === false) {
        if (this.disconnected) {
          if ((_ref1 = this.mutations) != null) {
            _ref1.connect();
          }
        }
        return;
      }
    }
    if (result = typeof this.perform === "function" ? this.perform() : void 0) {
      result = this.apply(result);
    }
    if (commands) {
      this.engine.provide(commands);
    }
    if (this.disconnected) {
      if ((_ref2 = this.mutations) != null) {
        _ref2.connect();
      }
    }
    return result;
  };

  Domain.prototype.provide = function(solution, value) {
    if (solution instanceof Domain) {
      return this.merge(solution);
    } else if (this.domain) {
      this.engine.engine.provide(solution);
      return;
    } else {
      this.engine.provide(solution);
      return;
    }
    return true;
  };

  Domain.prototype.watch = function(object, property, operation, continuation, scope) {
    var id, j, obj, observers, path, prop, watchers, _base, _base1, _base2;
    this.setup();
    path = this.engine.getPath(object, property);
    if (this.engine.indexOfTriplet(this.watchers[path], operation, continuation, scope) === -1) {
      observers = (_base = this.observers)[continuation] || (_base[continuation] = []);
      observers.push(operation, path, scope);
      watchers = (_base1 = this.watchers)[path] || (_base1[path] = []);
      watchers.push(operation, continuation, scope);
      if (this.structured && watchers.length === 3) {
        if ((j = path.indexOf('[')) > -1) {
          id = path.substring(0, j);
          obj = (_base2 = this.objects)[id] || (_base2[id] = {});
          prop = path.substring(j + 1, path.length - 1);
          obj[prop] = true;
          if (typeof this.onWatch === "function") {
            this.onWatch(id, prop);
          }
        }
      }
    }
    return this.get(path);
  };

  Domain.prototype.unwatch = function(object, property, operation, continuation, scope) {
    var id, index, j, obj, observers, old, path, prop, watchers, _base;
    path = this.engine.getPath(object, property);
    observers = this.observers[continuation];
    index = this.engine.indexOfTriplet(observers, operation, path, scope);
    observers.splice(index, 3);
    if (!observers.length) {
      delete this.observers[continuation];
    }
    watchers = this.watchers[path];
    index = this.engine.indexOfTriplet(watchers, operation, continuation, scope);
    watchers.splice(index, 3);
    if (!watchers.length) {
      delete this.watchers[path];
      if (this.structured) {
        if ((j = path.indexOf('[')) > -1) {
          id = path.substring(0, j);
          obj = (_base = this.objects)[id] || (_base[id] = {});
          prop = path.substring(j + 1, path.length - 1);
          old = obj[prop];
          delete obj[prop];
          if (this.engine.updating) {
            (this.changes || (this.changes = {}))[path] = null;
          }
          if (this.immediate) {
            this.set(path, null);
          }
          if (Object.keys(obj).length === 0) {
            return delete this.objects[id];
          }
        }
      }
    }
  };

  Domain.prototype.get = function(object, property) {
    return this.values[this.engine.getPath(object, property)];
  };

  Domain.prototype.merge = function(object, meta) {
    if (object && !object.push) {
      if (object instanceof Domain) {
        return;
      }
      if (this.updating) {
        return this.merger(object, meta);
      } else {
        return this.engine.solve(this.displayName || 'GSS', this.merger, object, meta, this);
      }
    }
  };

  Domain.prototype.merger = function(object, meta, domain) {
    var async, path, value;
    if (domain == null) {
      domain = this;
    }
    async = false;
    for (path in object) {
      value = object[path];
      domain.set(void 0, path, value, meta);
    }
  };

  Domain.prototype.set = function(object, property, value, meta) {
    var old, path;
    this.setup();
    path = this.engine.getPath(object, property);
    old = this.values[path];
    if (old === value) {
      return;
    }
    if (this.changes) {
      this.changes[path] = value != null ? value : null;
    } else if (this.immediate) {
      this.solved.set(null, path, value);
    }
    if (value != null) {
      this.values[path] = value;
    } else {
      delete this.values[path];
    }
    if (this.updating) {
      this.engine.callback(this, path, value, meta);
    } else {
      this.engine.solve(this.displayName || 'GSS', function(domain) {
        return this.callback(domain, path, value, meta);
      }, this);
    }
    return value;
  };

  Domain.prototype.sanitize = function(exps, soft, parent, index) {
    var exp, i, prop, value, _i, _len;
    if (parent == null) {
      parent = exps.parent;
    }
    if (index == null) {
      index = exps.index;
    }
    if (exps[0] === 'value' && exps.operation) {
      return parent[index] = this.sanitize(exps.operation, soft, parent, index);
    }
    for (prop in exps) {
      if (!__hasProp.call(exps, prop)) continue;
      value = exps[prop];
      if (!isFinite(parseInt(prop))) {
        delete exps[prop];
      }
    }
    for (i = _i = 0, _len = exps.length; _i < _len; i = ++_i) {
      exp = exps[i];
      if (exp != null ? exp.push : void 0) {
        this.sanitize(exp, soft, exps, i);
      }
    }
    exps.parent = parent;
    exps.index = index;
    return exps;
  };

  Domain.prototype.orphanize = function(operation) {
    var arg, _i, _len;
    if (operation.domain) {
      delete operation.domain;
    }
    for (_i = 0, _len = operation.length; _i < _len; _i++) {
      arg = operation[_i];
      if (arg != null ? arg.push : void 0) {
        this.orphanize(arg);
      }
    }
    return operation;
  };

  Domain.prototype.callback = function(domain, path, value, meta) {
    var constraint, d, frame, index, op, root, url, values, variable, watcher, watchers, worker, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3;
    if (meta !== true) {
      if (watchers = (_ref = domain.watchers) != null ? _ref[path] : void 0) {
        for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 3) {
          watcher = watchers[index];
          if (!watcher) {
            break;
          }
          if (watcher.domain !== domain || (value == null)) {
            if (watcher.parent[watcher.index] !== watcher) {
              watcher.parent[watcher.index] = watcher;
            }
            root = this.getRootOperation(watcher, domain);
            if (value !== void 0) {
              this.update([this.sanitize(root)]);
            }
          } else {
            if (watcher.parent.domain === domain) {
              domain.solve(watcher.parent, watchers[index + 1], watchers[index + 2] || void 0, meta || void 0, watcher.index || void 0, value);
            } else {
              this.expressions.ascend(watcher, watchers[index + 1], value, watchers[index + 2], meta);
            }
          }
        }
      }
    }
    if (domain.immutable) {
      return;
    }
    if (this.workers) {
      _ref1 = this.workers;
      for (url in _ref1) {
        worker = _ref1[url];
        if (values = worker.values) {
          if (values.hasOwnProperty(path)) {
            if (value == null) {
              delete worker.values[path];
            }
            this.update(worker, [['value', value, path]]);
          }
        }
      }
    }
    if ((variable = this.variables[path]) && domain.priority > 0) {
      frame = void 0;
      if (variable.constraints) {
        _ref2 = variable.constraints;
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          constraint = _ref2[_j];
          if (frame = constraint.domain.frame) {
            break;
          }
        }
      }
      _ref3 = variable.operations;
      for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
        op = _ref3[_k];
        if (!watchers || watchers.indexOf(op) === -1) {
          if (value === null) {
            while (op.domain === domain) {
              op = op.parent;
            }
          }
          if (op && op.domain !== domain) {
            if (frame) {
              d = op.domain;
              op.domain = domain;
              domain.expressions.ascend(op, void 0, value, void 0, void 0, op.index);
              op.domain = d;
            } else {
              this.update(this.sanitize(this.getRootOperation(op)));
            }
          }
        }
      }
    }
  };

  Domain.prototype.toObject = function() {
    var object, property, value;
    object = {};
    for (property in this) {
      if (!__hasProp.call(this, property)) continue;
      value = this[property];
      if (property !== 'engine' && property !== 'observers' && property !== 'watchers' && property !== 'values') {
        object[property] = value;
      }
    }
    return object;
  };

  Domain.prototype.restruct = function() {
    var constraint, path, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    if (this.unconstrained) {
      _ref = this.unconstrained;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        constraint = _ref[_i];
        this.removeConstraint(constraint);
        _ref1 = constraint.paths;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          path = _ref1[_j];
          if (path.constraints) {
            if (!this.hasConstraint(path)) {
              this.nullify(path);
            }
          }
        }
      }
    }
    if (this.constrained) {
      _ref2 = this.constrained;
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        constraint = _ref2[_k];
        this.addConstraint(constraint);
      }
    }
    this.constrained = [];
    return this.unconstrained = void 0;
  };

  Domain.prototype.resuggest = function(a, b) {
    var index, result, sub, value, variable, _i, _len;
    if (typeof a === 'object') {
      if (typeof b !== 'object') {
        return;
      }
      if (a[0] === 'value' && b[0] === 'value') {
        if (a[3] !== b[3]) {
          return;
        }
        if (this.suggest && this.solver) {
          variable = a.parent.suggestions[a.index];
          if (variable.suggest !== b[1]) {
            this.suggest(a.parent.suggestions[a.index], b[1], 'require');
            return true;
          } else {
            return 'skip';
          }
        }
      } else {
        result = void 0;
        for (index = _i = 0, _len = a.length; _i < _len; index = ++_i) {
          value = a[index];
          sub = this.resuggest(value, b[index]);
          result || (result = sub);
        }
        return result;
      }
    }
  };

  Domain.prototype.compare = function(a, b) {
    var index, result, sub, value, _i, _len;
    if (typeof a === 'object') {
      if (typeof b !== 'object') {
        return;
      }
      if (a[0] === 'value' && b[0] === 'value') {
        if (a[3] !== b[3]) {
          return;
        }
      } else if (a[0] === 'value' && b.toString() === a[3]) {
        return 'similar';
      } else if (b[0] === 'value' && a.toString() === b[3]) {
        return 'similar';
      } else {
        result = void 0;
        for (index = _i = 0, _len = a.length; _i < _len; index = ++_i) {
          value = a[index];
          sub = this.compare(b[index], value);
          if (sub !== true || (result == null) || result === true) {
            result = sub != null ? sub : false;
          } else {
            result = false;
          }
        }
        if (b[a.length] !== a[a.length]) {
          return;
        }
        return result;
      }
    } else {
      if (typeof b === 'object') {
        return;
      }
      return a === b;
    }
    return true;
  };

  Domain.prototype.reconstrain = function(other, constraint) {
    var compared, suggested;
    if (!(other.operation && constraint.operation)) {
      return;
    }
    if (compared = this.compare(other.operation, constraint.operation)) {
      if (compared !== true || !(suggested = this.resuggest(other.operation, constraint.operation))) {
        this.unconstrain(other, void 0, 'reset');
      } else {
        return suggested !== 'skip';
      }
    }
  };

  Domain.prototype.constrain = function(constraint) {
    var bits, i, length, name, other, path, stack, suggest, _base, _i, _j, _k, _l, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4;
    if (constraint.paths) {
      stack = void 0;
      _ref = constraint.paths;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        path = _ref[_i];
        if (path[0] === 'value') {
          _ref1 = this.constraints;
          for (i = _j = _ref1.length - 1; _j >= 0; i = _j += -1) {
            other = _ref1[i];
            if (other !== constraint) {
              if (stack = this.reconstrain(other, constraint)) {
                break;
              }
            }
          }
        }
      }
      if (stack == null) {
        _ref2 = this.substituted;
        for (i = _k = _ref2.length - 1; _k >= 0; i = _k += -1) {
          other = _ref2[i];
          if (other !== constraint) {
            if (stack = this.reconstrain(other, constraint)) {
              break;
            }
          }
        }
      }
      if (stack) {
        return;
      }
      _ref3 = constraint.paths;
      for (_l = 0, _len1 = _ref3.length; _l < _len1; _l++) {
        path = _ref3[_l];
        if (typeof path === 'string') {
          ((_base = this.paths)[path] || (_base[path] = [])).push(constraint);
        } else if (path[0] === 'value') {
          if (path[3]) {
            bits = path[3].split(',');
            if (bits[0] === 'get') {
              (constraint.substitutions || (constraint.substitutions = {}))[this.getPath(bits[1], bits[2])] = path[1];
            }
          }
          this.substituted.push(constraint);
        } else if (this.isVariable(path)) {
          if (path.suggest !== void 0) {
            suggest = path.suggest;
            delete path.suggest;
            this.suggest(path, suggest, 'require');
          }
          length = (path.constraints || (path.constraints = [])).push(constraint);
        }
      }
    }
    if (typeof (name = constraint[0]) === 'string') {
      if ((_ref4 = this[constraint[0]]) != null) {
        _ref4.apply(this, Array.prototype.slice.call(constraint, 1));
      }
      return true;
    }
    constraint.domain = this;
    this.constraints.push(constraint);
    return (this.constrained || (this.constrained = [])).push(constraint);
  };

  Domain.prototype.hasConstraint = function(path) {
    var other, used, _i, _len, _ref;
    used = false;
    _ref = path.constraints;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      other = _ref[_i];
      if (this.constraints.indexOf(other) > -1) {
        used = true;
        break;
      }
    }
    return used;
  };

  Domain.prototype.unconstrain = function(constraint, continuation, moving) {
    var group, i, index, op, other, path, _i, _j, _k, _len, _ref, _ref1, _ref2;
    _ref = constraint.paths;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      path = _ref[_i];
      if (typeof path === 'string') {
        if (group = this.paths[path]) {
          for (index = _j = group.length - 1; _j >= 0; index = _j += -1) {
            other = group[index];
            if (other === constraint) {
              group.splice(index, 1);
            }
          }
          if (!group.length) {
            delete this.paths[path];
          }
        }
      } else if (path[0] === 'value') {
        this.substituted.splice(this.substituted.indexOf(constraint));
      } else {
        if (path.editing) {
          path.suggest = path.value;
          this.unedit(path);
        }
        index = path.constraints.indexOf(constraint);
        if (index > -1) {
          path.constraints.splice(index, 1);
        }
        if (!this.hasConstraint(path)) {
          this.undeclare(path, moving);
        }
        if (path.operations) {
          _ref1 = path.operations;
          for (index = _k = _ref1.length - 1; _k >= 0; index = _k += -1) {
            op = _ref1[index];
            while (op) {
              if (op === constraint.operation) {
                path.operations.splice(index, 1);
                break;
              }
              op = op.parent;
            }
          }
        }
      }
    }
    this.constraints.splice(this.constraints.indexOf(constraint), 1);
    if ((i = (_ref2 = this.constrained) != null ? _ref2.indexOf(constraint) : void 0) > -1) {
      return this.constrained.splice(i, 1);
    } else {
      return (this.unconstrained || (this.unconstrained = [])).push(constraint);
    }
  };

  Domain.prototype.declare = function(name, operation) {
    var ops, variable;
    if (name) {
      if (!(variable = this.variables[name])) {
        variable = this.variables[name] = this.variable(name);
      }
      if (this.nullified && this.nullified[name]) {
        delete this.nullified[name];
      }
      (this.added || (this.added = {}))[name] = variable;
      if (operation) {
        ops = variable.operations || (variable.operations = []);
        if (ops.indexOf(operation)) {
          ops.push(operation);
        }
      }
    } else {
      variable = this.variable('suggested_' + Math.random());
    }
    return variable;
  };

  Domain.prototype.unedit = function(variable) {
    var _ref;
    if (((_ref = variable.operation) != null ? _ref.parent.suggestions : void 0) != null) {
      delete variable.operation.parent.suggestions[variable.operation.index];
    }
    return delete variable.editing;
  };

  Domain.prototype.undeclare = function(variable, moving) {
    var _ref;
    if (moving !== 'reset') {
      (this.nullified || (this.nullified = {}))[variable.name] = variable;
      if ((_ref = this.added) != null ? _ref[variable.name] : void 0) {
        delete this.added[variable.name];
      }
    }
    if (!moving && this.values[variable.name] !== void 0) {
      delete this.variables[variable.name];
    }
    delete this.values[variable.name];
    this.nullify(variable);
    return this.unedit(variable);
  };

  Domain.prototype.reach = function(constraints, groups) {
    var constraint, group, groupped, other, variable, _i, _j, _k, _l, _len, _len1, _len2, _ref;
    groups || (groups = []);
    for (_i = 0, _len = constraints.length; _i < _len; _i++) {
      constraint = constraints[_i];
      groupped = void 0;
      if (constraint.paths) {
        for (_j = groups.length - 1; _j >= 0; _j += -1) {
          group = groups[_j];
          for (_k = 0, _len1 = group.length; _k < _len1; _k++) {
            other = group[_k];
            if (other.paths) {
              _ref = other.paths;
              for (_l = 0, _len2 = _ref.length; _l < _len2; _l++) {
                variable = _ref[_l];
                if (typeof variable !== 'string') {
                  if (constraint.paths.indexOf(variable) > -1) {
                    if (groupped && groupped !== group) {
                      groupped.push.apply(groupped, group);
                      groups.splice(groups.indexOf(group), 1);
                    } else {
                      groupped = group;
                    }
                    break;
                  }
                }
              }
            }
            if (groups.indexOf(group) === -1) {
              break;
            }
          }
        }
      }
      if (!groupped) {
        groups.push(groupped = []);
      }
      groupped.push(constraint);
    }
    return groups;
  };

  Domain.prototype.validate = function() {
    var arg, args, commands, constraint, equal, err, group, groups, i, index, message, ops, separated, shift, _i, _j, _k, _len, _len1, _len2;
    if (this.constrained || this.unconstrained) {
      groups = this.reach(this.constraints).sort(function(a, b) {
        var al, bl;
        al = a.length;
        bl = b.length;
        return bl - al;
      });
      separated = groups.splice(1);
      commands = [];
      if (separated.length) {
        shift = 0;
        for (index = _i = 0, _len = separated.length; _i < _len; index = ++_i) {
          group = separated[index];
          ops = [];
          for (index = _j = 0, _len1 = group.length; _j < _len1; index = ++_j) {
            constraint = group[index];
            this.unconstrain(constraint, void 0, true);
            if (constraint.operation) {
              ops.push(constraint.operation);
            }
          }
          if (ops.length) {
            commands.push(ops);
          }
        }
      }
      if (this.constraints.length === 0) {
        if ((index = this.engine.domains.indexOf(this)) > -1) {
          this.engine.domains.splice(index, 1);
        }
      }
      if (commands != null ? commands.length : void 0) {
        if (commands.length === 1) {
          commands = commands[0];
        }
        args = arguments;
        if (args.length === 1) {
          args = args[0];
        }
        if (commands.length === args.length) {
          equal = true;
          for (i = _k = 0, _len2 = args.length; _k < _len2; i = ++_k) {
            arg = args[i];
            if (commands.indexOf(arg) === -1) {
              equal = false;
              break;
            }
          }
          if (equal) {
            message = 'Trying to separate what was just added. Means loop.';
            err = new Error(message);
            throw err;
          }
        }
        return this.orphanize(commands);
      }
    }
  };

  Domain.prototype.apply = function(solution) {
    var path, result, value, variable, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
    result = {};
    for (path in solution) {
      value = solution[path];
      if (!((_ref = this.nullified) != null ? _ref[path] : void 0) && path.substring(0, 9) !== 'suggested') {
        result[path] = value;
      }
    }
    if (this.added) {
      _ref1 = this.added;
      for (path in _ref1) {
        variable = _ref1[path];
        value = (_ref2 = variable.value) != null ? _ref2 : 0;
        if (this.values[path] !== value) {
          if (result[path] == null) {
            result[path] = value;
          }
          this.values[path] = value;
        }
      }
      this.added = void 0;
    }
    if (this.nullified) {
      _ref3 = this.nullified;
      for (path in _ref3) {
        variable = _ref3[path];
        if (path.substring(0, 9) !== 'suggested') {
          result[path] = (_ref4 = (_ref5 = this.assumed.values[path]) != null ? _ref5 : (_ref6 = this.intrinsic) != null ? _ref6.values[path] : void 0) != null ? _ref4 : null;
        }
        this.nullify(variable);
      }
      this.nullified = void 0;
    }
    this.merge(result, true);
    return result;
  };

  Domain.prototype.remove = function() {
    var constraint, constraints, contd, observers, path, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1;
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      path = arguments[_i];
      _ref = this.getPossibleContinuations(path);
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        contd = _ref[_j];
        if (observers = this.observers[contd]) {
          while (observers[0]) {
            this.unwatch(observers[1], void 0, observers[0], contd, observers[2]);
          }
        }
      }
      if (constraints = this.paths[path]) {
        for (_k = constraints.length - 1; _k >= 0; _k += -1) {
          constraint = constraints[_k];
          if (this.isConstraint(constraint)) {
            this.unconstrain(constraint, path);
          }
        }
      }
      if (this.constrained) {
        _ref1 = this.constrained;
        for (_l = 0, _len2 = _ref1.length; _l < _len2; _l++) {
          constraint = _ref1[_l];
          if (constraint.indexOf(path) > -1) {
            this.unconstrain(constraint);
            break;
          }
        }
      }
    }
  };

  Domain.prototype.defer = function(reason) {
    var _this = this;
    if (this.solve.apply(this, arguments)) {
      return this.deferred != null ? this.deferred : this.deferred = Native.prototype.setImmediate(function() {
        _this.deferred = void 0;
        return _this.flush();
      }, 0);
    }
  };

  Domain.prototype["export"] = function() {
    var constraint, _i, _len, _ref, _results;
    _ref = this.constraints;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      constraint = _ref[_i];
      if (constraint.operation) {
        _results.push(constraint.operation);
      }
    }
    return _results;
  };

  Domain.prototype.maybe = function() {
    this.Maybe || (this.Maybe = Native.prototype.mixin(this, {
      MAYBE: this
    }));
    return new this.Maybe;
  };

  Domain.compile = function(domains, engine) {
    var EngineDomain, EngineDomainWrapper, domain, name, _base, _ref;
    for (name in domains) {
      if (!__hasProp.call(domains, name)) continue;
      domain = domains[name];
      if (((_ref = domain.condition) != null ? _ref.call(engine) : void 0) === false) {
        continue;
      }
      EngineDomain = engine[name] = function(object) {
        var Methods, Properties, property, value;
        if (object) {
          for (property in object) {
            value = object[property];
            if (!this.hasOwnProperty('values')) {
              this.values = {};
            }
            this.values[property] = value;
          }
        }
        this.domain = this;
        if (this.events !== engine.events) {
          this.addListeners(this.events);
          this.events = new (Native.prototype.mixin(this.engine.events));
        }
        if (this.Wrapper) {
          this.Wrapper.compile(this.Methods.prototype, this);
        }
        this.Method.compile(this.Methods.prototype, this);
        Methods = this.Methods;
        this.methods = new Methods;
        this.Property.compile(this.Properties.prototype, this);
        Properties = this.Properties;
        this.properties = new (Properties || Object);
        return Domain.prototype.constructor.call(this, engine);
      };
      EngineDomainWrapper = engine.mixin(engine, domain);
      EngineDomain.prototype = new EngineDomainWrapper;
      if (!domain.prototype.solve) {
        (_base = EngineDomain.prototype).solve || (_base.solve = Domain.prototype.solve);
      }
      EngineDomain.prototype.strategy = 'expressions';
      EngineDomain.prototype.displayName = name;
      EngineDomain.displayName = name;
      if (!engine.prototype) {
        engine[name.toLowerCase()] = new engine[name];
      }
    }
    return this;
  };

  Domain.prototype.DONE = 'solve';

  return Domain;

})();

Domain.prototype.Methods = (function() {
  function Methods() {}

  Methods.prototype.value = {
    command: function(operation, continuation, scope, meta, value, contd, hash, exported, scoped) {
      var uid, variable, _base, _base1, _base2, _name;
      if (this.suggest && this.solver) {
        variable = ((_base = operation.parent).suggestions || (_base.suggestions = {}))[operation.index];
        if (!variable) {
          (_base1 = Domain.prototype.Methods).uids || (_base1.uids = 0);
          uid = ++Domain.prototype.Methods.uids;
          variable = (_base2 = operation.parent.suggestions)[_name = operation.index] || (_base2[_name] = this.declare(null, operation));
          variable.suggest = value;
          variable.operation = operation;
          this.constrained || (this.constrained = []);
        }
        return variable;
      }
      if (!continuation && contd) {
        return this.expressions.solve(operation.parent, contd, this.identity.solve(scoped), meta, operation.index, value);
      }
      return value;
    }
  };

  Methods.prototype.framed = function(value) {
    return value;
  };

  return Methods;

})();

module.exports = Domain;
