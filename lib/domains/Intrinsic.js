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
    var bits, camel, id, j, prop, stylesheet, _ref;
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
          if (this.rule(stylesheet, operation, continuation, element, property, value)) {
            return;
          }
        }
      }
    }
    return element.style[camel] = value;
  };

  Intrinsic.prototype.rule = function(stylesheet, operation, continuation, element, property, value) {
    var body, dump, index, item, meta, needle, other, position, rule, rules, selectors, _base, _i, _j, _k, _len, _len1, _len2, _name, _ref, _ref1, _ref2, _ref3;
    if (!((_ref = (dump = stylesheet.nextSibling)) != null ? _ref.meta : void 0)) {
      dump = document.createElement('STYLE');
      dump.meta = [];
      stylesheet.parentNode.insertBefore(dump, stylesheet.nextSibling);
    }
    this.engine.restyled = true;
    rule = operation;
    while (rule = rule.parent) {
      if (rule.name === 'rule') {
        break;
      }
    }
    if (!rule) {
      return;
    }
    debugger;
    needle = operation.sourceIndex;
    _ref1 = rule.properties;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      other = _ref1[_i];
      if (other !== needle) {
        if ((_ref2 = dump.meta[other]) != null ? _ref2.length : void 0) {
          needle = other;
          break;
        }
      }
    }
    meta = ((_base = dump.meta)[_name = operation.sourceIndex] || (_base[_name] = []));
    if (meta.indexOf(continuation) > -1) {
      return;
    }
    if (meta.push(continuation) > 1) {
      return;
    }
    position = 0;
    _ref3 = dump.meta;
    for (index = _j = 0, _len1 = _ref3.length; _j < _len1; index = ++_j) {
      item = _ref3[index];
      if (index >= needle) {
        break;
      }
      if (item != null ? item.length : void 0) {
        position++;
      }
    }
    rules = dump.sheet.rules || dump.sheet.cssRules;
    for (_k = 0, _len2 = rules.length; _k < _len2; _k++) {
      rule = rules[_k];
      position -= rule.style.length - 1;
    }
    if (needle !== operation.sourceIndex) {
      rule = rules[position];
      rule.style[property] = value;
    } else {
      selectors = this.getOperationSelectors(operation).join(', ');
      body = property + ':' + value;
      index = dump.sheet.insertRule(selectors + "{" + body + "}", position);
    }
    return true;
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
    var id, properties, reflown, subscribers;
    if (!(subscribers = this.objects)) {
      return;
    }
    reflown = void 0;
    while (node) {
      if (node === this.scope) {
        if (this.engine.updating.reflown) {
          reflown = this.getCommonParent(reflown, this.engine.updating);
        } else {
          reflown = this.scope;
        }
        break;
      }
      if (node === this.engine.updating.reflown) {
        break;
      }
      if (id = node._gss_id) {
        if (properties = subscribers[id]) {
          reflown = node;
        }
      }
      node = node.parentNode;
    }
    return this.engine.updating.reflown = reflown;
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
              style = this.getIntrinsicProperty(prop);
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
