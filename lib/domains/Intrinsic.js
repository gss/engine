var Intrinsic, Native, Numeric,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Numeric = require('../domains/Numeric');

Native = require('../methods/Native');

Intrinsic = (function(_super) {
  __extends(Intrinsic, _super);

  Intrinsic.prototype.priority = -Infinity;

  Intrinsic.condition = function() {
    return typeof window !== "undefined" && window !== null;
  };

  Intrinsic.prototype.Queries = require('../modules/Queries');

  Intrinsic.prototype.Positions = require('../modules/Positions');

  Intrinsic.prototype.Types = require('../methods/Types');

  Intrinsic.prototype.Units = require('../methods/Units');

  Intrinsic.prototype.Style = require('../concepts/Style');

  Intrinsic.prototype.Methods = Native.prototype.mixin({}, require('../methods/Types'), require('../methods/Units'), require('../methods/Selectors'), require('../methods/Rules'), require('../methods/Native'), require('../methods/Transformations'));

  Intrinsic.prototype.Properties = Native.prototype.mixin({}, require('../properties/Dimensions'), require('../properties/Styles'));

  function Intrinsic() {
    var _base, _base1;
    (_base = this.engine).queries || (_base.queries = new this.Queries(this));
    (_base1 = this.engine).positions || (_base1.positions = new this.Positions(this));
    this.types = new this.Types(this);
    this.units = new this.Units(this);
    if (!this.scope) {
      this.scope = document;
    }
    if (this.scope.nodeType === 9 && ['complete', 'interactive', 'loaded'].indexOf(this.scope.readyState) === -1) {
      this.scope.addEventListener('DOMContentLoaded', this);
    } else if (this.running) {
      this.compile();
    }
    this.scope.addEventListener('scroll', this);
    if (typeof window !== "undefined" && window !== null) {
      window.addEventListener('resize', this);
    }
    Intrinsic.__super__.constructor.apply(this, arguments);
  }

  Intrinsic.prototype.events = {
    resize: function(e) {
      var id;
      if (e == null) {
        e = '::window';
      }
      id = e.target && this.identity.provide(e.target) || e;
      return this.solve(id + ' resized', function() {
        this.intrinsic.verify(id, "width", void 0, false);
        return this.intrinsic.verify(id, "height", void 0, false);
      });
    },
    scroll: function(e) {
      var id;
      if (e == null) {
        e = '::window';
      }
      id = e.target && this.identity.provide(e.target) || e;
      return this.solve(id + ' scrolled', function() {
        this.intrinsic.verify(id, "scroll-top", void 0, false);
        return this.intrinsic.verify(id, "scroll-left", void 0, false);
      });
    },
    solve: function() {
      var id, _i, _len, _ref;
      if (this.removed) {
        _ref = this.removed;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          id = _ref[_i];
          this.identity.unset(id);
        }
        return this.removed = void 0;
      }
    },
    DOMContentLoaded: function() {
      this.scope.removeEventListener('DOMContentLoaded', this);
      return this.start();
    },
    compile: function() {
      this.intrinsic.queries.connect();
      return this.engine.solve('Intrinsic', 'stylesheets', [['eval', ['$attribute', ['$tag', 'style'], '*=', 'type', 'text/gss']], ['load', ['$attribute', ['$tag', 'link'], '*=', 'type', 'text/gss']]]);
    },
    destroy: function() {
      this.scope.removeEventListener('DOMContentLoaded', this);
      this.scope.removeEventListener('scroll', this);
      window.removeEventListener('resize', this);
      return this.engine.events.destroy.apply(this, arguments);
    }
  };

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
      id = this.identity.provide(element);
      old = computed[id];
      if (force || (old == null)) {
        return computed[id] = window.getComputedStyle(element);
      }
    }
    return old;
  };

  Intrinsic.prototype.set = function(element, property) {
    return element.style[property] = value;
  };

  Intrinsic.prototype.get = function() {
    var prop, value;
    prop = this.camelize(property);
    value = element.style[property];
    if (value === '') {
      value = this.getComputedStyle(element)[prop];
    }
    value = this.toPrimitive(value, null, null, null, element, prop);
    if (value.push && typeof value[0] === 'object') {
      return this.properties[property].apply(this, value);
    } else {
      return this.properties[property].call(this, value);
    }
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

  return Intrinsic;

})(Numeric);

module.exports = Intrinsic;
