/* Output: DOM element styles
  
Applies style changes in bulk, separates reflows & positions.
Revalidates intrinsic measurements, optionally schedules 
another solver pass
*/

var Domain, Positions,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Domain = require('../concepts/Domain');

Positions = (function(_super) {
  __extends(Positions, _super);

  function Positions(engine) {
    this.engine = engine;
  }

  Positions.prototype.solve = function(data) {
    var intrinsic, path, positioning, property, value, _ref;
    this.lastInput = JSON.parse(JSON.stringify(data));
    intrinsic = null;
    for (path in data) {
      value = data[path];
      if (property = this.engine.getIntrinsicProperty(path)) {
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
        data[path] = this.intrinsic.solve(path, void 0, value, positioning, true);
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
    return this.data = data;
  };

  Positions.prototype.remove = function(id) {
    return delete this[id];
  };

  Positions.prototype.provide = function(id, property, value, positioning, intrinsic) {
    var camel, element, last, path, pixels, positioned, positioner, style, _base;
    if (property === void 0) {
      path = id;
      last = id.lastIndexOf('[');
      property = path.substring(last + 1, id.length - 1);
      id = id.substring(0, last);
    }
    if (id.charAt(0) === ':') {
      return;
    }
    if (!(element = this.engine.ids[id])) {
      if (!(element = this.engine.getElementById(this.engine.scope, id.substring(1)))) {
        return;
      }
    }
    positioner = this.positioners[property];
    if (positioning && positioner) {
      (positioning[id] || (positioning[id] = {}))[property] = value;
    } else {
      if (intrinsic) {
        return this.engine.measurements.get(element, property, void 0, value);
      }
      if (positioner) {
        positioned = positioner(element);
        if (typeof positioned === 'string') {
          property = positioned;
        }
      }
      camel = (_base = (this.camelized || (this.camelized = {})))[property] || (_base[property] = this.engine.camelize(property));
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

  Positions.prototype.render = function(data, node) {
    var id, path, positioning, prop, styles, value;
    this.engine.queries.disconnect();
    positioning = {};
    if (data) {
      for (path in data) {
        value = data[path];
        if (value !== void 0) {
          this.provide(path, void 0, value, positioning);
        }
      }
    }
    this.adjust(node, null, null, positioning, null, !!data);
    for (id in positioning) {
      styles = positioning[id];
      for (prop in styles) {
        value = styles[prop];
        this.provide(id, prop, value);
      }
    }
    this.engine.queries.connect();
    return positioning;
  };

  Positions.prototype.adjust = function(parent, x, y, positioning, offsetParent, full) {
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

  Positions.prototype.placehold = function(positioning, element, x, y, full) {
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
      this.engine.measurements.update(element, x, y, styles, full);
    }
    return offsets;
  };

  Positions.prototype.positioners = {
    x: function() {
      return 'left';
    },
    y: function() {
      return 'top';
    }
  };

  return Positions;

})(Domain);

module.exports = Positions;
