var Measurements;

Measurements = (function() {
  function Measurements() {}

  Measurements.prototype.onFlush = function(buffer) {
    var commands, property, value, _ref;
    if (!this.computed) {
      return buffer;
    }
    commands = [];
    _ref = this.computed;
    for (property in _ref) {
      value = _ref[property];
      if (this.values[property] === value) {
        continue;
      }
      commands.push(['suggest', property, value, 'required']);
    }
    this.computed = void 0;
    return commands.concat(buffer);
  };

  Measurements.prototype.onMeasure = function(node, id) {};

  Measurements.prototype.onResize = function(node) {
    var id, intrinsic, prop, properties, _i, _len, _results;
    if (!(intrinsic = this.intrinsic)) {
      return;
    }
    _results = [];
    while (node) {
      if (id = node._gss_id) {
        if (properties = intrinsic[id]) {
          for (_i = 0, _len = properties.length; _i < _len; _i++) {
            prop = properties[_i];
            switch (prop) {
              case "height":
              case "width":
                this._compute(id, '[intrinsic-' + prop + ']');
            }
          }
        }
      }
      _results.push(node = node.parent);
    }
    return _results;
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

  Measurements.prototype.plus = function(a, b) {
    return a + b;
  };

  Measurements.prototype.minus = function(a, b) {
    return a - b;
  };

  Measurements.prototype.multiply = function(a, b) {
    return a * b;
  };

  Measurements.prototype.divide = function(a, b) {
    return a / b;
  };

  Measurements.prototype.unwrap = function(property) {
    if (property.charAt(0) === '[') {
      return property.substring(1, property.length - 1);
    }
    return property;
  };

  Measurements.prototype.getStyle = function(element, property) {};

  Measurements.prototype.setStyle = function(element, property, value) {
    return element.style[this._unwrap(property)] = value;
  };

  Measurements.prototype.deferComputation = {
    '[intrinsic-x]': '[intrinsic-x]',
    '[intrinsic-y]': '[intrinsic-y]'
  };

  Measurements.prototype.compute = function(id, property, continuation, old) {
    var current, def, method, object, path, prop, value;
    if (id.nodeType) {
      object = id;
      id = this.identify(object);
    } else {
      object = this[id];
    }
    path = property.charAt(0) === '[' && id + property || property;
    if ((def = this.properties[path]) != null) {
      current = this.values[path];
      if (current === void 0 || old === true) {
        if (typeof def === 'function') {
          value = this.properties[path].call(this, object, continuation);
        } else {
          value = def;
        }
        if (value !== current) {
          (this.computed || (this.computed = {}))[path] = value;
        }
      }
      return value;
    } else if (property.indexOf('intrinsic-') > -1) {
      path = id + property;
      if (!this.computed || (this.computed[path] == null)) {
        if (value === void 0) {
          prop = this.properties[property];
          method = prop && property || 'getStyle';
          if (document.body.contains(object)) {
            if (prop) {
              value = prop.call(this, object, property, continuation);
            } else {
              value = this._getStyle(object, property, continuation);
            }
          } else {
            value = null;
          }
        }
        if (value !== old) {
          (this.computed || (this.computed = {}))[path] = value;
          return value;
        }
      }
    } else {
      return this[property](object, continuation);
    }
  };

  Measurements.prototype.get = {
    command: function(continuation, object, property) {
      var computed, id;
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
      if (typeof continuation === 'object') {
        continuation = continuation.path;
      }
      if (property.indexOf('intrinsic-') > -1 || (this.properties[id + property] != null)) {
        computed = this._compute(id, property, continuation, true);
        if (typeof computed === 'object') {
          return computed;
        }
      }
      return ['get', id, property, continuation || ''];
    }
  };

  Measurements.prototype._export = function(object) {
    var def, property, _results;
    _results = [];
    for (property in this) {
      def = this[property];
      if (object[property] != null) {
        continue;
      }
      if (property === 'unwrap') {
        object[property] = def;
        continue;
      }
      _results.push((function(def, property) {
        var func, measurements;
        if (typeof def === 'function') {
          func = def;
        }
        measurements = Measurements.prototype;
        return object[property] = function(scope) {
          var args, context, fn, length, method;
          args = Array.prototype.slice.call(arguments, 0);
          length = arguments.length;
          if (def.serialized || measurements[property]) {
            if (!(scope && scope.nodeType)) {
              scope = object.scope || document;
              if (typeof def[args.length] === 'string') {
                context = scope;
              } else {
                args.unshift(scope);
              }
            } else {
              if (typeof def[args.length - 1] === 'string') {
                context = scope = args.shift();
              }
            }
          }
          if (!(fn = func)) {
            if (typeof (method = def[args.length]) === 'function') {
              fn = method;
            } else {
              if (!(method && (fn = scope[method]))) {
                if (fn = scope[method || def.method]) {
                  context = scope;
                } else {
                  fn = def.command;
                }
              }
            }
          }
          return fn.apply(context || object, args);
        };
      })(def, property));
    }
    return _results;
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
