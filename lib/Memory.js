var Memory;

module.exports = Memory = (function() {
  function Memory(object) {
    this.object = object;
    this._watchers = {};
  }

  Memory.prototype.watch = function(key, value, a, b, c) {
    var watchers;
    console.log('@memory.watch', [key, value]);
    if (watchers = this._watchers[key]) {
      if (watchers.indexOf(value) > -1) {
        return;
      }
      watchers.push(value);
    } else {
      watchers = this._watchers[key] = [value];
    }
    debugger;
    return this.object.callback(value, key, this[key], a, b, c);
  };

  Memory.prototype.set = function(key, value, a, b, c) {
    var watcher, watchers, _i, _len;
    this[key] = value;
    if (value === "get") {
      debugger;
    }
    if (watchers = this._watchers[key]) {
      for (_i = 0, _len = watchers.length; _i < _len; _i++) {
        watcher = watchers[_i];
        this.object.callback(watcher, key, value, a, b, c);
      }
    }
    return value;
  };

  return Memory;

})();
