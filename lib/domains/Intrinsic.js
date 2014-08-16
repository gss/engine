var Intrinsic, Native, Numeric,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Numeric = require('./Numeric');

Native = require('../methods/Native');

debugger;

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

  Intrinsic.prototype.restyle = function(element, property, value) {
    if (value == null) {
      value = '';
    }
    return element.style[property] = value;
  };

  Intrinsic.prototype.get = function(element, property) {
    var index, j, path, prop, value;
    if (!property) {
      path = element;
      element = void 0;
    } else {
      path = this.getPath(element, property);
    }
    if ((j = path.indexOf('[')) > -1) {
      element || (element = path.substring(0, j));
      property = path.substring(j + 1);
    } else {
      property = path;
    }
    if (element && property && ((prop = this.properties[path]) != null)) {
      if (typeof prop === 'function') {
        return prop.call(this, element);
      } else {
        return prop;
      }
    }
    if (!element.nodeType) {
      element = this.identity.solve(element);
    }
    if ((index = property.indexOf('intrinsic-')) > -1) {
      if (this.properties[property]) {
        value = this.properties[property].call(this, element);
      }
      property = property.substring(index + 10, property.length - 1);
    }
    prop = this.camelize(property);
    value = element.style[property];
    if (value === '') {
      value = this.getComputedStyle(element)[prop];
    }
    if (typeof value === 'string') {
      if (value.indexOf('px') > -1) {
        value = parseInt(value);
      } else {
        value = void 0;
      }
    }
    if (typeof value !== 'number' && this.properties.intrinsic[property]) {
      value = this.properties.intrinsic[property].call(this, element);
    }
    this.set(null, path, value, void 0, false);
    return value;
  };

  Intrinsic.prototype.validate = function(node) {
    var id, properties, reflown, subscribers;
    if (!(subscribers = this._subscribers)) {
      return;
    }
    reflown = void 0;
    while (node) {
      if (node === this.scope) {
        if (this.reflown) {
          reflown = this.getCommonParent(reflown, this.reflown);
        } else {
          reflown = this.scope;
        }
        break;
      }
      if (node === this.reflown) {
        break;
      }
      if (id = node._gss_id) {
        if (properties = subscribers[id]) {
          reflown = node;
        }
      }
      node = node.parentNode;
    }
    return this.reflown = reflown;
  };

  Intrinsic.prototype.verify = function(node, property, continuation, old, returnPath, primitive) {
    var current, id, intrinsic, path, prop, value, _ref, _ref1;
    if (node === window) {
      id = '::window';
    } else if (node.nodeType) {
      id = this.identity.provide(node);
    } else {
      id = node;
      node = this.ids[id];
    }
    path = this.getPath(id, property);
    if ((value = (_ref = this.buffer) != null ? _ref[path] : void 0) == null) {
      if ((prop = (_ref1 = this.properties[id]) != null ? _ref1[property] : void 0) != null) {
        current = this.values[path];
        if (current === void 0 || old === false) {
          switch (typeof prop) {
            case 'function':
              value = prop.call(this, node, continuation);
              break;
            case 'string':
              path = prop;
              value = this.properties[prop].call(this, node, continuation);
              break;
            default:
              value = prop;
          }
        }
      } else if (intrinsic = this.getIntrinsicProperty(property)) {
        if (document.body.contains(node)) {
          if (prop || (prop = this.properties[property])) {
            value = prop.call(this, node, property, continuation);
          } else {
            value = this.getStyle(node, intrinsic);
          }
        } else {
          value = null;
        }
      } else if (this[property]) {
        value = this[property](node, continuation);
      } else {
        return;
      }
    }
    if (primitive) {
      return this.values.set(id, property, value);
    } else {
      if (value !== void 0) {
        (this.buffer || (this.buffer = {}))[path] = value;
      }
    }
    if (returnPath) {
      return path;
    } else {
      return value;
    }
  };

  Intrinsic.prototype.getCommonParent = function(a, b) {
    var ap, aps, bp, bps;
    aps = [];
    bps = [];
    ap = a;
    bp = b;
    while (ap && bp) {
      aps.push(ap);
      bps.push(bp);
      ap = ap.parentNode;
      bp = bp.parentNode;
      if (bps.indexOf(ap) > -1) {
        return ap;
      }
      if (aps.indexOf(bp) > -1) {
        return bp;
      }
    }
    return suggestions;
  };

  Intrinsic.prototype.update = function(node, x, y, styles, full) {
    var id, path, prop, properties, _i, _len, _results;
    if (!this._subscribers) {
      return;
    }
    if (id = node._gss_id) {
      if (properties = this._subscribers[id]) {
        _results = [];
        for (_i = 0, _len = properties.length; _i < _len; _i++) {
          prop = properties[_i];
          if (full && (prop === 'width' || prop === 'height')) {
            continue;
          }
          path = id + "[intrinsic-" + prop + "]";
          switch (prop) {
            case "x":
              _results.push((this.buffer || (this.buffer = {}))[path] = x + node.offsetLeft);
              break;
            case "y":
              _results.push((this.buffer || (this.buffer = {}))[path] = y + node.offsetTop);
              break;
            case "width":
              _results.push((this.buffer || (this.buffer = {}))[path] = node.offsetWidth);
              break;
            case "height":
              _results.push((this.buffer || (this.buffer = {}))[path] = node.offsetHeight);
              break;
            default:
              _results.push(this.values.set(null, path, this.getStyle(node, prop)));
          }
        }
        return _results;
      }
    }
  };

  Intrinsic.condition = function() {
    return typeof window !== "undefined" && window !== null;
  };

  Intrinsic.prototype.url = null;

  return Intrinsic;

})(Numeric);

module.exports = Intrinsic;
