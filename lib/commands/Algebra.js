var Algebra, fn, property, _ref;

Algebra = (function() {
  function Algebra() {}

  Algebra.prototype.isPrimitive = function(object) {
    if (typeof object === 'object') {
      return object.valueOf !== Object.prototype.valueOf;
    }
    return true;
  };

  Algebra.prototype.eq = function(a, b) {
    return a === b;
  };

  Algebra.prototype.lte = function(a, b) {
    return a <= b;
  };

  Algebra.prototype.gte = function(a, b) {
    return a >= b;
  };

  Algebra.prototype.lt = function(a, b) {
    return a < b;
  };

  Algebra.prototype.gt = function(a, b) {
    return a > b;
  };

  Algebra.prototype.plus = function(a, b) {
    return a + b;
  };

  Algebra.prototype.minus = function(a, b) {
    return a - b;
  };

  Algebra.prototype.multiply = function(a, b) {
    return a * b;
  };

  Algebra.prototype.divide = function(a, b) {
    return a / b;
  };

  return Algebra;

})();

_ref = Algebra.prototype;
for (property in _ref) {
  fn = _ref[property];
  if (property !== 'isPrimitive') {
    fn = (function(property, fn) {
      return Algebra.prototype[property] = function(a, b) {
        if (!(this._isPrimitive(a) && this._isPrimitive(b))) {
          return NaN;
        }
        fn.binary = true;
        return fn.apply(this, arguments);
      };
    })(property, fn);
  }
}

module.exports = Algebra;
