var Dimensions;

Dimensions = (function() {
  function Dimensions() {}

  Dimensions.prototype.right = function(scope) {
    var id;
    id = this.identify(scope);
    return ['+', ['get', this.getPath(id, 'x')], ['get', this.getPath(id, 'width')]];
  };

  Dimensions.prototype.bottom = function(scope, path) {
    var id;
    id = this.identify(scope);
    return ['+', ['get', this.getPath(id, 'y')], ['get', this.getPath(id, 'height')]];
  };

  Dimensions.prototype.center = {
    x: function(scope, path) {
      var id;
      id = this.identify(scope);
      return ['+', ['get', this.getPath(id, 'x')], ['/', ['get', this.getPath(id, 'width')], 2]];
    },
    y: function(scope, path) {
      var id;
      id = this.identify(scope);
      return ['+', ['get', this.getPath(id, 'y')], ['/', ['get', this.getPath(id, 'height')], 2]];
    }
  };

  return Dimensions;

})();

module.exports = Dimensions;
