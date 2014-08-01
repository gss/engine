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
  Domain.prototype.priority = -Infinity;

  function Domain(engine, values, name) {
    var cmd, declaration, domain, index, path, prefix, property, scope, variable, _ref;
    if (!engine || engine instanceof Domain) {
      this.variables = this.engine && new (Native.prototype.mixin(this.engine.variables)) || {};
      this.watchers = this.engine && new (Native.prototype.mixin(this.engine.watchers)) || {};
      this.observers = this.engine && new (Native.prototype.mixin(this.engine.observers)) || {};
      if (engine) {
        this.engine = engine;
      }
      if (name) {
        this.displayName = name;
      }
      if (values) {
        this.merge(values);
      }
      return this;
    } else {
      if (engine.push) {
        if (engine.domain) {
          return engine.domain;
        }
        _ref = variable = engine, cmd = _ref[0], scope = _ref[1], property = _ref[2];
      } else {
        scope = arguments[0], property = arguments[1];
      }
      path = this.getPath(scope, property);
      if (declaration = this.variables[path]) {
        domain = declaration.domain;
      } else {
        if ((index = property.indexOf('-')) > -1) {
          prefix = property.substring(0, index);
          if ((domain = this[prefix])) {
            if (!(domain instanceof Domain)) {
              domain = void 0;
            }
          }
        }
        if (!domain) {
          if (this.assumed.hasOwnProperty(path)) {
            domain = this.assumed;
          } else {
            domain = this.linear;
          }
        }
      }
      if (variable) {
        variable.domain = domain;
      }
      return domain;
    }
  }

  Domain.prototype.strategy = 'substitute';

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

  Domain.prototype.substitute = function(expression, parent) {
    var exp, index, path, replaced, substituted, _i, _len;
    substituted = expression;
    for (index = _i = 0, _len = expression.length; _i < _len; index = ++_i) {
      exp = expression[index];
      if (exp.push) {
        replaced = this.substitute(exp, parent);
        if (replaced !== exp) {
          if (substituted === expression) {
            substituted = expression.slice(0);
            if (expression.domain) {
              substituted.domain = expression.domain;
            }
          }
          substituted[index] = replaced;
        }
      }
    }
    if (substituted[0] === 'get' && substituted.domain === this) {
      path = this.engine.getPath(substituted[1], substituted[2]);
      this.engine.console.row('vary', path, this[path]);
      substituted = ['vary', this[path]];
      substituted.domain = expression.domain;
      substituted.domain.watch(null, path, substituted);
    }
    return substituted;
  };

  Domain.prototype.provide = function(solution, value) {
    if (solution instanceof Domain) {
      return this.merge(solution);
    } else {
      if (this.domain) {
        return this.engine.provide.call(this, solution);
      } else {
        return this.engine.provide(solution);
      }
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
    return this[this.engine.getPath(object, property)];
  };

  Domain.prototype.merge = function(object) {
    if (object && !object.push) {
      if (object instanceof Domain) {
        return object;
      }
      this.engine.solve(this.displayName, function(domain) {
        var path, value, _results;
        _results = [];
        for (path in object) {
          value = object[path];
          _results.push(domain.set(void 0, path, value));
        }
        return _results;
      }, this);
    }
  };

  Domain.prototype.set = function(object, property, value, meta) {
    var old, path, watchers, _ref;
    path = this.engine.getPath(object, property);
    old = this[path];
    if (old === value) {
      return;
    }
    if (value != null) {
      this[path] = value;
    } else {
      delete this[path];
    }
    if (watchers = (_ref = this.watchers) != null ? _ref[path] : void 0) {
      this.engine.solve(this.displayName, path, function() {
        var index, watcher, _i, _len, _results;
        _results = [];
        for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 3) {
          watcher = watchers[index];
          if (!watcher) {
            break;
          }
          _results.push(this.provide(watcher.parent, watchers[index + 1], watchers[index + 2], meta, watcher.index, value));
        }
        return _results;
      });
    }
    return value;
  };

  Domain.prototype.toObject = function() {
    var object, property, value;
    object = {};
    for (property in this) {
      if (!__hasProp.call(this, property)) continue;
      value = this[property];
      if (property !== 'engine' && property !== 'observers' && property !== 'watchers') {
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

  Domain.prototype.constrain = function(constraint) {
    var name, path, _base, _i, _len, _ref, _ref1;
    if (constraint.paths) {
      _ref = constraint.paths;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        path = _ref[_i];
        if (typeof path === 'string') {
          ((_base = this.variables)[path] || (_base[path] = [])).push(constraint);
        } else {
          path.counter = (path.counter || 0) + 1;
          if (path.counter === 1) {
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
      if ((_ref1 = this[constraint[0]]) != null) {
        _ref1.apply(this, Array.prototype.slice.call(constraint, 1));
      }
      return true;
    }
  };

  Domain.prototype.unconstrain = function(constraint, continuation) {
    var group, index, path, _i, _len, _ref, _results;
    _ref = constraint.paths;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      path = _ref[_i];
      if (typeof path === 'string') {
        if (group = this.variables[path]) {
          if ((index = group.indexOf(constraint)) > -1) {
            group.splice(index, 1);
          }
          if (!group.length) {
            _results.push(delete this.variables[path]);
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      } else {
        if (!--path.counter) {
          _results.push(this.undeclare(path));
        } else {
          _results.push(void 0);
        }
      }
    }
    return _results;
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

  Domain.compile = function(domains, engine) {
    var EngineDomain, EngineDomainWrapper, domain, name;
    for (name in domains) {
      if (!__hasProp.call(domains, name)) continue;
      domain = domains[name];
      EngineDomain = engine[name] = function() {
        var Methods, Properties;
        this.domain = this;
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
      EngineDomain.prototype = new EngineDomainWrapper(engine);
      EngineDomain.displayName = name;
      EngineDomain.prototype.displayName = name;
      if (!engine.prototype) {
        engine[name.toLowerCase()] = new engine[name];
      }
    }
    return this;
  };

  return Domain;

})();

module.exports = Domain;
