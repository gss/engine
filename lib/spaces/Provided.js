/* Space: Observed values

Manages solutions and document properties.

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

var Buffer, BufferedSpace, Provided, Space,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Space = require('../concepts/Space');

Buffer = require('../concepts/Buffer');

BufferedSpace = Buffer.mixin(Buffer, Space);

Provided = (function(_super) {
  __extends(Provided, _super);

  Provided.singleton = true;

  function Provided(engine) {
    this.engine = engine;
    this._observers = {};
    this._watchers = {};
  }

  Provided.prototype.indexOf = function(array, a, b, c) {
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

  Provided.prototype.watch = function(id, property, operation, continuation, scope) {
    var observers, path, watchers, _base, _base1;
    path = this.engine.getPath(id, property);
    if (this.indexOf(this._watchers[path], operation, continuation, scope) === -1) {
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
    index = this.indexOf(observers, operation, path, scope);
    observers.splice(index, 3);
    if (!observers.length) {
      delete this._observers[continuation];
    }
    watchers = this._watchers[path];
    index = this.indexOf(watchers, operation, continuation, scope);
    watchers.splice(index, 3);
    if (!watchers.length) {
      return delete this._watchers[path];
    }
  };

  Provided.prototype.clean = function(continuation) {
    var observers, path, _i, _len, _ref;
    _ref = this.engine.getPossibleContinuations(continuation);
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

  Provided.prototype.pull = function(object) {
    return this.merge(object);
  };

  Provided.prototype.get = function(id, property) {
    return this[this.engine.getPath(id, property)];
  };

  Provided.prototype.set = function(id, property, value, retain, meta) {
    var capture, index, old, path, watcher, watchers, _i, _len, _ref;
    if (arguments.length === 2) {
      value = property;
      property = void 0;
    }
    path = this.engine.getPath(id, property);
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
      for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 3) {
        watcher = watchers[index];
        if (!watcher) {
          break;
        }
        if (this.engine.expressions.capture(path, watcher.parent, watchers[index + 1], watchers[index + 2], meta, watcher.index, value)) {
          capture = true;
        }
      }
      if (capture && !retain) {
        this.engine.expressions.release();
      }
    }
    return value;
  };

  Provided.prototype.merge = function(object) {
    var capturing, path, value;
    capturing = this.engine.expressions.buffer === void 0;
    for (path in object) {
      value = object[path];
      this.set(path, void 0, value, capturing);
    }
    if (capturing && this.engine.expressions.buffer !== void 0) {
      this.engine.expressions.release();
    }
    return this;
  };

  Provided.prototype.toObject = function() {
    var object, property, value;
    object = {};
    for (property in this) {
      value = this[property];
      if (this.hasOwnProperty(property)) {
        if (property !== 'engine' && property !== '_observers' && property !== '_watchers') {
          object[property] = value;
        }
      }
    }
    return object;
  };

  return Provided;

})(BufferedSpace);

module.exports = Provided;
