var Values;

Values = (function() {
  function Values(engine) {
    this.engine = engine;
    this._observers = {};
    this._watchers = {};
  }

  Values.prototype.indexOf = function(array, a, b, c) {
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

  Values.prototype.watch = function(id, property, operation, continuation, scope) {
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

  Values.prototype.unwatch = function(id, property, operation, continuation, scope) {
    var index, observers, path, watchers;
    path = this.engine.getPath(id, property);
    observers = this._observers[continuation];
    index = this.indexOf(observers, operation, path, scope);
    observers.splice(index, 3);
    watchers = this._watchers[path];
    index = this.indexOf(watchers, operation, continuation, scope);
    return watchers.splice(index, 3);
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

  Values.prototype.get = function(id, property) {
    return this[this.engine.getPath(id, property)];
  };

  Values.prototype.set = function(id, property, value) {
    var index, old, path, watcher, watchers, _i, _len, _ref;
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
    if (this.engine._onChange) {
      this.engine._onChange(path, value, old);
    }
    if (watchers = (_ref = this._watchers) != null ? _ref[path] : void 0) {
      debugger;
      for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 3) {
        watcher = watchers[index];
        this.engine.expressions.evaluate(watcher, watchers[index + 1], watchers[index + 2]);
      }
    }
    return value;
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
