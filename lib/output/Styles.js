var Styles;

Styles = (function() {
  Styles.Matrix = require('../../vendor/gl-matrix.js');

  function Styles(engine) {
    this.engine = engine;
  }

  Styles.prototype.pull = function(data) {
    var id, index, intrinsic, path, positioning, prop, property, styles, value, _results;
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
    this.push(this.lastInput);
    positioning = {};
    for (path in data) {
      value = data[path];
      this.set(path, void 0, value, positioning);
    }
    this.render(positioning);
    for (id in positioning) {
      styles = positioning[id];
      for (prop in styles) {
        value = styles[prop];
        this.set(id, prop, value);
      }
    }
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

  Styles.prototype.push = function(data) {
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
    var camel, element, last, positioned, positioner, result, style;
    if (property === void 0) {
      last = path.lastIndexOf('[');
      property = path.substring(last + 1, path.length - 1);
      path = path.substring(0, last);
    }
    if (!(element = this.engine.references.get(path))) {
      return;
    }
    positioner = this.positioners[property];
    if (positioning && positioner) {
      (positioning[path] || (positioning[path] = {}))[property] = value;
    } else {
      if (intrinsic) {
        result = this.engine.context['[' + property + ']'](element);
        if (result !== value) {

        } else {

        }
      }
      if (positioner) {
        positioned = positioner(element);
        if (typeof positioned === 'string') {
          property = positioned;
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

  Styles.prototype.render = function(positioning, parent, x, y, offsetParent) {
    var child, children, offsets, _i, _len, _results;
    if (!parent) {
      parent = this.engine.scope;
    }
    if (offsets = this.preposition(positioning, parent, x, y)) {
      x += offsets.left;
      y += offsets.top;
    }
    children = this.engine.context['>'][1](parent);
    if (offsetParent && !offsets && children.length && children[0].parentOffset === parent) {
      x += parent.offsetLeft;
      y += parent.offsetTop;
      offsetParent = parent;
    }
    _results = [];
    for (_i = 0, _len = children.length; _i < _len; _i++) {
      child = children[_i];
      _results.push(this.render(positioning, child, x, y, offsetParent));
    }
    return _results;
  };

  Styles.prototype.preposition = function(positioning, element, x, y) {
    var offsets, property, styles, uid, value;
    if (uid = element._gss_id) {
      if (styles = positioning[uid]) {
        offsets = {
          left: 0,
          top: 0
        };
        for (property in styles) {
          value = styles[property];
          if (value !== null) {
            switch (property) {
              case "x":
                styles.x = value - (x || 0);
                offsets.left = value - (x || 0);
                break;
              case "y":
                styles.y = value - (y || 0);
                offsets.top = value - (y || 0);
            }
          }
        }
      }
    }
    return offsets;
  };

  Styles.prototype.matrix = function(positioning, element) {};

  Styles.prototype.positioners = {
    x: function() {
      return 'left';
    },
    y: function() {
      return 'top';
    }
  };

  return Styles;

})();

module.exports = Styles;
