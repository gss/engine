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
    if (this.engine === this) {
      return;
    }
    if (!(this.hasOwnProperty('watchers') || this.hasOwnProperty('paths'))) {
      if (!this.hasOwnProperty('values')) {
        this.values = {};
      }
      if (this.MAYBE) {
        this.paths = {};
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

  Domain.prototype.solve = function(operation, continuation, scope, ascender, ascending) {
    var commands, commited, object, result, strategy, transacting, _ref;
    transacting = this.transact();
    if (typeof operation === 'object' && !operation.push) {
      if (this.domain === this.engine) {
        result = this.assumed.merge(operation);
      } else {
        result = this.merge(operation);
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
      commands = this.Constraint.prototype.validate(this);
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

  Domain.prototype.transact = function() {
    var _ref;
    this.setup();
    if (!(this.changes && this.hasOwnProperty('changes'))) {
      if (this.disconnected) {
        if ((_ref = this.mutations) != null) {
          _ref.disconnect(true);
        }
      }
      return this.changes = {};
    }
  };

  Domain.prototype.commit = function() {
    var changes, _ref;
    changes = this.changes;
    this.changes = void 0;
    if (this.disconnected) {
      if ((_ref = this.mutations) != null) {
        _ref.connect(true);
      }
    }
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
            if (!(this.updating.domains.indexOf(this) > this.updating.index)) {
              this.updating.apply(this.changes);
            }
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
    this.transact();
    this.changes[path] = value != null ? value : null;
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
    var constraint, index, op, operation, url, values, variable, watcher, watchers, worker, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3;
    if (watchers = (_ref = this.watchers) != null ? _ref[path] : void 0) {
      for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 3) {
        watcher = watchers[index];
        if (!watcher) {
          break;
        }
        if (value != null) {
          watcher.command.ascend(this, watcher, watchers[index + 1], watchers[index + 2], value, true);
        } else {
          watcher.command.patch(this, watcher, watchers[index + 1], watchers[index + 2]);
        }
      }
    }
    if (this.immutable) {
      return;
    }
    if (variable = this.variables[path]) {
      _ref1 = variable.constraints;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        constraint = _ref1[_j];
        _ref2 = constraint.operations;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          operation = _ref2[_k];
          if (op = operation.variables[path]) {
            if (op.domain && op.domain.displayName !== this.displayName) {
              if (!watchers || watchers.indexOf(op) === -1) {
                op.command.patch(op.domain, op, void 0, void 0, this);
                op.command.solve(this, op);
                console.error(123, op, path);
              }
            }
          }
        }
      }
    }
    if (this.workers) {
      _ref3 = this.workers;
      for (url in _ref3) {
        worker = _ref3[url];
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
    var constraint, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    if (this.constrained) {
      _ref = this.constrained;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        constraint = _ref[_i];
        this.addConstraint(constraint);
        this.Constraint.prototype.declare(this, constraint);
      }
    }
    this.constrained = [];
    if (this.unconstrained) {
      _ref1 = this.unconstrained;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        constraint = _ref1[_j];
        this.removeConstraint(constraint);
      }
      _ref2 = this.unconstrained;
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        constraint = _ref2[_k];
        this.Constraint.prototype.undeclare(this, constraint);
      }
    }
    return this.unconstrained = void 0;
  };

  Domain.prototype.add = function(path, value) {
    var group, _base;
    group = (_base = (this.paths || (this.paths = {})))[path] || (_base[path] = []);
    group.push(value);
  };

  Domain.prototype.apply = function(solution) {
    var index, nullified, path, replaced, result, value, variable, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    result = {};
    nullified = this.nullified;
    replaced = this.replaced;
    for (path in solution) {
      value = solution[path];
      if (!(nullified != null ? nullified[path] : void 0) && !(replaced != null ? replaced[path] : void 0) && path.charAt(0) !== '%') {
        result[path] = value;
      }
    }
    if (this.declared) {
      _ref = this.declared;
      for (path in _ref) {
        variable = _ref[path];
        value = (_ref1 = variable.value) != null ? _ref1 : 0;
        if (this.values[path] !== value) {
          if (path.charAt(0) !== '%') {
            if (result[path] == null) {
              result[path] = value;
            }
            this.values[path] = value;
          }
        }
      }
      this.declared = void 0;
    }
    this.replaced = void 0;
    if (nullified) {
      for (path in nullified) {
        variable = nullified[path];
        if (path.charAt(0) !== '%') {
          result[path] = (_ref2 = (_ref3 = this.assumed.values[path]) != null ? _ref3 : (_ref4 = this.intrinsic) != null ? _ref4.values[path] : void 0) != null ? _ref2 : null;
        }
        this.nullify(variable);
      }
      this.nullified = void 0;
    }
    this.merge(result, true);
    if (this.constraints) {
      if (((_ref5 = this.constraints) != null ? _ref5.length : void 0) === 0) {
        if ((index = this.engine.domains.indexOf(this)) > -1) {
          this.engine.domains.splice(index, 1);
        }
      } else {
        if (this.engine.domains.indexOf(this) === -1) {
          this.engine.domains.push(this);
        }
      }
    }
    return result;
  };

  Domain.prototype.remove = function() {
    var contd, i, observer, operation, operations, path, _i, _j, _k, _len, _len1, _ref, _ref1;
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
      if (operations = (_ref1 = this.paths) != null ? _ref1[path] : void 0) {
        for (i = _k = operations.length - 1; _k >= 0; i = _k += -1) {
          operation = operations[i];
          operation.command.remove(this, operation, path);
        }
      }
    }
  };

  Domain.prototype["export"] = function(strings) {
    var constraint, operation, operations, ops, _i, _j, _len, _len1, _ref;
    if (this.constraints) {
      operations = [];
      _ref = this.constraints;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        constraint = _ref[_i];
        if (ops = constraint.operations) {
          for (_j = 0, _len1 = ops.length; _j < _len1; _j++) {
            operation = ops[_j];
            operations.push(operation.parent);
          }
        }
      }
      return operations;
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
    var _ref;
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
      if (id === ((_ref = this.engine.scope) != null ? _ref._gss_id : void 0) && property.substring(0, 10) !== 'intrinsic-') {
        return property;
      }
      if (id.substring(0, 2) === '$"') {
        id = id.substring(1);
      }
      return id + '[' + property + ']';
    }
  };

  Domain.prototype.getVariableDomain = function(engine, operation, Default) {
    var domain, i, index, intrinsic, op, path, prefix, property, _ref, _ref1, _ref2, _ref3, _ref4;
    if (operation.domain) {
      return operation.domain;
    }
    path = operation[1];
    if ((i = path.indexOf('[')) > -1) {
      property = path.substring(i + 1, path.length - 1);
    }
    if (engine.assumed.values.hasOwnProperty(path)) {
      return engine.assumed;
    } else if (property && (intrinsic = (_ref = engine.intrinsic) != null ? _ref.properties : void 0)) {
      if ((intrinsic[path] != null) || (intrinsic[property] && !intrinsic[property].matcher)) {
        return engine.intrinsic;
      }
    }
    if (Default) {
      return Default;
    }
    if (property && (index = property.indexOf('-')) > -1) {
      prefix = property.substring(0, index);
      if ((domain = engine[prefix])) {
        if (domain instanceof engine.Domain) {
          return domain;
        }
      }
    }
    if (op = (_ref1 = engine.variables[path]) != null ? (_ref2 = _ref1.constraints) != null ? (_ref3 = _ref2[0]) != null ? (_ref4 = _ref3.operations[0]) != null ? _ref4.domain : void 0 : void 0 : void 0 : void 0) {
      return op;
    }
    return this.engine.linear.maybe();
  };

  Domain.prototype["yield"] = function(solution, value) {
    return this.engine.engine["yield"](solution);
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
        var Properties, property, value;
        this.values = {};
        if (object) {
          for (property in object) {
            value = object[property];
            if (!this.hasOwnProperty('values')) {
              this.values = {};
            }
            this.values[property] = value;
          }
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
