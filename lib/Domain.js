/* Domain: Observable object. 

Has 3 use cases:

1) Base  

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

var Domain,
  __hasProp = {}.hasOwnProperty;

Domain = (function() {
  Domain.prototype.priority = 0;

  Domain.prototype.strategy = void 0;

  function Domain(engine, url, values, name) {
    var Properties;
    this.values = {};
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
    if (this.events !== this.engine.events) {
      this.addListeners(this.events);
    }
    this.signatures = new this.Signatures(this);
    if (this.Properties) {
      this.Property.compile(this.Properties.prototype, this);
      Properties = this.Properties;
    }
    this.properties = new (Properties || Object);
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
  }

  Domain.prototype.setup = function() {
    if (this.engine === this) {
      return;
    }
    if (!(this.hasOwnProperty('watchers') || this.hasOwnProperty('paths'))) {
      if (!this.hasOwnProperty('values')) {
        this.values = {};
      }
      if (this.Solver) {
        return this.paths = {};
      } else {
        this.watchers = {};
        this.observers = {};
        if (this.subscribing) {
          return this.objects = {};
        }
      }
    }
  };

  Domain.prototype.solve = function(operation, continuation, scope, ascender, ascending) {
    var commands, commited, result, transacting, _ref;
    transacting = this.transact();
    if (typeof operation === 'object') {
      if (operation instanceof Array) {
        result = this.Command(operation).solve(this, operation, continuation || '', scope || this.scope, ascender, ascending);
      } else {
        result = this.assumed.merge(operation);
      }
    }
    if (this.constrained || this.unconstrained) {
      commands = this.Constraint.prototype.split(this);
      this.Constraint.prototype.reset(this);
    }
    if (typeof result !== 'object') {
      if (result = (_ref = this.perform) != null ? _ref.apply(this, arguments) : void 0) {
        result = this.apply(result);
      }
    }
    if (commands) {
      this.update(commands);
    }
    if (transacting) {
      commited = this.commit();
    }
    return result || commited;
  };

  Domain.prototype.watch = function(object, property, operation, continuation, scope) {
    var id, j, obj, observers, path, prop, watchers, _base, _base1, _base2;
    this.setup();
    path = this.getPath(object, property);
    if (this.indexOfTriplet(this.watchers[path], operation, continuation, scope) === -1) {
      observers = (_base = this.observers)[continuation] || (_base[continuation] = []);
      observers.push(operation, path, scope);
      watchers = (_base1 = this.watchers)[path] || (_base1[path] = []);
      watchers.push(operation, continuation, scope);
      if (this.subscribing && watchers.length === 3) {
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
    index = this.indexOfTriplet(observers, operation, path, scope);
    observers.splice(index, 3);
    if (!observers.length) {
      delete this.observers[continuation];
    }
    watchers = this.watchers[path];
    index = this.indexOfTriplet(watchers, operation, continuation, scope);
    watchers.splice(index, 3);
    if (!watchers.length) {
      delete this.watchers[path];
      if (this.subscribing) {
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
            this.solved.set(path, null);
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
    var constraint, index, op, operation, url, values, variable, watcher, watchers, worker, workers, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
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
    if (!this.Solver && (variable = this.variables[path])) {
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
              }
            }
          }
        }
      }
    }
    if (workers = this.workers) {
      for (url in workers) {
        worker = workers[url];
        if (values = worker.values) {
          if (values.hasOwnProperty(path)) {
            this.updating.push([['value', path, value != null ? value : null]], worker);
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

  Domain.prototype.compile = function() {
    return this.Command.compile(this);
  };

  Domain.prototype.add = function(path, value) {
    var group, _base;
    group = (_base = (this.paths || (this.paths = {})))[path] || (_base[path] = []);
    group.push(value);
  };

  Domain.prototype.transform = function(result) {
    var nullified, path, replaced, value, variable, _ref, _ref1, _ref2, _ref3, _ref4;
    if (result == null) {
      result = {};
    }
    nullified = this.nullified;
    replaced = this.replaced;
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
    return result;
  };

  Domain.prototype.apply = function(solution) {
    var nullified, path, replaced, result, value;
    result = {};
    nullified = this.nullified;
    replaced = this.replaced;
    for (path in solution) {
      value = solution[path];
      if (!(nullified != null ? nullified[path] : void 0) && !(replaced != null ? replaced[path] : void 0) && path.charAt(0) !== '%') {
        result[path] = value;
      }
    }
    result = this.transform(result);
    this.merge(result, true);
    return result;
  };

  Domain.prototype.register = function(constraints) {
    var domains, index;
    if (constraints == null) {
      constraints = this.constraints;
    }
    domains = this.engine.domains;
    if (constraints != null ? constraints.length : void 0) {
      if (domains.indexOf(this) === -1) {
        return domains.push(this);
      }
    } else {
      if ((index = domains.indexOf(this)) > -1) {
        return domains.splice(index, 1);
      }
    }
  };

  Domain.prototype.remove = function() {
    var contd, i, observer, operation, operations, path, _i, _j, _k, _len, _len1, _ref, _ref1, _ref2;
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      path = arguments[_i];
      if (this.observers) {
        _ref1 = ((_ref = this.queries) != null ? _ref.getVariants(path) : void 0) || [path];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          contd = _ref1[_j];
          if (observer = this.observers[contd]) {
            while (observer[0]) {
              this.unwatch(observer[1], void 0, observer[0], contd, observer[2]);
            }
          }
        }
      }
      if (operations = (_ref2 = this.paths) != null ? _ref2[path] : void 0) {
        for (i = _k = operations.length - 1; _k >= 0; i = _k += -1) {
          operation = operations[i];
          operation.command.remove(this, operation, path);
        }
      }
    }
  };

  Domain.prototype["export"] = function(constraints) {
    var constraint, operation, operations, ops, _i, _j, _len, _len1;
    if (constraints || (constraints = this.constraints)) {
      operations = [];
      for (_i = 0, _len = constraints.length; _i < _len; _i++) {
        constraint = constraints[_i];
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

  Domain.prototype.transfer = function(update, parent) {
    var prop, solution;
    if (parent) {
      parent.perform(this);
    }
    if (update) {
      update.perform(this);
    }
    this.updating.perform(this);
    if (this.unconstrained) {
      this.Constraint.prototype.reset(this);
      this.register(this.constraints);
    }
    if (this.nullified) {
      solution = {};
      for (prop in this.nullified) {
        (solution || (solution = {}))[prop] = null;
      }
      return this.updating.apply(solution);
    }
  };

  Domain.prototype.maybe = function() {
    var Base;
    if (!this.Maybe) {
      Base = function() {};
      Base.prototype = this;
      this.Maybe = function() {};
      this.Maybe.prototype = new Base;
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
          id = this.identify(id);
        } else {
          id = id.path;
        }
      }
      if (id === ((_ref = this.scope) != null ? _ref._gss_id : void 0) && property.substring(0, 10) !== 'intrinsic-') {
        return property;
      }
      if (id.substring(0, 2) === '$"') {
        id = id.substring(1);
      }
      return id + '[' + property + ']';
    }
  };

  Domain.prototype.transact = function() {
    if (!this.changes) {
      this.setup();
      return this.changes = {};
    }
  };

  Domain.prototype.commit = function() {
    var changes, constraints;
    if (changes = this.changes) {
      if (constraints = this.constraints) {
        this.register(constraints);
      }
      this.changes = void 0;
      return changes;
    }
  };

  Domain.compile = function(domains, engine) {
    var EngineDomain, EngineDomainWrapper, domain, name, property, value, _ref, _ref1;
    for (name in domains) {
      if (!__hasProp.call(domains, name)) continue;
      domain = domains[name];
      if (((_ref = domain.condition) != null ? _ref.call(engine) : void 0) === false) {
        continue;
      }
      EngineDomain = engine[name] = function(values) {
        return domain.prototype.constructor.call(this, void 0, void 0, values);
      };
      EngineDomainWrapper = function() {};
      EngineDomainWrapper.prototype = engine;
      EngineDomain.prototype = new EngineDomainWrapper;
      EngineDomain.prototype.engine = engine;
      EngineDomain.prototype.displayName = name;
      _ref1 = domain.prototype;
      for (property in _ref1) {
        value = _ref1[property];
        EngineDomain.prototype[property] = value;
      }
      engine[name.toLowerCase()] = new EngineDomain();
    }
    return this;
  };

  Domain.prototype.Property = function(property, reference, properties) {
    var index, key, left, path, right, value, _base;
    if (typeof property === 'object') {
      if (property.push) {
        return properties[reference] = this.Style(property, reference, properties);
      } else {
        for (key in property) {
          value = property[key];
          if ((index = reference.indexOf('[')) > -1) {
            path = reference.replace(']', '-' + key + ']');
            left = reference.substring(0, index);
            right = path.substring(index + 1, path.length - 1);
            (_base = properties[left])[right] || (_base[right] = this.Property(value, path, properties));
          } else if (reference.match(/^[a-z]/i)) {
            path = reference + '-' + key;
          } else {
            path = reference + '[' + key + ']';
          }
          properties[path] = this.Property(value, path, properties);
        }
      }
    }
    return property;
  };

  Domain.prototype.Property.compile = function(properties, engine) {
    var key, property;
    for (key in properties) {
      if (!__hasProp.call(properties, key)) continue;
      property = properties[key];
      if (key === 'engine') {
        continue;
      }
      this.call(engine, property, key, properties);
    }
    return properties;
  };

  Domain.prototype.isCollection = function(object) {
    if (object && object.length !== void 0 && !object.substring && !object.nodeType) {
      if (object.isCollection) {
        return true;
      }
      switch (typeof object[0]) {
        case "object":
          return object[0].nodeType;
        case "undefined":
          return object.length === 0;
      }
    }
  };

  Domain.prototype.indexOfTriplet = function(array, a, b, c) {
    var index, op, _i, _len;
    if (array) {
      for (index = _i = 0, _len = array.length; _i < _len; index = _i += 3) {
        op = array[index];
        if (op === a && array[index + 1] === b && array[index + 2] === c) {
          return index;
        }
      }
    }
    return -1;
  };

  return Domain;

})();

module.exports = Domain;
