var Measurements;

Measurements = (function() {
  function Measurements() {}

  Measurements.prototype.onFlush = function(buffer) {
    var commands, property, value, _ref;
    if (!this.engine.computed) {
      return buffer;
    }
    commands = [];
    _ref = this.engine.computed;
    for (property in _ref) {
      value = _ref[property];
      if (this.engine.values[property] === value) {
        continue;
      }
      commands.push(['suggest', property, value, 'required']);
    }
    return commands.concat(buffer);
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

  Measurements.prototype['::window[width]'] = function() {
    return window.innerWidth;
  };

  Measurements.prototype['::window[height]'] = function() {
    return window.innerHeight;
  };

  Measurements.prototype['::window[scroll-left]'] = function() {
    return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
  };

  Measurements.prototype['::window[scroll-top]'] = function() {
    return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
  };

  Measurements.prototype['::window[x]'] = 0;

  Measurements.prototype['::window[y]'] = 0;

  Measurements.prototype["[intrinsic-height]"] = function(scope) {
    return scope.offsetHeight;
  };

  Measurements.prototype["[intrinsic-width]"] = function(scope) {
    return scope.offsetWidth;
  };

  Measurements.prototype["[scroll-left]"] = function(scope) {
    return scope.scrollLeft;
  };

  Measurements.prototype["[scroll-top]"] = function(scope) {
    return scope.scrollTop;
  };

  Measurements.prototype["[offset-left]"] = function(scope) {
    return scope.offsetLeft;
  };

  Measurements.prototype["[offset-top]"] = function(scope) {
    return scope.offsetTop;
  };

  Measurements.prototype.unwrap = function(property) {
    if (property.charAt(0) === '[') {
      return property.substring(1, property.length - 1);
    }
    return property;
  };

  Measurements.prototype.getStyle = function(element, property) {};

  Measurements.prototype.setStyle = function(element, property, value) {
    return element.style[this.unwrap(property)] = value;
  };

  Measurements.prototype.compute = function(id, property, continuation, old) {
    var current, def, method, object, path, value, _base, _base1;
    if (id.nodeType) {
      object = id;
      id = this.engine.identify(object);
    } else {
      object = this.engine[id];
    }
    path = property.charAt(0) === '[' && id + property || property;
    if ((def = this[path]) != null) {
      current = this.engine.values[path];
      if (current === void 0 || old === true) {
        if (typeof def === 'function') {
          value = this[path](object, continuation);
        } else {
          value = def;
        }
        if (value !== current) {
          ((_base = this.engine).computed || (_base.computed = {}))[path] = value;
        }
      }
      return value;
    } else if (property.indexOf('intrinsic-') > -1) {
      path = id + property;
      if (!this.engine.computed || (this.engine.computed[path] == null)) {
        if (value === void 0) {
          method = this[property] && property || 'getStyle';
          if (document.contains(object)) {
            value = this[method](object, property, continuation);
          } else {
            value = null;
          }
        }
        if (value !== old) {
          return ((_base1 = this.engine).computed || (_base1.computed = {}))[path] = value;
        }
      }
    } else {
      return this[property](object, continuation);
    }
  };

  Measurements.prototype.get = {
    command: function(continuation, object, property) {
      debugger;
      var computed, id;
      if (property) {
        if (typeof object === 'string') {
          id = object;
        } else if (object.absolute === 'window' || object === document) {
          id = '::window';
        } else if (object.nodeType) {
          id = this.engine.identify(object);
        }
      } else {
        id = '::global';
        property = object;
        object = void 0;
      }
      if (typeof continuation === 'object') {
        continuation = continuation.path;
      }
      if (property.indexOf('intrinsic-') > -1 || (this[property] != null) || (this[id + property] != null)) {
        computed = this.compute(id, property, continuation, true);
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
              scope = object.scope || document.body;
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
                if (fn = scope[def.method]) {
                  context = scope;
                } else {
                  fn = def.command;
                }
              }
            }
          }
          return fn.apply(context || object.context || this, args);
        };
      })(def, property));
    }
    return _results;
  };

  return Measurements;

})();

module.exports = Measurements;
