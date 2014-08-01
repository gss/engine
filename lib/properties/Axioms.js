var Axioms;

Axioms = (function() {
  function Axioms() {}

  Axioms.prototype.right = function(scope, path) {
    return this['+'](this.get(scope, "x", path), this.get(scope, "width", path));
  };

  Axioms.prototype.bottom = function(scope, path) {
    return this['+'](this.get(scope, "y", path), this.get(scope, "height", path));
  };

  Axioms.prototype.center = {
    x: function(scope, path) {
      return this['+'](this.get(scope, "x", path), this['/'](this.get(scope, "width", path), 2));
    },
    y: function(scope, path) {
      return this['+'](this.get(scope, "y", path), this['/'](this.get(scope, "height", path), 2));
    }
  };

  return Axioms;

})();

module.exports = Axioms;
