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

  Intrinsic.prototype.restyle = function(element, property, value) {
    var prop;
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
    if (typeof value !== 'string') {
      value = prop.toString(value);
    }
    return element.style[property] = value;
  };

  Intrinsic.prototype.solve = function() {
    Numeric.prototype.solve.apply(this, arguments);
    return this.each(this.scope, this.update);
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
        prop = path.substring(j + 1, path.length - 1);
        if ((prop = this.properties[property]).axiom) {
          return prop.call(this, object, continuation);
        } else if (prop && typeof prop !== 'function') {
          return prop;
        }
      }
    }
    return Numeric.prototype.get.apply(this, arguments);
  };

  Intrinsic.prototype.validate = function(node) {
    var id, properties, reflown, subscribers;
    if (!(subscribers = this.objects)) {
      return;
    }
    reflown = void 0;
    while (node) {
      if (node === this.scope) {
        if (this.engine.workflow.reflown) {
          reflown = this.getCommonParent(reflown, this.engine.workflow);
        } else {
          reflown = this.scope;
        }
        break;
      }
      if (node === this.engine.workflow.reflown) {
        break;
      }
      if (id = node._gss_id) {
        if (properties = subscribers[id]) {
          reflown = node;
        }
      }
      node = node.parentNode;
    }
    return this.engine.workflow.reflown = reflown;
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

  Intrinsic.prototype.each = function(parent, callback, x, y, offsetParent, a, r, g, s) {
    var child, index, measure, offsets, scope;
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
      if (child.nodeType = 1) {
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

  Intrinsic.prototype.update = function(node, x, y, full) {
    var id, prop, properties, _results;
    if (!this.objects) {
      return;
    }
    if (id = node._gss_id) {
      if (properties = this.objects[id]) {
        _results = [];
        for (prop in properties) {
          if (full && (prop === 'width' || prop === 'height')) {
            continue;
          }
          switch (prop) {
            case "x":
            case "intrinsic-x":
              _results.push(this.set(id, prop, x + node.offsetLeft));
              break;
            case "y":
            case "intrinsic-y":
              _results.push(this.set(id, prop, y + node.offsetTop));
              break;
            case "width":
            case "intrinsic-width":
              _results.push(this.set(id, prop, node.offsetWidth));
              break;
            case "height":
            case "intrinsic-height":
              debugger;
              _results.push(this.set(id, prop, node.offsetHeight));
              break;
            default:
              _results.push(this.set(id, prop, this.getStyle(node, this.engine.getIntrinsicProperty(prop))));
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
