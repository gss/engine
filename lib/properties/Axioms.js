var Axioms;

Axioms = (function() {
  function Axioms() {}

  Axioms.prototype.right = function(scope, path) {
    return this['+'](this._get(scope, "x", path), this._get(scope, "width", path));
  };

  Axioms.prototype.bottom = function(scope, path) {
    return this['+'](this._get(scope, "y", path), this._get(scope, "height", path));
  };

  Axioms.prototype.center = {
    x: function(scope, path) {
      console.error("CENTER X", scope, path);
      return this['+'](this._get(scope, "x", path), this['/'](this._get(scope, "width", path), 2));
    },
    y: function(scope, path) {
      return this['+'](this._get(scope, "y", path), this['/'](this._get(scope, "height", path), 2));
    }
  };

  return Axioms;

})();

module.exports = Axioms;
