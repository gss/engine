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

var Domain, Trigger,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Trigger = require('./Trigger');

Domain = (function(_super) {
  __extends(Domain, _super);

  Domain.prototype.priority = 0;

  Domain.prototype.strategy = void 0;

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
      this.signatures = new this.Signatures(this);
      if (values) {
        this.merge(values);
      }
      Domain.__super__.constructor.apply(this, arguments);
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

  Domain.prototype.setup = function() {
    if (!this.hasOwnProperty('values')) {
      this.values = {};
      if (this.MAYBE) {
        this.Operation || (this.Operation = new this.Operation.constructor(this));
        this.paths = {};
        this.domains.push(this);
        return this.MAYBE = void 0;
      } else {
        this.watchers = {};
        this.observers = {};
        if (this.structured) {
          return this.objects = {};
        }
      }
    }
  };

  Domain.prototype.unbypass = function(path, result) {
    var bypasser, bypassers, key, _base, _i, _len;
    if (bypassers = this.bypassers[path]) {
      for (_i = 0, _len = bypassers.length; _i < _len; _i++) {
        bypasser = bypassers[_i];
        for (key in bypasser.variables) {
          delete this.variables[key];
          if (this.updating.index > -1) {
            (result = (_base = this.updating).effects || (_base.effects = {}))[key] = null;
          } else {
            result = {};
            result[key] = null;
            this.updating.apply(result);
          }
          break;
        }
      }
      delete this.bypassers[path];
    }
    return result;
  };

  Domain.prototype.bypass = function(name, operation, continuation, scope) {
    var parent, result, value, variable, _base, _name, _ref;
    variable = operation.variables[name];
    parent = variable;
    while (parent !== operation[1]) {
      if (!parent) {
        break;
      }
      parent = parent.parent;
    }
    value = parent === operation[1] && operation[2] || operation[1];
    if (typeof value !== 'number') {
      value = value.command.solve(this, value, continuation, scope);
      if (typeof value !== 'number') {
        return;
      }
    }
    result = {};
    result[name] = value;
    if (!this.variables[name] || ((_ref = this.variables[name].constraints) != null ? _ref.length : void 0) === 0) {
      ((_base = this.bypassers)[_name = scope.key] || (_base[_name] = [])).push(operation);
      this.variables[name] = scope.key;
    }
    return result;
  };

  Domain.prototype.solve = function(operation, continuation, scope, ascender, ascending) {
    var commands, commited, object, result, strategy, transacting, _ref;
    transacting = this.transact();
    if (typeof operation === 'object' && !operation.push) {
      if (this.domain === this.engine) {
        this.assumed.merge(operation);
      } else {
        this.merge(operation);
      }
    } else if (strategy = this.strategy) {
      if ((object = this[strategy]).solve) {
        result = object.solve.apply(object, arguments) || {};
      } else {
        result = this[strategy].apply(this, arguments);
      }
    } else {
      result = this.Command(operation).solve(this, operation, continuation || '', scope || this.scope, ascender, ascending);
    }
    if (this.constrained || this.unconstrained) {
      commands = this.validate.apply(this, arguments);
      this.restruct();
      if (commands === false) {
        if (transacting) {
          return this.commit();
        }
        return;
      }
    }
    if (typeof result !== 'object') {
      if (result = (_ref = this.perform) != null ? _ref.apply(this, arguments) : void 0) {
        result = this.apply(result);
      }
    }
    if (commands) {
      this.engine["yield"](commands);
    }
    if (transacting) {
      commited = this.commit();
    }
    return result || commited;
  };

  Domain.prototype["yield"] = function(solution, value) {
    if (solution instanceof Domain) {
      return this.merge(solution);
    } else if (this.domain) {
      this.engine.engine["yield"](solution);
      return;
    } else {
      this.engine["yield"](solution);
      return;
    }
    return true;
  };

  Domain.prototype.transact = function() {
    var _ref;
    this.setup();
    if (!(this.changes && this.hasOwnProperty('changes'))) {
      this.changes = {};
      if (this.disconnected) {
        return (_ref = this.mutations) != null ? _ref.disconnect(true) : void 0;
      }
    }
  };

  Domain.prototype.commit = function() {
    var changes;
    changes = this.changes;
    this.changes = void 0;
    return changes;
  };

  Domain.prototype.watch = function(object, property, operation, continuation, scope) {
    var id, j, obj, observers, path, prop, watchers, _base, _base1, _base2;
    this.setup();
    path = this.getPath(object, property);
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
    path = this.getPath(object, property);
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
          if (this.updating) {
            this.transact();
            this.changes[path] = null;
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
    return this.values[this.getPath(object, property)];
  };

  Domain.prototype.merge = function(object) {
    if (object && !object.push) {
      if (object instanceof Domain) {
        return;
      }
      if (this.updating) {
        return this.merger(object);
      } else {
        return this.engine.solve(this.displayName || 'GSS', this.merger, object, this);
      }
    }
  };

  Domain.prototype.merger = function(object, domain) {
    var async, path, transacting, value;
    if (domain == null) {
      domain = this;
    }
    transacting = domain.transact();
    async = false;
    for (path in object) {
      value = object[path];
      domain.set(void 0, path, value);
    }
    if (transacting) {
      return domain.commit();
    }
  };

  Domain.prototype.set = function(object, property, value) {
    var old, path;
    path = this.getPath(object, property);
    old = this.values[path];
    if (old === value) {
      return;
    }
    if (this.updating) {
      this.transact();
      this.changes[path] = value != null ? value : null;
    }
    if (value != null) {
      this.values[path] = value;
    } else {
      delete this.values[path];
    }
    if (this.updating) {
      this.callback(path, value);
    } else {
      this.engine.solve(this.displayName || 'GSS', function(domain) {
        return domain.callback(path, value);
      }, this);
    }
    return value;
  };

  Domain.prototype.callback = function(path, value) {
    var index, url, values, watcher, watchers, worker, _i, _len, _ref, _ref1;
    if (watchers = (_ref = this.watchers) != null ? _ref[path] : void 0) {
      for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 3) {
        watcher = watchers[index];
        if (!watcher) {
          break;
        }
        watcher.command.ascend(this, watcher, watchers[index + 1], value, watchers[index + 2]);
      }
    }
    if (this.immutable) {
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
    /*
    if (variable = @variables[path])
      frame = undefined
      if variable.constraints
        for constraint in variable.constraints
          if frame = constraint.operation.domain.frame
            break
      for constraint in variable.constraints
        if watcher = constraint.operation
          if (variable = watcher.variables[path])?.domain == @
            debugger
            if true#!watchers || watchers.indexOf(variable) == -1
              if op = @Operation.ascend(watcher)
                if (first = op[0]) && !first.push
                  (first.values ||= {})[path] = value
                @engine.update([op.domain], [op])
    */

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
    var constraint, path, variable, _i, _j, _len, _len1, _ref, _ref1;
    if (this.unconstrained) {
      _ref = this.unconstrained;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        constraint = _ref[_i];
        this.removeConstraint(constraint);
        for (path in constraint.operation.variables) {
          if (variable = this.variables[path]) {
            if (!this.hasConstraint(variable)) {
              this.nullify(variable);
            }
          }
        }
      }
    }
    if (this.constrained) {
      _ref1 = this.constrained;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        constraint = _ref1[_j];
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

  Domain.prototype.constrain = function(constraint, operation, meta) {
    var op, path, suggest, variable, _base, _base1, _name, _ref;
    constraint.operation = operation;
    constraint.path = meta.key;
    ((_base = this.paths)[_name = constraint.path] || (_base[_name] = [])).push(constraint);
    _ref = operation.variables;
    for (path in _ref) {
      op = _ref[path];
      if (variable = op.command) {
        if (variable.suggest !== void 0) {
          suggest = variable.suggest;
          delete variable.suggest;
          this.suggest(variable, suggest, 'require');
        }
      }
      ((_base1 = this.variables[path]).constraints || (_base1.constraints = [])).push(constraint);
    }
    (this.constraints || (this.constraints = [])).push(constraint);
    return (this.constrained || (this.constrained = [])).push(constraint);
  };

  Domain.prototype.hasConstraint = function(variable) {
    var other, _i, _len, _ref;
    _ref = variable.constraints;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      other = _ref[_i];
      if (this.constraints.indexOf(other) > -1) {
        return true;
      }
    }
  };

  Domain.prototype.unconstrain = function(constraint, continuation, moving) {
    var group, i, object, op, path, variable, _ref, _ref1;
    this.constraints.splice(this.constraints.indexOf(constraint), 1);
    group = this.paths[constraint.path];
    group.splice(group.indexOf(constraint, 1));
    if (group.length === 0) {
      delete this.paths[constraint.path];
    }
    _ref = constraint.operation.variables;
    for (path in _ref) {
      op = _ref[path];
      if (variable = op.command) {
        if (variable.editing) {
          variable.suggest = variable.value;
          this.unedit(path);
        }
      }
      object = this.variables[path];
      object.constraints.splice(object.constraints.indexOf(constraint), 1);
      if (!this.hasConstraint(object)) {
        this.undeclare(object, moving);
      }
    }
    if ((i = (_ref1 = this.constrained) != null ? _ref1.indexOf(constraint) : void 0) > -1) {
      return this.constrained.splice(i, 1);
    } else {
      return (this.unconstrained || (this.unconstrained = [])).push(constraint);
    }
  };

  Domain.prototype.declare = function(name) {
    var variable;
    if (name) {
      if (!(variable = this.variables[name])) {
        variable = this.variables[name] = this.variable(name);
      }
      if (this.nullified && this.nullified[name]) {
        delete this.nullified[name];
      }
      (this.added || (this.added = {}))[name] = variable;
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
    var constraint, group, groupped, other, others, path, vars, _i, _j, _k, _len, _len1;
    groups || (groups = []);
    for (_i = 0, _len = constraints.length; _i < _len; _i++) {
      constraint = constraints[_i];
      groupped = void 0;
      vars = constraint.operation.variables;
      for (_j = groups.length - 1; _j >= 0; _j += -1) {
        group = groups[_j];
        for (_k = 0, _len1 = group.length; _k < _len1; _k++) {
          other = group[_k];
          others = other.operation.variables;
          for (path in vars) {
            if (others[path]) {
              if (groupped && groupped !== group) {
                groupped.push.apply(groupped, group);
                groups.splice(groups.indexOf(group), 1);
              } else {
                groupped = group;
              }
              break;
            }
          }
          if (groups.indexOf(group) === -1) {
            break;
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
    var arg, args, commands, constraint, equal, group, groups, i, index, ops, separated, shift, _i, _j, _k, _len, _len1, _len2;
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
            throw new Error('Trying to separate what was just added. Means loop. ');
          }
        }
        return this.Operation.orphanize(commands);
      }
    }
  };

  Domain.prototype.apply = function(solution) {
    var index, path, result, value, variable, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
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
    if (((_ref7 = this.constraints) != null ? _ref7.length : void 0) === 0) {
      if ((index = this.engine.domains.indexOf(this)) > -1) {
        this.engine.domains.splice(index, 1);
      }
    }
    return result;
  };

  Domain.prototype.remove = function() {
    var constraint, constraints, contd, observer, path, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1, _ref2;
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      path = arguments[_i];
      if (this.observers) {
        _ref = this.Continuation.getVariants(path);
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          contd = _ref[_j];
          if (observer = this.observers[contd]) {
            while (observer[0]) {
              this.unwatch(observer[1], void 0, observer[0], contd, observer[2]);
            }
          }
        }
      }
      if (constraints = (_ref1 = this.paths) != null ? _ref1[path] : void 0) {
        for (_k = constraints.length - 1; _k >= 0; _k += -1) {
          constraint = constraints[_k];
          this.unconstrain(constraint, path);
        }
      }
      if (this.constrained) {
        _ref2 = this.constrained;
        for (_l = 0, _len2 = _ref2.length; _l < _len2; _l++) {
          constraint = _ref2[_l];
          if (constraint.path === path) {
            this.unconstrain(constraint);
            break;
          }
        }
      }
    }
  };

  Domain.prototype["export"] = function() {
    var constraint, _i, _len, _ref, _results;
    if (this.constraints) {
      _ref = this.constraints;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        constraint = _ref[_i];
        if (constraint.operation) {
          _results.push(constraint.operation);
        }
      }
      return _results;
    }
  };

  Domain.prototype.maybe = function() {
    var Base;
    if (!this.Maybe) {
      Base = function() {};
      Base.prototype = this;
      this.Maybe = function() {};
      this.Maybe.prototype = new Base;
      this.Maybe.prototype.MAYBE = this;
    }
    return new this.Maybe;
  };

  Domain.prototype.getPath = function(id, property) {
    if (!property) {
      property = id;
      id = void 0;
    }
    if (property.indexOf('[') > -1 || !id) {
      return property;
    } else {
      if (typeof id !== 'string') {
        if (id.nodeType) {
          id = this.identity["yield"](id);
        } else {
          id = id.path;
        }
      }
      return id + '[' + property + ']';
    }
  };

  Domain.prototype.getVariableDomain = function(engine, operation, force, quick) {
    var constraint, d, domain, i, index, intrinsic, path, prefix, property, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    if (operation.domain && !force) {
      return operation.domain;
    }
    path = operation[1];
    if ((i = path.indexOf('[')) > -1) {
      property = path.substring(i + 1, path.length - 1);
    }
    intrinsic = engine.intrinsic;
    if (property && ((intrinsic != null ? intrinsic.properties[path] : void 0) != null)) {
      domain = intrinsic;
    } else if (property && (intrinsic != null ? intrinsic.properties[property] : void 0) && !intrinsic.properties[property].matcher) {
      domain = intrinsic;
    } else {
      _ref = engine.domains;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        d = _ref[_i];
        if (d.values.hasOwnProperty(path) && (d.priority >= 0 || d.variables[path]) && d.displayName !== 'Solved') {
          domain = d;
          break;
        }
        if (d.substituted) {
          _ref1 = d.substituted;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            constraint = _ref1[_j];
            if ((_ref2 = constraint.substitutions) != null ? _ref2[path] : void 0) {
              domain = d;
              break;
            }
          }
        }
      }
    }
    if (!domain) {
      if (property && (index = property.indexOf('-')) > -1) {
        prefix = property.substring(0, index);
        if ((domain = engine[prefix])) {
          if (!(domain instanceof engine.Domain)) {
            domain = void 0;
          }
        }
      }
      if (!domain) {
        if (!quick) {
          domain = this.engine.linear.maybe();
        }
      }
    }
    return domain;
  };

  Domain.compile = function(domains, engine) {
    var EngineDomain, EngineDomainWrapper, domain, name, property, value, _base, _ref, _ref1;
    for (name in domains) {
      if (!__hasProp.call(domains, name)) continue;
      domain = domains[name];
      if (((_ref = domain.condition) != null ? _ref.call(engine) : void 0) === false) {
        continue;
      }
      EngineDomain = engine[name] = function(object) {
        var Properties, events, property, value, _ref1, _ref2;
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
          events = {};
          _ref1 = this.engine.events;
          for (property in _ref1) {
            value = _ref1[property];
            events[property] = value;
          }
          _ref2 = this.events;
          for (property in _ref2) {
            value = _ref2[property];
            events[property] = value;
          }
          this.events = events;
        }
        this.Property.compile(this.Properties.prototype, this);
        Properties = this.Properties;
        this.properties = new (Properties || Object);
        return domain.prototype.constructor.call(this, engine);
      };
      EngineDomainWrapper = function() {};
      EngineDomainWrapper.prototype = engine;
      EngineDomain.prototype = new EngineDomainWrapper;
      _ref1 = domain.prototype;
      for (property in _ref1) {
        value = _ref1[property];
        EngineDomain.prototype[property] = value;
      }
      if (!domain.prototype.solve) {
        (_base = EngineDomain.prototype).solve || (_base.solve = Domain.prototype.solve);
      }
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

})(Trigger);

module.exports = Domain;
