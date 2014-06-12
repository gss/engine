var References,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

References = (function(_super) {
  __extends(References, _super);

  function References(input, output) {
    this.input = input;
    this.output = output;
    this.output || (this.output = this.input);
  }

  References.prototype.write = function() {
    return this.output.clean.apply(this, arguments);
  };

  References.prototype.combine = function(path, value) {
    if (typeof object === 'string') {
      return object;
    }
    return continuation + References.get(object);
  };

  References.prototype.set = function(path, value) {
    var old;
    if (value === void 0) {
      old = this[path];
      if (old) {
        return this.clean(path, old);
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
    var group, id, index;
    if (typeof value !== 'string') {
      id = value._gss_id;
      value = this.combine(path, id);
    }
    if (group = this[path]) {
      console.group('remove ' + path);
      delete this[path];
      if (group instanceof Array) {
        if ((index = group.indexOf(value)) > -1) {
          group.splice(index, 1);
          this.write(path, value, id);
        }
      } else {
        this.write(path, value, id);
      }
      return console.groupEnd('remove ' + path);
    }
  };

  References.get = function(object, force) {
    var id;
    id = object && object._gss_id;
    if (!id && force) {
      object._gss_id = id = ++References.uid;
    }
    return id;
  };

  References.uid = 0;

  return References;

})(Engine.Pipe);

module.exports = References;
