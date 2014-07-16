var Measurements;

Measurements = (function() {
  function Measurements() {}

  Measurements.prototype.suggest = {
    command: function(operation, continuation, scope, meta, variable, value, strength, weight, contd) {
      if (continuation) {
        contd || (contd = this.getContinuation(continuation));
      }
      return ['suggest', variable, value, strength != null ? strength : null, weight != null ? weight : null, contd != null ? contd : null];
    }
  };

  Measurements.prototype.get = {
    command: function(operation, continuation, scope, meta, object, property) {
      var assignment, child, id, index, parent, path, primitive, _ref;
      if (property) {
        if (typeof object === 'string') {
          id = object;
        } else if (object.absolute === 'window' || object === document) {
          id = '::window';
        } else if (object.nodeType) {
          id = this.identify(object);
        }
      } else {
        id = '';
        property = object;
        object = void 0;
      }
      if (operation) {
        parent = child = operation;
        while (parent = parent.parent) {
          if (child.index) {
            if (parent.def.primitive === child.index) {
              primitive = true;
              break;
            }
            if (parent.def.noop && parent.def.name && child.index === 1) {
              assignment = true;
            }
          }
          child = parent;
        }
      }
      if (property.indexOf('intrinsic-') > -1 || (((_ref = this.properties[id]) != null ? _ref[property] : void 0) != null) || (!assignment && id)) {
        path = this._measure(id, property, continuation, true, true);
        if (path && (index = path.indexOf('[')) > -1) {
          id = path.substring(0, index);
          property = path.substring(index + 1, path.length - 1);
        }
      } else {
        if (id && typeof this.properties[property] === 'function') {
          return this.properties[property].call(this, id, continuation);
        }
      }
      if (primitive) {
        return this.values.watch(id, property, operation, continuation, scope);
      }
      return ['get', id, property, this.getContinuation(continuation || '')];
    }
  };

  Measurements.prototype.onBuffer = function(buffer, args, batch) {
    var last;
    if (!(buffer && batch)) {
      return;
    }
    if (last = buffer[buffer.length - 1]) {
      if (last[0] === args[0]) {
        if (last.indexOf(args[1]) === -1) {
          last.push.apply(last, args.slice(1));
        }
        return false;
      }
    }
  };

  Measurements.prototype.onFlush = function(buffer) {
    return this._getSuggestions(!buffer);
  };

  Measurements.prototype.onMeasure = function(node, x, y, styles, full) {
    var id, path, prop, properties, _i, _len;
    if (!this.intrinsic) {
      return;
    }
    if (id = node._gss_id) {
      if (properties = this.intrinsic[id]) {
        for (_i = 0, _len = properties.length; _i < _len; _i++) {
          prop = properties[_i];
          if (full && (prop === 'width' || prop === 'height')) {
            continue;
          }
          path = id + "[intrinsic-" + prop + "]";
          (this.measured || (this.measured = {}))[path] = (function() {
            switch (prop) {
              case "x":
                return x + node.offsetLeft;
              case "y":
                return y + node.offsetTop;
              case "width":
                return node.offsetWidth;
              case "height":
                return node.offsetHeight;
            }
          })();
        }
      }
    }
  };

  Measurements.prototype.onResize = function(node) {
    var id, intrinsic, properties, reflown;
    if (!(intrinsic = this.intrinsic)) {
      return;
    }
    reflown = void 0;
    while (node) {
      if (node === this.scope) {
        if (this.reflown) {
          reflown = this._getCommonParent(reflown, this.reflown);
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

  Measurements.prototype.onChange = function(path, value, old) {
    var group, id, prop, _base;
    if ((old != null) !== (value != null)) {
      if (prop = this._getIntrinsicProperty(path)) {
        id = path.substring(0, path.length - prop.length - 10 - 2);
        if (value != null) {
          return ((_base = (this.intrinsic || (this.intrinsic = {})))[id] || (_base[id] = [])).push(prop);
        } else {
          group = this.intrinsic[id];
          group.splice(group.indexOf(path), 1);
          if (!group.length) {
            return delete this.intrinsic[id];
          }
        }
      }
    }
  };

  Measurements.prototype.getStyle = function(element, property) {
    return element.getComputedStyle(element).property;
  };

  Measurements.prototype.simpleValueRegExp = /^[#0-9a-z]*$/;

  Measurements.prototype.setStyle = function(element, property, value) {
    return element.style[property] = value;
  };

  Measurements.prototype.set = {
    command: function(operation, continuation, scope, meta, property, value) {
      var prop;
      prop = this._camelize(property);
      if (scope && scope.style[prop] !== void 0) {
        this._setStyle(scope, prop, value);
      }
    }
  };

  Measurements.prototype.measure = function(node, property, continuation, old, returnPath) {
    var current, id, path, prop, val, value, _ref, _ref1;
    if (node === window) {
      id = '::window';
    } else if (node.nodeType) {
      id = this.identify(node);
    } else {
      id = node;
      node = this.elements[id];
    }
    path = this.getPath(id, property);
    if ((value = (_ref = this.measured) != null ? _ref[path] : void 0) == null) {
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
      } else if (property.indexOf('intrinsic-') > -1) {
        if (document.body.contains(node)) {
          if (prop || (prop = this.properties[property])) {
            value = prop.call(this, node, property, continuation);
          }
        } else {
          value = null;
        }
      } else if (GSS.dummy.style.hasOwnProperty(property) || (property === 'x' || property === 'y')) {
        if (this.properties.intrinsic[property]) {
          val = this.properties.intrinsic[property].call(this, node, continuation);
          console.error('precalc', node, property, value);
          (this.computed || (this.computed = {}))[path] = val;
        }
      } else if (this[property]) {
        value = this[property](node, continuation);
      } else {
        return;
      }
    }
    if (value !== void 0) {
      (this.measured || (this.measured = {}))[path] = value;
    }
    if (returnPath) {
      return path;
    } else {
      return value;
    }
  };

  Measurements.prototype.getCommonParent = function(a, b) {
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

  Measurements.prototype.getSuggestions = function(reflow) {
    var property, suggestions, value, _ref, _ref1;
    suggestions = void 0;
    if (reflow) {
      this.styles.render(null, this.reflown);
    }
    this.reflown = void 0;
    if (this.measured) {
      _ref = this.measured;
      for (property in _ref) {
        value = _ref[property];
        if ((value != null) && value !== this.values[property]) {
          (suggestions || (suggestions = [])).push(['suggest', property, value, 'required']);
        }
      }
      this.values.merge(this.measured);
      this.measured = void 0;
    }
    if (this.computed) {
      _ref1 = this.computed;
      for (property in _ref1) {
        value = _ref1[property];
        if ((value != null) && value !== this.values[property]) {
          (suggestions || (suggestions = [])).push(['suggest', property, value, 'weak']);
        }
      }
      this.values.merge(this.computed);
      this.computed = void 0;
    }
    return suggestions;
  };

  Measurements.prototype.getIntrinsicProperty = function(path) {
    var index, property;
    index = path.indexOf('[intrinsic-');
    if (index > -1) {
      return property = path.substring(index + 11, path.length - 1);
    }
  };

  return Measurements;

})();

module.exports = Measurements;
