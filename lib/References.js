var References;

References = (function() {
  function References(object) {
    this.object = object;
  }

  References.prototype.append = function(path, value) {
    var group;
    group = this[path] || (this[path] = []);
    console.warn('append', value, '@', path);
    return group.push(this.object.getObjectPath(path, value));
  };

  References.prototype.set = function(path, value) {
    var old;
    if (value === void 0) {
      old = this[path];
      if (old) {
        return this.object.onRemove(path, old);
      }
    } else {
      return this[path] = this.object.getObjectPath(path, value);
    }
  };

  References.prototype.remove = function(path, value) {
    var group, id, index;
    if (typeof value !== 'string') {
      id = value._gss_id;
      value = this.object.getObjectPath(path, id);
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

  return References;

})();

module.exports = References;
