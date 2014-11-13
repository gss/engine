var Intrinsic, Provided,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Provided = require('./Provided');

Intrinsic = (function(_super) {
  __extends(Intrinsic, _super);

  Intrinsic.singleton = true;

  function Intrinsic(engine, output) {
    this.engine = engine;
    this.output = output;
  }

  Intrinsic.prototype.input = 'evaluate';

  Intrinsic.prototype.evaluate = function() {};

  Intrinsic.prototype.flush = function(reflow) {
    var property, suggestions, value, _ref;
    suggestions = void 0;
    if (reflow) {
      this.positions.render(null, this.reflown);
    }
    this.reflown = void 0;
    if (this.buffer) {
      _ref = this.buffer;
      for (property in _ref) {
        value = _ref[property];
        if ((value != null) && value !== this.values[property]) {
          (suggestions || (suggestions = [])).push(['suggest', property, value, 'required']);
        }
      }
      this.values.merge(this.buffer);
      return this.buffer = void 0;
    }
  };

  Intrinsic.prototype.getComputedStyle = function(element, force) {
    var computed, id, old;
    if ((old = element.currentStyle) == null) {
      computed = (this.computed || (this.computed = {}));
      id = this.identify(element);
      old = computed[id];
      if (force || (old == null)) {
        return computed[id] = window.getComputedStyle(element);
      }
    }
    return old;
  };

  Intrinsic.prototype.validate = function(node) {
    var id, intrinsic, properties, reflown;
    if (!(intrinsic = this.intrinsic)) {
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
        if (properties = intrinsic[id]) {
          reflown = node;
        }
      }
      node = node.parentNode;
    }
    return this.reflown = reflown;
  };

  Intrinsic.prototype.get = function(node, property, continuation, old, returnPath, primitive) {
    var current, id, intrinsic, path, prop, value, _ref, _ref1;
    if (node === window) {
      id = '::window';
    } else if (node.nodeType) {
      id = this.identify(node);
    } else {
      id = node;
      node = this.elements[id];
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

  Intrinsic.prototype.update = function(node, x, y, styles, full) {
    var id, path, prop, properties, _i, _len, _results;
    if (!this.intrinsic) {
      return;
    }
    if (id = node._gss_id) {
      if (properties = this.intrinsic[id]) {
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

  return Intrinsic;

})(Provided);

module.exports = Provided;
