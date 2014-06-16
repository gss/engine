var Styles;

Styles = (function() {
  Styles.Matrix = require('../../vendor/gl-matrix.js');

  function Styles(engine) {
    this.engine = engine;
  }

  Styles.prototype.read = function(data) {
    var index, intrinsic, path, property, value;
    this.lastInput = JSON.parse(JSON.stringify(data));
    intrinsic = null;
    for (path in data) {
      value = data[path];
      index = path.indexOf('[intrinsic-');
      if (index > -1) {
        property = path.substring(index + 1, path.length - 1);
        data[prop] = void 0;
        (intrinsic || (intrinsic = {}))[path] = value;
      }
    }
    for (path in data) {
      value = data[path];
      this.set(path, void 0, value);
    }
    if (intrinsic) {
      for (path in intrinsic) {
        value = intrinsic[path];
        this.set(path, void 0, value);
      }
    }
    return this.engine.triggerEvent('solved', data, intrinsic);
  };

  Styles.prototype.remove = function(id) {
    return delete this[id];
  };

  Styles.prototype.camelize = function(string) {
    var _base;
    return (_base = (this.camelized || (this.camelized = {})))[string] || (_base[string] = string.toLowerCase().replace(/-([a-z])/i, function(match) {
      return match[1].toUpperCase();
    }));
  };

  Styles.prototype.dasherize = function(string) {
    var _base;
    return (_base = (this.dasherized || (this.dasherized = {})))[string] || (_base[string] = string.replace(/[A-Z]/, function(match) {
      return '-' + match[0].toLowerCase();
    }));
  };

  Styles.prototype.get = function(path, property, value) {
    var camel, element, style;
    element = this.references.get(path);
    camel = this.camelize(property);
    style = element.style;
    value = style[camel];
    if (value !== void 0) {
      return value;
    }
    return this;
  };

  Styles.prototype.set = function(path, property, value) {
    var camel, element, last, style;
    if (property === void 0) {
      last = path.lastIndexOf('[');
      property = path.substring(last + 1, path.length - 1);
      path = path.substring(0, last);
    }
    element = this.engine.references.get(path);
    camel = this.camelize(property);
    style = element.style;
    if (style[camel] !== void 0) {
      if (typeof value === 'number' && property !== 'zIndex') {
        value += 'px';
      }
      style[camel] = value;
    }
    return this;
  };

  Styles.prototype.position = function(node, offsets) {};

  Styles.prototype.matrix = function(node, offsets) {};

  return Styles;

})();

module.exports = Styles;
