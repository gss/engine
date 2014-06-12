var Elements;

Elements = (function() {
  Elements.Matrix = require('../lib/gl-matrix.js');

  function Elements(engine) {
    this.engine = engine;
    this.input = this.engine;
    this.output = output;
  }

  Elements.prototype.position = function(node, offsets) {};

  Elements.prototype.matrix = function(node, offsets) {};

  return Elements;

})();

module.exports = Elements;
