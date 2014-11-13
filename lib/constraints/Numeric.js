var Numeric;

Numeric = (function() {
  function Numeric() {}

  Numeric.prototype["=="] = function(a, b) {
    return b;
  };

  Numeric.prototype["<="] = function(a, b) {
    return Math.min(a, b);
  };

  Numeric.prototype[">="] = function(a, b) {
    return Math.max(a, b);
  };

  Numeric.prototype["<"] = function(a, b) {
    return Math.min(a, b - 1);
  };

  Numeric.prototype[">"] = function(a, b) {
    return Math.max(a, b + 1);
  };

  return Numeric;

})();

module.exports = Algebra;
