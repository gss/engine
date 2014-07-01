var Values;

Values = (function() {
  function Values(engine) {
    this.engine = engine;
    this._observers = {};
    this._watchers = {};
  }

  Values.prototype.get = function(id, property) {
    return this[this.engine.getPath(id, property)];
  };

  Values.prototype.watch = function(id, property, operation, continuation, scope) {
    var observers, path, watchers, _base, _base1;
    path = this.engine.getPath(id, property);
    observers = (_base = this._observers)[continuation] || (_base[continuation] = []);
    observers.push(operation, path, scope);
    watchers = (_base1 = this._watchers)[path] || (_base1[path] = []);
    observers.push(operation, continuation, scope);
    return this.get(id, property);
  };

  Values.prototype.unwatch = function(id, property, operation, continuation, scope) {
    var index, observers, op, path, watchers, _i, _j, _len, _len1, _results;
    path = this.engine.getPath(id, property);
    observers = this._observers[continuation];
    for (index = _i = 0, _len = observers.length; _i < _len; index = _i += 3) {
      op = observers[index];
      if (op === operation && observers[index + 1] === path && scope === observers[index + 2]) {
        observers.splice(index, 3);
        break;
      }
    }
    watchers = this._watchers[path];
    _results = [];
    for (index = _j = 0, _len1 = watchers.length; _j < _len1; index = _j += 3) {
      op = watchers[index];
      if (op === operation && watchers[index + 1] === continuation && scope === watchers[index + 2]) {
        watchers.splice(index, 3);
        break;
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Values.prototype.clean = function(continuation) {
    var observers, _results;
    if (observers = this._observers[continuation]) {
      _results = [];
      while (observers[0]) {
        _results.push(this.unwatch(observers[1], observers[0], continuation, observers[2]));
      }
      return _results;
    }
  };

  Values.prototype.pull = function(object) {
    return this.merge(object);
  };

  Values.prototype.set = function(id, property, value) {
    var index, old, path, watcher, watchers, _i, _len, _ref, _results;
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
    if (this.engine._onChange) {
      this.engine._onChange(path, value, old);
    }
    if (watchers = (_ref = this.engine._watchers) != null ? _ref[path] : void 0) {
      _results = [];
      for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 3) {
        watcher = watchers[index];
        _results.push(this.engine.expressions.run(watcher, watchers[index + 1], watchers[index + 2]));
      }
      return _results;
    }
  };

  Values.prototype.merge = function(object) {
    var path, value;
    for (path in object) {
      value = object[path];
      this.set(path, void 0, value);
    }
    return this;
  };

  Values.prototype.toObject = function() {
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

  return Values;

})();

module.exports = Values;
