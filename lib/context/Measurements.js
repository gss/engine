var Measurements;

Measurements = (function() {
  function Measurements() {}

  Measurements.prototype.onFlush = function(buffer) {
    debugger;
    var commands, property, value, _ref;
    if (!this.computed) {
      return buffer;
    }
    commands = [];
    _ref = this.computed;
    for (property in _ref) {
      value = _ref[property];
      if (this.engine.values[property] === value) {
        continue;
      }
      commands.push(['suggest', property, value, 'required']);
    }
    this.computed = void 0;
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

  Measurements.prototype.compute = function(id, property, continuation, old) {
    var method, object, path, value;
    if (id.nodeType) {
      object = id;
      id = this.engine.identify(object);
    } else if (property) {
      object = this.engine[id];
    }
    if (property.indexOf('intrinsic-') > -1) {
      path = id + property;
      if (!this.computed || (this.computed[path] == null)) {
        if (value === void 0) {
          method = this[property] && property || 'getStyle';
          if (document.contains(object)) {
            value = this[method](object, property, continuation);
          } else {
            value = null;
          }
        }
        if (value !== old) {
          return (this.computed || (this.computed = {}))[path] = value;
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
        if (object.absolute === 'window' || object === document) {
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
      if (property.indexOf('intrinsic-') > -1 || this[property]) {
        computed = this.compute(id, property, continuation);
        if (typeof computed === 'object') {
          return computed;
        }
      }
      return ['get', id, property, continuation || ''];
    }
  };

  return Measurements;

})();

module.exports = Measurements;
