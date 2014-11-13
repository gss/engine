var Intrinsic, Native, Numeric,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Numeric = require('./Numeric');

Native = require('../methods/Native');

Intrinsic = (function(_super) {
  __extends(Intrinsic, _super);

  Intrinsic.prototype.priority = 100;

  Intrinsic.prototype.structured = true;

  Intrinsic.prototype.immediate = true;

  Intrinsic.prototype.Types = require('../methods/Types');

  Intrinsic.prototype.Units = require('../methods/Units');

  Intrinsic.prototype.Style = require('../concepts/Style');

  Intrinsic.prototype.Methods = Native.prototype.mixin(new Numeric.prototype.Methods, require('../methods/Types'), require('../methods/Units'), require('../methods/Transformations'));

  Intrinsic.prototype.Properties = Native.prototype.mixin({}, require('../properties/Dimensions'), require('../properties/Styles'));

  function Intrinsic() {
    this.types = new this.Types(this);
    this.units = new this.Units(this);
  }

  Intrinsic.prototype.getComputedStyle = function(element, force) {
    var computed, id, old;
    if ((old = element.currentStyle) == null) {
      computed = (this.computed || (this.computed = {}));
      id = this.identity.provide(element);
      old = computed[id];
      if (force || (old == null)) {
        return computed[id] = window.getComputedStyle(element);
      }
    }
    return old;
  };

  Intrinsic.prototype.restyle = function(element, property, value, continuation, operation) {
    var bits, camel, first, id, j, parent, path, position, prop, shared, stylesheet, _ref, _ref1;
    if (value == null) {
      value = '';
    }
    switch (property) {
      case "x":
        property = "left";
        break;
      case "y":
        property = "top";
    }
    if (!(prop = this.properties[property])) {
      return;
    }
    camel = this.camelize(property);
    if (typeof value !== 'string') {
      value = prop.toString(value);
    }
    if (property === 'left' || property === 'top') {
      position = element.style.position;
      if (element.positioned === void 0) {
        element.positioned = +(!!position);
      }
      if (position && position !== 'absolute') {
        return;
      }
      if (element.style[camel] === '') {
        if ((value != null) && value !== '') {
          element.positioned = (element.positioned || 0) + 1;
        }
      } else {
        if ((value == null) || value === '') {
          element.positioned = (element.positioned || 0) - 1;
        }
      }
      if (element.positioned === 1) {
        element.style.position = 'absolute';
      } else if (element.positioned === 0) {
        element.style.position = '';
      }
    }
    if (continuation) {
      bits = continuation.split(this.Continuation.DESCEND);
      first = bits.shift();
      if ((j = first.lastIndexOf('$')) > -1) {
        id = first.substring(j);
        if (((_ref = (stylesheet = this.identity[id])) != null ? _ref.tagName : void 0) === 'STYLE') {
          parent = operation;
          while (parent = parent.parent) {
            if (parent[0] === 'if' && parent[1].marked) {
              shared = false;
              break;
            }
          }
          if (shared !== false) {
            if (this.stylesheets.solve(stylesheet, operation, this.Continuation(continuation), element, property, value)) {
              return;
            }
          }
        }
      }
    }
    path = this.Variable.getPath(element, 'intrinsic-' + property);
    if ((_ref1 = this.watchers) != null ? _ref1[path] : void 0) {
      return;
    }
    element.style[camel] = value;
  };

  Intrinsic.prototype.perform = function() {
    if (arguments.length < 4) {
      this.console.row('measure', arguments[0], arguments[1]);
      this.each(this.scope, this.update);
    }
  };

  Intrinsic.prototype.get = function(object, property, continuation) {
    var id, j, path, prop, value;
    path = this.Variable.getPath(object, property);
    if ((prop = this.properties[path]) != null) {
      if (typeof prop === 'function') {
        value = prop.call(this, object, continuation);
      } else {
        value = prop;
      }
      this.set(null, path, value);
      return value;
    } else {
      if ((j = path.indexOf('[')) > -1) {
        id = path.substring(0, j);
        property = path.substring(j + 1, path.length - 1);
        object = this.identity.solve(path.substring(0, j));
        if ((prop = this.properties[property]) != null) {
          if (prop.axiom) {
            return prop.call(this, object, continuation);
          } else if (typeof prop !== 'function') {
            return prop;
          } else if (!prop.matcher && property.indexOf('intrinsic') === -1) {
            return prop.call(this, object, continuation);
          }
        }
      }
    }
    return Numeric.prototype.get.call(this, null, path, continuation);
  };

  Intrinsic.prototype.validate = function(node) {
    var subscribers;
    if (!(subscribers = this.objects)) {
      return;
    }
    return this.engine.updating.reflown = this.scope;
  };

  Intrinsic.prototype.verify = function(object, property, continuation) {
    var path;
    path = this.Variable.getPath(object, property);
    if (this.values.hasOwnProperty(path)) {
      return this.set(null, path, this.get(null, path, continuation));
    }
  };

  Intrinsic.prototype.each = function(parent, callback, x, y, offsetParent, a, r, g, s) {
    var child, index, measure, offsets, scope;
    if (x == null) {
      x = 0;
    }
    if (y == null) {
      y = 0;
    }
    scope = this.engine.scope;
    parent || (parent = scope);
    if (offsets = callback.call(this, parent, x, y, a, r, g, s)) {
      x += offsets.x || 0;
      y += offsets.y || 0;
    }
    if (parent.offsetParent === scope) {
      x -= scope.offsetLeft;
      y -= scope.offsetTop;
    } else if (parent !== scope) {
      if (!offsets) {
        measure = true;
      }
    }
    if (parent === document) {
      parent = document.body;
    }
    child = parent.firstChild;
    index = 0;
    while (child) {
      if (child.nodeType === 1) {
        if (measure && index === 0 && child.offsetParent === parent) {
          x += parent.offsetLeft + parent.clientLeft;
          y += parent.offsetTop + parent.clientTop;
          offsetParent = parent;
        }
        if (child.style.position === 'relative') {
          this.each(child, callback, 0, 0, offsetParent, a, r, g, s);
        } else {
          this.each(child, callback, x, y, offsetParent, a, r, g, s);
        }
        index++;
      }
      child = child.nextSibling;
    }
    return a;
  };

  Intrinsic.prototype.getStyle = function(node, property) {
    var num, value;
    value = node.style[property] || this.getComputedStyle(node)[property];
    if (value) {
      num = parseFloat(value);
      if (String(num) === String(value) || (num + 'px') === value) {
        return num;
      }
    }
    return value;
  };

  Intrinsic.prototype.onWatch = function(id, property) {
    var node;
    if ((node = this.identity.solve(id)) && node.nodeType === 1) {
      if (property.indexOf('intrinsic-') > -1) {
        property = property.substring(10);
      }
      if (this.engine.values[this.Variable.getPath(id, property)] !== void 0) {
        return node.style[property] = '';
      }
    }
  };

  Intrinsic.prototype.update = function(node, x, y, full) {
    var id, prop, properties, style, _ref;
    if (!this.objects) {
      return;
    }
    if (id = node._gss_id) {
      if (properties = this.objects[id]) {
        for (prop in properties) {
          if (full && (prop === 'width' || prop === 'height')) {
            continue;
          }
          switch (prop) {
            case "x":
            case "intrinsic-x":
              this.set(id, prop, x + node.offsetLeft);
              break;
            case "y":
            case "intrinsic-y":
              this.set(id, prop, y + node.offsetTop);
              break;
            case "width":
            case "intrinsic-width":
              this.set(id, prop, node.offsetWidth);
              break;
            case "height":
            case "intrinsic-height":
              this.set(id, prop, node.offsetHeight);
              break;
            default:
              style = this.getIntrinsicProperty(prop) || prop;
              if ((_ref = this.properties[style]) != null ? _ref.matcher : void 0) {
                this.set(id, prop, this.getStyle(node, style));
              } else {
                this.set(id, prop, this.get(node, prop));
              }
          }
        }
      }
    }
  };

  Intrinsic.prototype.getIntrinsicProperty = function(path) {
    var index, last, property;
    index = path.indexOf('intrinsic-');
    if (index > -1) {
      if ((last = path.indexOf(']', index)) === -1) {
        last = void 0;
      }
      return property = path.substring(index + 10, last);
    }
  };

  Intrinsic.condition = function() {
    return this.scope != null;
  };

  Intrinsic.prototype.url = null;

  return Intrinsic;

})(Numeric);

module.exports = Intrinsic;
