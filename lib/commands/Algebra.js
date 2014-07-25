var Algebra, fn, property, _ref;

Algebra = (function() {
  function Algebra() {}

  Algebra.prototype["&&"] = function(a, b) {
    return a && b;
  };

  Algebra.prototype["||"] = function(a, b) {
    return a || b;
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

  return Algebra;

})();

_ref = Algebra.prototype;
for (property in _ref) {
  fn = _ref[property];
  if (property !== 'isPrimitive') {
    fn = (function(property, fn) {
      var func;
      return func = Algebra.prototype[property] = function(a, b, operation, continuation, scope, meta) {
        var ap, bp;
        ap = this.isPrimitive(a);
        bp = this.isPrimitive(b);
        if (!ap && !bp) {
          if (func.linear === false) {
            a = this.toPrimitive(a, operation[1], continuation);
            b = this.toPrimitive(b, operation[2], continuation);
            ap = this.isPrimitive(a);
            bp = this.isPrimitive(b);
          }
        }
        if (ap && bp) {
          return fn.apply(this, arguments);
        }
        if (!ap && !bp && func.linear === false) {
          this.console.warn(operation, 'is not linear, both operands are unknown');
        }
        return [property, a, b];
      };
    })(property, fn);
    fn.binary = true;
    fn.meta = true;
  }
}

Algebra.prototype['*'].linear = false;

Algebra.prototype['/'].linear = false;

module.exports = Algebra;
