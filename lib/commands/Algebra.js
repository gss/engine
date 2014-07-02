var Algebra, fn, property, _ref;

Algebra = (function() {
  function Algebra() {}

  Algebra.prototype.isPrimitive = function(object) {
    if (typeof object === 'object') {
      return object.valueOf !== Object.prototype.valueOf;
    }
    return true;
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

  return Algebra;

})();

_ref = Algebra.prototype;
for (property in _ref) {
  fn = _ref[property];
  if (property !== 'isPrimitive') {
    fn = (function(property, fn) {
      return Algebra.prototype[property] = function(a, b) {
        if (!(this._isPrimitive(a) && this._isPrimitive(b))) {
          return [property, a, b];
        }
        return fn.apply(this, arguments);
      };
    })(property, fn);
    fn.binary = true;
  }
}

module.exports = Algebra;
