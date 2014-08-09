/* Domain: Observed values
Acts as input values for equations.

Interface:

  - (un)watch() - (un)subscribe expression to property updates
  - set()       - dispatches updates to subscribed expressions
  - get()       - retrieve value
  - clean()     - detach observes by continuation


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
      if (!this.hasOwnProperty('variables')) {
        this.variables = {};
      }
      if (!this.hasOwnProperty('watchers')) {
        this.watchers = {};
      }
      if (!this.hasOwnProperty('observers')) {
        this.observers = {};
      }
      if (!this.hasOwnProperty('paths')) {
        this.paths = {};
      }
      if (!this.hasOwnProperty('values')) {
        this.values = {};
      }
      this.substituted = [];
      this.constraints = [];
      if (engine) {
        this.engine = engine;
      }
      if (name) {
        this.displayName = name;
      }
      if (url) {
        this.url = url;
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

  Domain.prototype.solve = function(args) {
    var object, result, strategy;
    if (!args) {
      return;
    }
    if (typeof args === 'object' && !args.push) {
      if (this.domain === this.engine) {
        return this.assumed.merge(args);
      } else {
        return this.merge(args);
      }
    } else if (strategy = this.strategy) {
      if ((object = this[strategy]).solve) {
        result = object.solve.apply(object, arguments);
      } else {
        result = this[strategy].apply(this, arguments);
      }
      return result;
    }
  };

  Domain.prototype.provide = function(solution, value) {
    if (solution instanceof Domain) {
      return this.merge(solution);
    } else if (this.domain) {
      return this.engine.engine.provide(solution);
    } else {
      return this.engine.provide(solution);
    }
    return true;
  };

  Domain.prototype.verify = function(scope, property, value) {
    property = this.engine.getPath(scope, property);
    scope = null;
    return this.invalidate(scope, property, value) || this.merge(scope, property, value) || this["import"](scope, property, value);
  };

  Domain.prototype.watch = function(object, property, operation, continuation, scope) {
    var observers, path, watchers, _base, _base1;
    path = this.engine.getPath(object, property);
    if (this.engine.indexOfTriplet(this.watchers[path], operation, continuation, scope) === -1) {
      observers = (_base = this.observers)[continuation] || (_base[continuation] = []);
      observers.push(operation, path, scope);
      watchers = (_base1 = this.watchers)[path] || (_base1[path] = []);
      watchers.push(operation, continuation, scope);
    }
    return this.get(path);
  };

  Domain.prototype.unwatch = function(object, property, operation, continuation, scope) {
    var index, observers, path, watchers;
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
      return delete this.watchers[path];
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
      return this.engine.solve(this.displayName || 'GSS', function(domain) {
        var async, path, value, watchers, _ref;
        async = false;
        for (path in object) {
          value = object[path];
          domain.set(void 0, path, value, meta, true);
          if (watchers = (_ref = domain.watchers) != null ? _ref[path] : void 0) {
            if (this.callback(domain, watchers, value, meta) == null) {
              async = true;
            }
          }
        }
        if (!async) {
          return true;
        }
      }, this);
    }
  };

  Domain.prototype.set = function(object, property, value, meta, silent) {
    var async, old, path, watchers, _ref;
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
    if (!silent) {
      async = false;
      if (watchers = (_ref = this.watchers) != null ? _ref[path] : void 0) {
        this.engine.solve(this.displayName || 'GSS', function(domain) {
          return this.callback(domain, watchers, value, meta);
        }, this);
      }
    }
    return value;
  };

  Domain.prototype.sanitize = function(exps, parent, index) {
    var exp, i, prop, value, _i, _len;
    if (parent == null) {
      parent = exps.parent;
    }
    if (index == null) {
      index = exps.index;
    }
    if (exps[0] === 'value' && exps.operation) {
      return parent[index] = this.sanitize(exps.operation, parent, index);
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
        this.sanitize(exp, exps, i);
      }
    }
    exps.parent = parent;
    exps.index = index;
    return exps;
  };

  Domain.prototype.callback = function(domain, watchers, value, meta) {
    var index, watcher, _i, _len;
    for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 3) {
      watcher = watchers[index];
      if (!watcher) {
        break;
      }
      if (watcher.domain !== domain || (value == null)) {
        this.Workflow(this.sanitize(this.getRootOperation(watcher)));
      } else {
        domain.solve(watcher.parent, watchers[index + 1], watchers[index + 2] || void 0, meta || void 0, watcher.index || void 0, value);
      }
    }
    return this;
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

  Domain.prototype.invalidate = function(scope, property, value) {
    var path;
    path = this.engine.getPath(scope, property);
    if (!this.variables[path]) {
      return;
    }
    if ((this.invalid || (this.invalid = [])).indexOf(path) === -1) {
      return this.invalid.push(path);
    }
  };

  Domain.prototype["import"] = function(scope, property, value) {
    var domain, path, _i, _len, _ref;
    if (!target) {
      _ref = this.domains;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        domain = _ref[_i];
        if (this.domain["import"](scope, property, target)) {
          return true;
        }
      }
      return false;
    }
    path = this.engine.getPath(scope, property);
    if (this.variables[path]) {
      return false;
    }
  };

  Domain.prototype.compare = function(a, b) {
    var index, value, _i, _len;
    if (typeof a === 'object') {
      if (typeof b !== 'object') {
        return;
      }
      if (a[0] === 'value' && b[0] === 'value') {
        if (a[3] !== b[3]) {
          return;
        }
      }
      if (a[0] === 'value') {
        return a[3] === b.toString();
      }
      if (b[0] === 'value') {
        return b[3] === a.toString();
      }
      for (index = _i = 0, _len = a.length; _i < _len; index = ++_i) {
        value = a[index];
        if (!this.compare(b[index], value)) {
          return;
        }
      }
      if (b[a.length] !== a[a.length]) {
        return;
      }
    } else {
      if (typeof b === 'object') {
        return;
      }
      if (a !== b) {
        return;
      }
    }
    return true;
  };

  Domain.prototype.constrain = function(constraint) {
    var length, matched, name, other, path, _base, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _ref4;
    if (constraint.paths) {
      matched = void 0;
      _ref = constraint.paths;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        path = _ref[_i];
        if (path[0] === 'value' && !matched) {
          matched = true;
          _ref1 = this.constraints;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            other = _ref1[_j];
            if (this.compare(other.operation, constraint.operation)) {
              console.info('updating constraint', other.operation, '->', constraint.operation);
              this.unconstrain(other);
            }
          }
        }
      }
      matched = void 0;
      _ref2 = this.substituted;
      for (_k = _ref2.length - 1; _k >= 0; _k += -1) {
        other = _ref2[_k];
        if (this.compare(other.operation, constraint.operation)) {
          console.info('updating constraint', other.operation, '->', constraint.operation);
          this.unconstrain(other);
        }
      }
      _ref3 = constraint.paths;
      for (_l = 0, _len2 = _ref3.length; _l < _len2; _l++) {
        path = _ref3[_l];
        if (typeof path === 'string') {
          ((_base = this.paths)[path] || (_base[path] = [])).push(constraint);
        } else if (path[0] === 'value') {
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
    var group, index, path, _i, _len, _ref;
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
      }
    }
    return this.constraints.splice(this.constraints.indexOf(constraint), 1);
  };

  Domain.prototype.declare = function(name, value) {
    var _base;
    return (_base = this.variables)[name] || (_base[name] = value != null ? value : this.variable(name));
  };

  Domain.prototype.undeclare = function(variable) {
    return delete this.variables[variable.name];
  };

  Domain.prototype.remove = function() {
    var constrain, constraints, contd, observers, path, _i, _j, _k, _len, _len1, _ref;
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      path = arguments[_i];
      _ref = this.getPossibleContinuations(continuation);
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        contd = _ref[_j];
        if (observers = this.observers[contd]) {
          while (observers[0]) {
            this.unwatch(observers[1], void 0, observers[0], contd, observers[2]);
          }
        }
      }
      if (constraints = this.variables[path]) {
        for (_k = constraints.length - 1; _k >= 0; _k += -1) {
          constrain = constraints[_k];
          if (this.isConstraint(constraint)) {
            this.unconstraint(constraint, path);
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
              this.values = [];
            }
            this.values[property] = value;
          }
        }
        this.domain = this;
        this.variables = new (Native.prototype.mixin(this.engine.variables));
        if (this.events !== engine.events) {
          this.addListeners(this.events);
          this.events = new (Native.prototype.mixin(this.engine.events));
        }
        if (this.Methods !== engine.Methods) {
          if (this.Wrapper) {
            this.Wrapper.compile(this.Methods.prototype, this);
          }
          this.Method.compile(this.Methods.prototype, this);
          Methods = this.Methods;
        }
        this.methods = new (Native.prototype.mixin(this.engine.methods, Methods));
        if (this.Properties !== engine.Properties) {
          this.Property.compile(this.Properties.prototype, this);
          Properties = this.Properties;
        }
        this.properties = new (Native.prototype.mixin(this.engine.properties, Properties));
        this.expressions = new this.Expressions(this);
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

module.exports = Domain;
