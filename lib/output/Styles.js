var Styles;

Styles = (function() {
  Styles.Matrix = require('../../vendor/gl-matrix.js');

  function Styles(engine) {
    this.engine = engine;
  }

  Styles.prototype.read = function(data) {
    var index, intrinsic, path, positioning, property, value, _results;
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
    positioning = {};
    for (path in data) {
      value = data[path];
      this.set(path, void 0, value, positioning);
    }
    this.render(positioning);
    if (intrinsic) {
      _results = [];
      for (path in intrinsic) {
        value = intrinsic[path];
        _results.push(this.set(path, void 0, value, positioning, true));
      }
      return _results;
    } else {
      return this.engine.triggerEvent('solved', data, intrinsic);
    }
  };

  Styles.prototype.write = function(data) {
    return this.engine.merge(data);
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

  Styles.prototype.set = function(path, property, value, positioning, intrinsic) {
    var camel, element, last, result, style;
    if (property === void 0) {
      last = path.lastIndexOf('[');
      property = path.substring(last + 1, path.length - 1);
      path = path.substring(0, last);
    }
    if (!(element = this.engine.references.get(path))) {
      return;
    }
    if (this.positioners[prop]) {
      (positioning[path] || (positioning[path] = {}))[property] = value;
    } else {
      if (intrinsic) {
        result = this.engine.context['[' + property + ']'](element);
        if (result !== value) {

        } else {

        }
      }
      camel = this.camelize(property);
      style = element.style;
      if (style[camel] !== void 0) {
        if (typeof value === 'number' && property !== 'zIndex') {
          value += 'px';
        }
        style[camel] = value;
      }
    }
    return this;
  };

  Styles.prototype.render = function(positioning, parent, x, y) {
    var child, offsets, _i, _len, _ref, _results;
    if (!parent) {
      parent = this.engine.scope;
    }
    if (offsets = this.position(positioning, parent, x, y)) {
      x += offsets.x || 0;
      y += offsets.y || 0;
    }
    _ref = this.engine.context['>'](parent);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      _results.push(this.render(positioning, child, x, y));
    }
    return _results;
  };

  Styles.prototype.position = function(positioning, element, x, y) {
    var offsets, property, styles, uid, value;
    if (uid = element._gss_id) {
      if (styles = positioning[uid]) {
        offsets = null;
        for (property in styles) {
          value = styles[property];
          switch (property) {
            case "x":
              this.set(uid, property, value - x);
              (offsets || (offsets = {})).x = value - x;
              break;
            case "y":
              this.set(uid, property, value - y);
              (offsets || (offsets = {})).y = value - y;
          }
        }
      }
    }
    return offsets;
  };

  Styles.prototype.matrix = function(positioning, element) {};

  Styles.prototype.positioners = ['x', 'y'];

  return Styles;

})();

module.exports = Styles;
