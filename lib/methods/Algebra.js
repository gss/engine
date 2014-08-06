var Algebra;

Algebra = (function() {
  var fn, property, _ref;

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

  Algebra.prototype['solved'] = function(value) {
    return value;
  };

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

  return Algebra;

})();

Algebra.prototype['*'].linear = false;

Algebra.prototype['/'].linear = false;

module.exports = Algebra;
