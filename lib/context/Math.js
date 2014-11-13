var Math;

Math = (function() {
  function Math() {}

  Math.prototype.plus = function(a, b) {
    return a + b;
  };

  Math.prototype.minus = function(a, b) {
    return a - b;
  };

  Math.prototype.multiply = function(a, b) {
    return a * b;
  };

  Math.prototype.divide = function(a, b) {
    return a / b;
  };

  return Math;

})();

module.exports = Math;
