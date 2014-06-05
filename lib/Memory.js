var Memory;

module.exports = Memory = (function() {
  function Memory() {
    this._watchers = {};
  }

  Memory.prototype.watch = function(key, value) {
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
    return this.object.callback(value, key, this[key]);
  };

  Memory.prototype.set = function(key, value) {
    var watcher, watchers, _i, _len;
    this[key] = value;
    if (value === "get") {
      debugger;
    }
    if (watchers = this._watchers[key]) {
      for (_i = 0, _len = watchers.length; _i < _len; _i++) {
        watcher = watchers[_i];
        this.object.callback(watcher, key, this[key]);
      }
    }
    return true;
  };

  return Memory;

})();
