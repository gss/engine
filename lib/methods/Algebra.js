var Algebra, fn, property, _ref;

Algebra = (function() {
  function Algebra() {}

  Algebra.prototype["&&"] = function(a, b) {
    return a && b;
  };

  Algebra.prototype["||"] = function(a, b) {
    return a || b;
  };

  Algebra.prototype["!="] = function(a, b) {
    return a === b;
  };

  Algebra.prototype["=="] = function(a, b) {
    return a === b;
  };

  Algebra.prototype["<="] = function(a, b) {
    return a <= b;
  };

  Algebra.prototype[">="] = function(a, b) {
    return a >= b;
  };

  Algebra.prototype["<"] = function(a, b) {
    return a < b;
  };

  Algebra.prototype[">"] = function(a, b) {
    return a > b;
  };

  Algebra.prototype["+"] = function(a, b) {
    return a + b;
  };

  Algebra.prototype["-"] = function(a, b) {
    return a - b;
  };

  Algebra.prototype["*"] = function(a, b) {
    return a * b;
  };

  Algebra.prototype["/"] = function(a, b) {
    return a / b;
  };

  Algebra.prototype['Math'] = Math;

  Algebra.prototype['Infinity'] = Infinity;

  Algebra.prototype['NaN'] = NaN;

  Algebra.prototype.get = {
    command: function(operation, continuation, scope, meta, object, property) {
      var id;
      if (typeof object === 'string') {
        id = object;
      } else if (object.absolute === 'window' || object === document) {
        id = '::window';
      } else if (object.nodeType) {
        id = this.identity.provide(object);
      }
      if (!property) {
        id = '';
        property = object;
        object = void 0;
      }
      return ['get', id, property, this.getContinuation(continuation || '')];
    }
  };

  Algebra.prototype.set = {
    command: function() {
      var object;
      object = this.intrinsic || this.assumed;
      return object.set.apply(object, arguments);
    }
  };

  Algebra.prototype.suggest = {
    command: function() {
      return this.assumed.set.apply(this.assumed, arguments);
    }
  };

  Algebra.prototype.vary = function(value) {
    return value;
  };

  return Algebra;

})();

Algebra.prototype['*'].linear = false;

Algebra.prototype['/'].linear = false;

Algebra.prototype.vary.hidden = true;

_ref = Algebra.prototype;
for (property in _ref) {
  fn = _ref[property];
  if (typeof fn === 'function') {
    fn = (function(property, fn) {
      var func;
      return func = Algebra.prototype[property] = function(a, b) {
        var ap, bp;
        ap = this.isPrimitive(a);
        bp = this.isPrimitive(b);
        if (ap && bp) {
          return fn.apply(this, arguments);
        }
        return [property, a, b];
      };
    })(property, fn);
    fn.binary = true;
  }
}

module.exports = Algebra;
