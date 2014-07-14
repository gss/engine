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
      var child, id, index, parent, path, primitive, _ref;
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
          if (child.index && parent.def.primitive === child.index) {
            primitive = true;
            break;
          }
          child = parent;
        }
      }
      if (property.indexOf('intrinsic-') > -1 || (((_ref = this.properties[id]) != null ? _ref[property] : void 0) != null)) {
        path = this._compute(id, property, continuation, true);
        if ((index = path.indexOf('[')) > -1) {
          id = path.substring(0, index);
          property = path.substring(index + 1, path.length - 1);
        }
        if (primitive) {
          return this.values.watch(id, property, operation, this.getContinuation(continuation || ''), scope);
        }
        console.info(id, property, path);
      } else if (this.properties[id] && this.properties[property]) {
        return this.properties[property].call(this, id, continuation);
      } else if (primitive) {
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
    console.error('onMeasure', node, x, y, styles, this.intrinsic, full);
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
          (this.computed || (this.computed = {}))[path] = prop === "x" ? x + node.offsetLeft : y + node.offsetTop;
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

  Measurements.prototype.getStyle = function(element, property) {};

  Measurements.prototype.setStyle = function(element, property, value) {
    return element.style[property] = value;
  };

  Measurements.prototype.set = {
    command: function(operation, continuation, scope, meta, property, value) {
      if (scope && scope.style[property] !== void 0) {
        this._setStyle(scope, property, value);
      }
    }
  };

  Measurements.prototype.compute = function(node, property, continuation, old) {
    var current, id, path, prop, value, _ref, _ref1;
    if (node === window) {
      id = '::window';
    } else if (node.nodeType) {
      id = this.identify(node);
    } else {
      id = node;
      node = this.elements[id];
    }
    path = this.getPath(id, property);
    if (((_ref = this.computed) != null ? _ref[path] : void 0) != null) {
      return path;
    }
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
        if (prop = this.properties[property]) {
          value = prop.call(this, node, property, continuation);
        } else {
          value = this._getStyle(node, property, continuation);
        }
      } else {
        value = null;
      }
    } else {
      value = this[property](node, continuation);
    }
    (this.computed || (this.computed = {}))[path] = value;
    return path;
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
    var property, suggestions, value, _ref;
    suggestions = void 0;
    if (reflow) {
      this.styles.render(null, this.reflown);
    }
    this.reflown = void 0;
    if (this.computed) {
      _ref = this.computed;
      for (property in _ref) {
        value = _ref[property];
        if ((value != null) && value !== this.values[property]) {
          (suggestions || (suggestions = [])).push(['suggest', property, value, 'required']);
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
