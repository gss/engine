var Equasions;

Equasions = (function() {
  function Equasions() {}

  Equasions.prototype["[right]"] = function(scope, path) {
    return this._plus(this._get(scope, "[x]", path), this._get(scope, "[width]", path));
  };

  Equasions.prototype["[bottom]"] = function(scope, path) {
    return this._plus(this._get(scope, "[y]", path), this._get(scope, "[height]", path));
  };

  Equasions.prototype["[center-x]"] = function(scope, path) {
    return this._plus(this._get(scope, "[x]", path), this._divide(this._get(scope, "[width]", path), 2));
  };

  Equasions.prototype["[center-y]"] = function(scope, path) {
    return this._plus(this._get(scope, "[y]", path), this._divide(this._get(scope, "[height]", path), 2));
  };

  return Equasions;

})();

module.exports = Equasions;
