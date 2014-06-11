var Registry;

module.exports = Registry = (function() {
  function Registry(object) {
    this.object = object;
  }

  Registry.prototype.append = function(path, value) {
    var group;
    group = this[path] || (this[path] = []);
    console.warn('append', value, '@', path);
    if (typeof value !== 'string') {
      value = path + this.object.toId(value);
    }
    return group.push(value);
  };

  Registry.prototype.set = function(path, value) {
    var old;
    if (value === void 0) {
      old = this[path];
      if (old) {
        return this.object.onRemove(path, old);
      }
    } else {
      if (typeof value !== 'string') {
        value = path + this.object.toId(value);
      }
      return this[path] = value;
    }
  };

  Registry.prototype.remove = function(path, value) {
    var group, id, index;
    if (typeof value !== 'string') {
      id = value._gss_id;
      value = path + "$" + id;
    }
    if (group = this[path]) {
      console.group('remove ' + path);
      delete this[path];
      if (group instanceof Array) {
        if ((index = group.indexOf(value)) > -1) {
          group.splice(index, 1);
          this.object.onRemove(path, value, id);
        }
      } else {
        this.object.onRemove(path, value, id);
      }
      return console.groupEnd('remove ' + path);
    }
  };

  return Registry;

})();
