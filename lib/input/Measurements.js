var Measurements;

Measurements = (function() {
  function Measurements() {}

  Measurements.prototype.read = function() {
    return this.evaluate.apply(this, arguments);
  };

  Measurements.prototype.write = function() {
    return this.output.read.apply(this.output, arguments);
  };

  return Measurements;

})();

module.exports = Measurements;
