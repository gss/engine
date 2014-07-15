var Styles;

Styles = (function() {
  Styles.Matrix = require('../../vendor/gl-matrix.js');

  function Styles(engine) {
    this.engine = engine;
  }

  Styles.prototype.pull = function(data) {
    var capture, intrinsic, path, positioning, property, suggestions, value, _ref;
    this.lastInput = JSON.parse(JSON.stringify(data));
    intrinsic = null;
    for (path in data) {
      value = data[path];
      if (property = this.engine._getIntrinsicProperty(path)) {
        data[path] = void 0;
        if (property !== 'intrinsic-x' && property !== 'intrinsic-y') {
          (intrinsic || (intrinsic = {}))[path] = value;
        }
      }
    }
    positioning = this.render(data);
    if (intrinsic) {
      for (path in intrinsic) {
        value = intrinsic[path];
        data[path] = this.set(path, void 0, value, positioning, true);
      }
    }
    if (this.data) {
      _ref = this.data;
      for (path in _ref) {
        value = _ref[path];
        if (data[path] === void 0 && value !== void 0) {
          data[path] = value;
        }
      }
      this.data = void 0;
    }
    this.data = data;
    if (suggestions = this.engine._getSuggestions()) {
      capture = this.engine.expressions.capture(suggestions.length + ' intrinsics');
      this.engine.pull(suggestions);
      if (capture) {
        return this.engine.expressions.release();
      }
    } else {
      this.data = void 0;
      return this.push(data);
    }
  };

  Styles.prototype.push = function(data) {
    return this.engine.push(data);
  };

  Styles.prototype.remove = function(id) {
    return delete this[id];
  };

  Styles.prototype.get = function(path, property, value) {
    var camel, element, style, _base;
    element = this.engine[path];
    camel = (_base = (this.camelized || (this.camelized = {})))[property] || (_base[property] = this.engine._camelize(property));
    style = element.style;
    value = style[camel];
    if (value !== void 0) {
      return value;
    }
    return this;
  };

  Styles.prototype.set = function(id, property, value, positioning, intrinsic) {
    var camel, element, last, path, pixels, positioned, positioner, style, val, _base;
    if (property === void 0) {
      path = id;
      last = id.lastIndexOf('[');
      property = path.substring(last + 1, id.length - 1);
      id = id.substring(0, last);
    }
    if (id.charAt(0) === ':') {
      return;
    }
    if (!(element = this.engine.elements[id])) {
      if (!(element = this.engine._getElementById(this.engine.scope, id.substring(1)))) {
        return;
      }
    }
    positioner = this.positioners[property];
    if (positioning && positioner) {
      (positioning[id] || (positioning[id] = {}))[property] = value;
    } else {
      if (intrinsic) {
        path = this.engine._compute(element, property, void 0, value);
        if ((val = this.engine.computed[path]) != null) {
          value = val;
        }
        return value;
      }
      if (positioner) {
        positioned = positioner(element);
        if (typeof positioned === 'string') {
          property = positioned;
        }
      }
      camel = (_base = (this.camelized || (this.camelized = {})))[property] || (_base[property] = this.engine._camelize(property));
      style = element.style;
      if (style[camel] !== void 0) {
        if (typeof value === 'number' && (camel !== 'zIndex' && camel !== 'opacity')) {
          pixels = Math.round(value) + 'px';
        }
        if (positioner) {
          if (!style[camel]) {
            if ((style.positioning = (style.positioning || 0) + 1) === 1) {
              style.position = 'absolute';
            }
          } else if (value == null) {
            if (!--style.positioning) {
              style.position = '';
            }
          }
        }
        style[camel] = pixels != null ? pixels : value;
      }
    }
    return value;
  };

  Styles.prototype.render = function(data, node) {
    var id, path, positioning, prop, queries, styles, value;
    this.engine.queries.disconnect();
    positioning = {};
    if (data) {
      for (path in data) {
        value = data[path];
        if (value !== void 0) {
          this.set(path, void 0, value, positioning);
        }
      }
    }
    this.adjust(node, null, null, positioning, null, !!data);
    for (id in positioning) {
      styles = positioning[id];
      for (prop in styles) {
        value = styles[prop];
        this.set(id, prop, value);
      }
    }
    queries = this.engine.queries.connect();
    return positioning;
  };

  Styles.prototype.adjust = function(parent, x, y, positioning, offsetParent, full) {
    var child, children, offsets, scope, _i, _len;
    if (x == null) {
      x = 0;
    }
    if (y == null) {
      y = 0;
    }
    scope = this.engine.scope;
    parent || (parent = scope);
    if (offsets = this.placehold(positioning, parent, x, y, full)) {
      x += offsets.x || 0;
      y += offsets.y || 0;
    }
    if (parent === document) {
      parent = document.body;
    }
    children = this.engine.commands['$>'][1](parent);
    if (parent.offsetParent === scope) {
      x -= scope.offsetLeft;
      y -= scope.offsetTop;
    } else if (parent !== scope) {
      if (!offsets && (children != null ? children.length : void 0) && children[0].offsetParent === parent) {
        x += parent.offsetLeft + parent.clientLeft;
        y += parent.offsetTop + parent.clientTop;
        offsetParent = parent;
      }
    }
    if (children) {
      for (_i = 0, _len = children.length; _i < _len; _i++) {
        child = children[_i];
        this.adjust(child, x, y, positioning, offsetParent, full);
      }
    }
    return positioning;
  };

  Styles.prototype.placehold = function(positioning, element, x, y, full) {
    var left, offsets, property, styles, top, uid, value, values;
    offsets = void 0;
    if (uid = element._gss_id) {
      styles = positioning != null ? positioning[uid] : void 0;
      if (values = this.engine.values) {
        if ((styles != null ? styles.x : void 0) === void 0) {
          if ((left = values[uid + '[x]']) != null) {
            (styles || (styles = (positioning[uid] || (positioning[uid] = {})))).x = left;
          }
        }
        if ((styles != null ? styles.y : void 0) === void 0) {
          if ((top = values[uid + '[y]']) != null) {
            (styles || (styles = (positioning[uid] || (positioning[uid] = {})))).y = top;
          }
        }
      }
      if (styles) {
        for (property in styles) {
          value = styles[property];
          if (value !== null) {
            switch (property) {
              case "x":
                styles.x = value - x;
                (offsets || (offsets = {})).x = value - x;
                break;
              case "y":
                styles.y = value - y;
                (offsets || (offsets = {})).y = value - y;
            }
          }
        }
      }
      this.engine._onMeasure(element, x, y, styles, full);
    }
    return offsets;
  };

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
