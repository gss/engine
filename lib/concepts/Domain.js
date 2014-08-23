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
        if (this.url = this.getWorkerURL(this.url)) {
          if (engine !== this) {
            this.useWorker(this.url);
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
    var object, result, strategy;
    if (!args) {
      return;
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
        result = object.solve.apply(object, arguments);
      } else {
        result = this[strategy].apply(this, arguments);
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
        }
      }
    }
    return this.get(path);
  };

  Domain.prototype.unwatch = function(object, property, operation, continuation, scope) {
    var id, index, j, obj, observers, path, prop, watchers, _base;
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
          return delete obj[prop];
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
      if (this.workflow) {
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
    if (value != null) {
      this.values[path] = value;
    } else {
      delete this.values[path];
    }
    if (this.workflow) {
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
      if (exp.push) {
        this.sanitize(exp, soft, exps, i);
      }
    }
    exps.parent = parent;
    exps.index = index;
    return exps;
  };

  Domain.prototype.orphanize = function(operation) {
    var arg, _i, _len;
    if (operation[2] === 'big') {
      debugger;
    }
    if (operation.domain) {
      delete operation.domain;
    }
    for (_i = 0, _len = operation.length; _i < _len; _i++) {
      arg = operation[_i];
      if (arg.push) {
        this.orphanize(arg);
      }
    }
    return operation;
  };

  Domain.prototype.callback = function(domain, path, value, meta) {
    var exports, index, op, url, values, variable, watcher, watchers, worker, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _ref4;
    if (watchers = (_ref = domain.watchers) != null ? _ref[path] : void 0) {
      for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 3) {
        watcher = watchers[index];
        if (!watcher) {
          break;
        }
        if (watcher.domain !== domain || (value == null)) {
          this.Workflow(this.sanitize(this.getRootOperation(watcher)));
        } else {
          if (watcher.parent.domain === domain) {
            domain.solve(watcher.parent, watchers[index + 1], watchers[index + 2] || void 0, meta || void 0, watcher.index || void 0, value);
          } else {
            this.expressions.ascend(watcher, watchers[index + 1], value, watchers[index + 2], meta);
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
            this.Workflow(worker, [['value', value, path]]);
            console.error(path, this.workflow);
          }
        }
      }
    }
    if (exports = (_ref2 = this.workflow) != null ? (_ref3 = _ref2.exports) != null ? _ref3[path] : void 0 : void 0) {
      for (_j = 0, _len1 = exports.length; _j < _len1; _j++) {
        domain = exports[_j];
        this.Workflow(domain, [['value', value, path]]);
      }
    }
    if (variable = this.variables[path]) {
      _ref4 = variable.operations;
      for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
        op = _ref4[_k];
        if (!watchers || watchers.indexOf(op) === -1) {
          if (value === null) {
            while (op.domain === this) {
              op = op.parent;
            }
          }
          this.Workflow(this.sanitize(this.getRootOperation(op)));
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

  Domain.prototype.compare = function(a, b, mutate) {
    var index, value, _i, _len;
    if (a !== b) {
      if (typeof a === 'object') {
        if (typeof b !== 'object') {
          return;
        }
        if (a[0] === 'value' && b[0] === 'value') {
          if (a[3] !== b[3]) {
            return;
          }
        } else if (a[0] === 'value') {
          return a[3] === b.toString();
        } else if (b[0] === 'value') {
          return b[3] === a.toString();
        } else {
          for (index = _i = 0, _len = a.length; _i < _len; index = ++_i) {
            value = a[index];
            if (!this.compare(b[index], value)) {
              return;
            }
          }
          if (b[a.length] !== a[a.length]) {
            return;
          }
        }
      } else {
        if (typeof b === 'object') {
          return;
        }
      }
    }
    return true;
  };

  Domain.prototype.reconstrain = function(other, constraint) {
    if (this.compare(other.operation, constraint.operation)) {
      console.info('updating constraint', other.operation, '->', constraint.operation);
      return this.unconstrain(other);
    }
  };

  Domain.prototype.constrain = function(constraint) {
    var bits, length, name, other, path, _base, _i, _j, _k, _l, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4;
    console.info(constraint, JSON.stringify(constraint.operation), this.constraints, constraint.paths, this.substituted);
    if (constraint.paths) {
      _ref = constraint.paths;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        path = _ref[_i];
        if (path[0] === 'value') {
          _ref1 = this.constraints;
          for (_j = _ref1.length - 1; _j >= 0; _j += -1) {
            other = _ref1[_j];
            this.reconstrain(other, constraint);
          }
        }
      }
      _ref2 = this.substituted;
      for (_k = _ref2.length - 1; _k >= 0; _k += -1) {
        other = _ref2[_k];
        this.reconstrain(other, constraint);
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
        } else if (path.name) {
          length = (path.constraints || (path.constraints = [])).push(constraint);
          if (length === 1) {
            if (this.nullified && this.nullified[path.name]) {
              delete this.nullified[path.name];
            } else {
              (this.added || (this.added = {}))[path.name] = 0;
            }
          }
        }
      }
    }
    if (typeof (name = constraint[0]) === 'string') {
      if ((_ref4 = this[constraint[0]]) != null) {
        _ref4.apply(this, Array.prototype.slice.call(constraint, 1));
      }
      return true;
    }
    this.constraints.push(constraint);
    this.constrained = true;
  };

  Domain.prototype.unconstrain = function(constraint, continuation) {
    var group, index, op, path, _i, _j, _len, _ref, _ref1;
    _ref = constraint.paths;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      path = _ref[_i];
      if (typeof path === 'string') {
        if (group = this.paths[path]) {
          if ((index = group.indexOf(constraint)) > -1) {
            group.splice(index, 1);
          }
          if (!group.length) {
            delete this.paths[path];
          }
        }
      } else if (path[0] === 'value') {
        this.substituted.splice(this.substituted.indexOf(constraint));
      } else {
        index = path.constraints.indexOf(constraint);
        if (index > -1) {
          path.constraints.splice(index, 1);
          if (!path.constraints.length) {
            this.undeclare(path);
          }
        }
        console.error('unconstraint', path.name, this.clone(path.operations));
        if (this.solver._externalParametricVars.storage.length) {
          debugger;
        }
        if (path.operations) {
          _ref1 = path.operations;
          for (index = _j = _ref1.length - 1; _j >= 0; index = _j += -1) {
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
    this.constrained = true;
    this.constraints.splice(this.constraints.indexOf(constraint), 1);
  };

  Domain.prototype.declare = function(name, operation) {
    var ops, variable, _base;
    variable = (_base = this.variables)[name] || (_base[name] = typeof value !== "undefined" && value !== null ? value : this.variable(name));
    if (operation) {
      ops = variable.operations || (variable.operations = []);
      if (ops.indexOf(operation)) {
        ops.push(operation);
      }
    }
    console.log(this.added, variable, 999999999);
    return variable;
  };

  Domain.prototype.undeclare = function(variable) {
    delete this.variables[variable.name];
    console.log(this.added, variable, 9989078);
    (this.nullified || (this.nullified = {}))[variable.name] = true;
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
            _ref = other.paths;
            for (_l = 0, _len2 = _ref.length; _l < _len2; _l++) {
              variable = _ref[_l];
              if (typeof variable !== 'string') {
                if (constraint.paths.indexOf(variable) > -1) {
                  if (groupped && groupped !== group) {
                    groupped.push.apply(groupped, group);
                    groups.splice(group.indexOf(group), 1);
                  } else {
                    groupped = group;
                  }
                  break;
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

  Domain.prototype.apply = function(solution) {
    var constraint, group, groups, index, path, result, separated, value, _base, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
    if (this.constrained) {
      groups = this.reach(this.constraints).sort(function(a, b) {
        var al, bl;
        al = a.length;
        bl = b.length;
        return bl - al;
      });
      console.error(this.constraints.slice(), groups.slice(), '!!!!!!!!!!!!!!!!!!!!', solution);
      separated = groups.splice(1);
      if (separated.length) {
        for (_i = 0, _len = separated.length; _i < _len; _i++) {
          group = separated[_i];
          for (index = _j = 0, _len1 = group.length; _j < _len1; index = ++_j) {
            constraint = group[index];
            debugger;
            this.unconstrain(constraint);
            group[index] = constraint.operation;
          }
        }
      }
      if (this.constraints.length === 0) {
        if ((index = this.engine.domains.indexOf(this)) > -1) {
          this.engine.domains.splice(index, 1);
        }
      }
    }
    this.constrained = void 0;
    result = {};
    console.log(this.constrained, this.nullified, this.added);
    for (path in solution) {
      value = solution[path];
      if (!((_ref = this.nullified) != null ? _ref[path] : void 0)) {
        result[path] = value;
        this.values[path] = value;
      }
    }
    if (this.nullified) {
      for (path in this.nullified) {
        result[path] = (_ref1 = (_ref2 = this.assumed.values[path]) != null ? _ref2 : (_ref3 = this.intrinsic) != null ? _ref3.values[path] : void 0) != null ? _ref1 : null;
        if (this.values.hasOwnProperty(path)) {
          delete this.values[path];
        }
      }
      this.nullified = void 0;
    }
    if (this.added) {
      for (path in this.added) {
        if (result[path] == null) {
          result[path] = 0;
        }
        if ((_base = this.values)[path] == null) {
          _base[path] = 0;
        }
      }
      this.added = void 0;
    }
    if (separated != null ? separated.length : void 0) {
      if (separated.length === 1) {
        separated = separated[0];
      }
      this.engine.provide(this.orphanize(separated));
    }
    if (this.values.big === 0) {
      debugger;
    }
    console.log('provide', result);
    return result;
  };

  Domain.prototype.remove = function() {
    var constraint, constraints, contd, observers, path, _i, _j, _k, _len, _len1, _ref;
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
          } else if (this.isVariable(constraint)) {
            this.undeclare(constraint);
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
      _results.push(constraint.operation);
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
    var EngineDomain, EngineDomainWrapper, domain, name, _base;
    for (name in domains) {
      if (!__hasProp.call(domains, name)) continue;
      domain = domains[name];
      if ((typeof domain.condition === "function" ? domain.condition() : void 0) === false) {
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
        this.properties = Properties && (new Properties) || {};
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

  Methods.prototype.value = function(value) {
    return value;
  };

  Methods.prototype.framed = function(value) {
    return value;
  };

  return Methods;

})();

module.exports = Domain;
