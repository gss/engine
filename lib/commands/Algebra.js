var Algebra, fn, property, _ref;

Algebra = (function() {
  function Algebra() {}

  Algebra.prototype.isPrimitive = function(object) {
    if (typeof object === 'object') {
      return object.valueOf !== Object.prototype.valueOf;
    }
    return true;
  };

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
      return Algebra.prototype[property] = function(a, b) {
        var args;
        args = [property];
        args.push.apply(args, arguments);
        if (!(this.isPrimitive(a) && this.isPrimitive(b))) {
          return args;
        }
        return fn.apply(this, arguments);
      };
    })(property, fn);
    fn.binary = true;
  }
}

module.exports = Algebra;
