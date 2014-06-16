var References;

References = (function() {
  function References(input, output) {
    this.input = input;
    this.output = output;
    this.output || (this.output = this.input);
  }

  References.prototype.read = function() {
    return this.set.apply(this, arguments);
  };

  References.prototype.write = function() {
    return this.output.clean.apply(this.output, arguments);
  };

  References.prototype.combine = function(path, value) {
    if (typeof value === 'string') {
      return value;
    }
    return path + this.identify(value);
  };

  References.prototype.set = function(path, value) {
    var old;
    if (value === void 0) {
      if (old = this[path]) {
        return this.write(this.identify(old, path));
      }
    } else {
      return this[path] = this.combine(path, value);
    }
  };

  References.prototype.append = function(path, value) {
    var group;
    group = this[path] || (this[path] = []);
    return group.push(this.combine(path, value));
  };

  References.prototype.remove = function(path, value) {
    var child, group, id, _i, _len, _results;
    if (typeof value !== 'string') {
      id = value._gss_id;
      value = this.combine(path, value);
    }
    if (group = this[value]) {
      delete this[value];
      if (group instanceof Array) {
        _results = [];
        for (_i = 0, _len = group.length; _i < _len; _i++) {
          child = group[_i];
          _results.push(this.write(child, path));
        }
        return _results;
      } else {
        return this.write(group, path);
      }
    }
  };

  References.get = function(path) {
    return References.prototype[path];
  };

  References.prototype.get = function(path) {
    return this[path];
  };

  References.identify = function(object, generate) {
    var id;
    if (!(id = object._gss_id)) {
      if (object === document) {
        object = window;
      }
      if (generate !== false) {
        object._gss_id = id = "$" + (object.id || ++References.uid);
      }
      References.prototype[id] = object;
    }
    return id;
  };

  References.recognize = function(object) {
    return References.identify(object, false);
  };

  References.prototype.identify = function(object) {
    return References.identify(object);
  };

  References.prototype.recognize = function(object) {
    return References.identify(object, false);
  };

  References.uid = 0;

  return References;

})();

module.exports = References;
