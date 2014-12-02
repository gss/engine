var Axioms;

Axioms = (function() {
  function Axioms() {}

  Axioms.prototype.right = function(scope) {
    var id;
    id = this.identify(scope);
    return ['+', ['get', this.getPath(id, 'x')], ['get', this.getPath(id, 'width')]];
  };

  Axioms.prototype.bottom = function(scope, path) {
    var id;
    id = this.identify(scope);
    return ['+', ['get', this.getPath(id, 'y')], ['get', this.getPath(id, 'height')]];
  };

  Axioms.prototype.center = {
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

  return Axioms;

})();

module.exports = Axioms;
