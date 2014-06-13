var Styles;

Styles = (function() {
  Styles.Matrix = require('../../vendor/gl-matrix.js');

  function Styles(input) {
    this.input = input;
  }

  Styles.prototype.read = function(data) {};

  Styles.prototype.position = function(node, offsets) {};

  Styles.prototype.matrix = function(node, offsets) {};

  return Styles;

})();

module.exports = Styles;
