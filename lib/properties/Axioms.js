var Axioms;

Axioms = (function() {
  function Axioms() {}

  Axioms.prototype.right = function(scope) {
    var id;
    id = this.identity["yield"](scope);
    return ['+', ['get', id + '[x]'], ['get', id + '[width]']];
  };

  Axioms.prototype.bottom = function(scope, path) {
    var id;
    id = this.identity["yield"](scope);
    return ['+', ['get', id + '[y]'], ['get', id + '[height]']];
  };

  Axioms.prototype.center = {
    x: function(scope, path) {
      var id;
      id = this.identity["yield"](scope);
      return ['+', ['get', id + '[x]'], ['/', ['get', id + '[width]'], 2]];
    },
    y: function(scope, path) {
      var id;
      id = this.identity["yield"](scope);
      return ['+', ['get', id + '[y]'], ['/', ['get', id + '[height]'], 2]];
    }
  };

  return Axioms;

})();

module.exports = Axioms;
