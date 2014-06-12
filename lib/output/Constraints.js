var Constraints;

Constraints = (function() {
  function Constraints(engine) {
    this.engine = engine;
    this.solver = new c.SimplexSolver();
  }

  Constraints.prototype.read = function() {};

  Constraints.prototype.write = function() {};

  Constraints.prototype.eq = function(a, b, s, w) {
    return c.Equation(a, b, s, w);
  };

  Constraints.prototype.lte = function(a, b, s, w) {
    return c.Inequality(a, c.LEQ, b, this.strength(s), this.weight(w));
  };

  Constraints.prototype.gte = function(a, b, s, w) {
    return c.Inequality(a, c.GEQ, b, this.strength(s), this.weight(w));
  };

  Constraints.prototype.lt = function(a, b, s, w) {
    return c.Inequality(a, c.LEQ, b, this.strength(s), this.weight(w));
  };

  Constraints.prototype.gt = function(a, b, s, w) {
    return c.Inequality(a, c.GEQ, b, this.strength(s), this.weight(w));
  };

  Constraints.prototype.plus = function(a, b) {
    return c.plus(a, b);
  };

  Constraints.prototype.minus = function(a, b) {
    return c.minus(a, b);
  };

  Constraints.prototype.multiply = function(a, b) {
    return c.times(a, b);
  };

  Constraints.prototype.divide = function(a, b) {
    return c.divide(a, b);
  };

  Constraints.prototype.edit = function(a, s, w) {
    return this.solver.addEditVar(a);
  };

  Constraints.prototype.suggest = function(a, b, s, w) {
    this.solver.solve();
    this._editvar(varr, this.strength(s), this.strength(w));
    this.solver.suggestValue(a, b);
    return this.solver.resolve();
  };

  Constraints.prototype.stay = function(path, v) {
    var i, _i, _ref;
    for (i = _i = 1, _ref = arguments.length; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
      this.solver.addStay(v);
    }
  };

  return Constraints;

})();

module.exports = Constraints;
