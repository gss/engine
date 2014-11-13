/* Domain: Observed values

Acts as input values for equations.

Interface:

  - (un)watch() - (un)subscribe expression to property updates
  - set()       - dispatches updates to subscribed expressions
  - get()       - retrieve value
  - clean()     - detach observes by continuation


State:
  - @_watchers[key] - List of oservers of specific properties
                      as [operation, continuation, scope] triplets

  - @_observers[continuation] - List of observers by continuation
                                as [operation, key, scope] triplets
*/

var Domain, Provided,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Domain = require('../concepts/Domain');

Provided = (function(_super) {
  __extends(Provided, _super);

  Provided.immutable = true;

  function Provided() {
    this._observers = {};
    this._watchers = {};
    Provided.__super__.constructor.apply(this, arguments);
  }

  Provided.prototype.watch = function(id, property, operation, continuation, scope) {
    var observers, path, watchers, _base, _base1;
    path = this.getPath(id, property);
    if (this.indexOfTriplet(this._watchers[path], operation, continuation, scope) === -1) {
      observers = (_base = this._observers)[continuation] || (_base[continuation] = []);
      observers.push(operation, path, scope);
      watchers = (_base1 = this._watchers)[path] || (_base1[path] = []);
      watchers.push(operation, continuation, scope);
    }
    return this.get(path);
  };

  Provided.prototype.unwatch = function(id, property, operation, continuation, scope) {
    var index, observers, path, watchers;
    path = this.engine.getPath(id, property);
    observers = this._observers[continuation];
    index = this.indexOfTriplet(observers, operation, path, scope);
    observers.splice(index, 3);
    if (!observers.length) {
      delete this._observers[continuation];
    }
    watchers = this._watchers[path];
    index = this.indexOfTriplet(watchers, operation, continuation, scope);
    watchers.splice(index, 3);
    if (!watchers.length) {
      return delete this._watchers[path];
    }
  };

  Provided.prototype.remove = function(continuation) {
    var observers, path, _i, _len, _ref;
    _ref = this.getPossibleContinuations(continuation);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      path = _ref[_i];
      if (observers = this._observers[path]) {
        while (observers[0]) {
          this.unwatch(observers[1], void 0, observers[0], path, observers[2]);
        }
      }
    }
    return this;
  };

  Provided.prototype.get = function(id, property) {
    return this[this.getPath(id, property)];
  };

  Provided.prototype.solve = function(reason, key, value) {
    var object, old, path, property, watchers, _ref;
    if (typeof reason === 'object') {
      object = reason;
      reason = void 0;
    }
    if (typeof key === 'object') {
      object = key;
    }
    if (object) {
      return this.expressions.solve(reason || object, function() {
        var path, _results;
        _results = [];
        for (path in object) {
          value = object[path];
          _results.push(this.solve(path, void 0, value));
        }
        return _results;
      });
    }
    if (arguments.length === 2) {
      value = property;
      property = void 0;
    }
    path = this.getPath(id, property);
    old = this[path];
    if (old === value) {
      return;
    }
    if (value != null) {
      this[path] = value;
    } else {
      delete this[path];
    }
    if (watchers = (_ref = this._watchers) != null ? _ref[path] : void 0) {
      this.expressions.solve(path, function() {
        var index, watcher, _i, _len, _results;
        _results = [];
        for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 3) {
          watcher = watchers[index];
          if (!watcher) {
            break;
          }
          _results.push(this.expressions.solve(path, watcher.parent, watchers[index + 1], watchers[index + 2], meta, watcher.index, value));
        }
        return _results;
      });
    }
    return value;
  };

  Provided.prototype.toObject = function() {
    var object, property, value;
    object = {};
    for (property in this) {
      if (!__hasProp.call(this, property)) continue;
      value = this[property];
      if (property !== 'engine' && property !== '_observers' && property !== '_watchers') {
        object[property] = value;
      }
    }
    return object;
  };

  return Provided;

})(Domain);

module.exports = Provided;
