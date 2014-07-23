var Equasions;

Equasions = (function() {
  function Equasions() {}

  Equasions.prototype.right = function(scope, path) {
    return this['+'](this.get(scope, "x", path), this.get(scope, "width", path));
  };

  Equasions.prototype.bottom = function(scope, path) {
    return this['+'](this.get(scope, "y", path), this.get(scope, "height", path));
  };

  Equasions.prototype.center = {
    x: function(scope, path) {
      return this['+'](this.get(scope, "x", path), this['/'](this.get(scope, "width", path), 2));
    },
    y: function(scope, path) {
      return this['+'](this.get(scope, "y", path), this['/'](this.get(scope, "height", path), 2));
    }
  };

  return Equasions;

})();

module.exports = Equasions;
