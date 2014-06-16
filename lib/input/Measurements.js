var Measurements;

Measurements = (function() {
  function Measurements(engine) {
    this.engine = engine;
  }

  Measurements.prototype.read = function(id, prop) {
    var position;
    position = this[id] || (this[id] = {});
    return position = this[id] || (this[id] = {});
  };

  Measurements.prototype.measure = function(node) {
    return node.offsetWidth;
  };

  Measurements.prototype.write = function() {
    return this.output.read.apply(this.output, arguments);
  };

  return Measurements;

})();

module.exports = Measurements;
