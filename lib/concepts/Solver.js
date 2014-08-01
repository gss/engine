var Solver;

require('../methods/Native');

Solver = (function() {
  function Solver() {}

  Solver.prototype.Solutions = Object;

  Solver.prototype.solve = function(reason, args) {
    if (!this.solutions) {
      return this.solutions = new this.Solutions;
    }
  };

  Solver.prototype.defer = function(reason) {
    var _this = this;
    if (this.solve.apply(this, arguments)) {
      return this.deferred != null ? this.deferred : this.deferred = Native.prototype.setImmediate(function() {
        _this.deferred = void 0;
        return _this.flush();
      }, 0);
    }
  };

  return Solver;

})();
