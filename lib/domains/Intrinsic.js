var Intrinsic, Native, Numeric,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Numeric = require('./Numeric');

Native = require('../methods/Native');

Intrinsic = (function(_super) {
  __extends(Intrinsic, _super);

  Intrinsic.prototype.priority = 100;

  Intrinsic.prototype.structured = true;

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
    var bits, camel, id, j, path, prop, stylesheet, _ref;
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
      if (element.style[camel] === '') {
        if (value != null) {
          element.style.positioned = (element.style.positioned || 0) + 1;
        }
      } else {
        if (value == null) {
          element.style.positioned = (element.style.positioned || 0) - 1;
        }
      }
      if (element.style.positioned === 1) {
        element.style.position = 'absolute';
      } else if (element.style.positioned === 0) {
        element.style.position = '';
      }
    }
    if (continuation) {
      bits = continuation.split(this.DESCEND);
      if ((j = bits[0].lastIndexOf('$')) > -1) {
        id = bits[0].substring(j);
        if (((_ref = (stylesheet = this.identity[id])) != null ? _ref.tagName : void 0) === 'STYLE') {
          if (this.stylesheets.solve(stylesheet, operation, this.getContinuation(continuation), element, property, value)) {
            return;
          }
        }
      }
    }
    path = this.getPath(element, 'intrinsic-' + property);
    if (this.watchers[path]) {
      return;
    }
    element.style[camel] = value;
  };

  Intrinsic.prototype.solve = function() {
    Numeric.prototype.solve.apply(this, arguments);
    if (arguments.length < 3) {
      this.console.row('measure');
      return this.each(this.scope, this.update);
    }
  };

  Intrinsic.prototype.get = function(object, property, continuation) {
    var id, j, path, prop;
    path = this.getPath(object, property);
    if ((prop = this.properties[path]) != null) {
      if (typeof prop === 'function') {
        return prop.call(this, object, continuation);
      } else {
        return prop;
      }
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
    path = this.getPath(object, property);
    return this.set(null, path, this.get(null, path, continuation));
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
        this.each(child, callback, x, y, offsetParent, a, r, g, s);
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
      if (num == value || (num + 'px') === value) {
        return num;
      }
    }
    return value;
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

  Intrinsic.condition = function() {
    return this.scope != null;
  };

  Intrinsic.prototype.url = null;

  return Intrinsic;

})(Numeric);

module.exports = Intrinsic;
