var Styles;

Styles = (function() {
  Styles.Matrix = require('../lib/gl-matrix.js');

  function Styles(input) {
    this.input = input;
  }

  Styles.prototype.read = function(data) {};

  Styles.prototype.position = function(node, offsets) {};

  Styles.prototype.matrix = function(node, offsets) {};

  return Styles;

})();

module.exports = Elements;
