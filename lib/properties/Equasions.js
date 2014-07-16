var Equasions;

Equasions = (function() {
  function Equasions() {}

  Equasions.prototype.right = function(scope, path) {
    return this['_+'](this._get(scope, "x", path), this._get(scope, "width", path));
  };

  Equasions.prototype.bottom = function(scope, path) {
    debugger;
    return this['_+'](this._get(scope, "y", path), this._get(scope, "height", path));
  };

  Equasions.prototype.center = {
    x: function(scope, path) {
      return this['_+'](this._get(scope, "x", path), this['_/'](this._get(scope, "width", path), 2));
    },
    y: function(scope, path) {
      return this['_+'](this._get(scope, "y", path), this['_/'](this._get(scope, "height", path), 2));
    }
  };

  return Equasions;

})();

module.exports = Equasions;
