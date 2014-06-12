var Equasions, _class, _ref;

Equasions = (function() {
  var c;

  function Equasions() {
    _ref = _class.apply(this, arguments);
    return _ref;
  }

  _class = Equasions.engine - (c = new c.SimplexSolver());

  Equasions.prototype.eq = function(a, b, s, w) {
    return c.Equation(a, b, s, w);
  };

  Equasions.prototype.lte = function(a, b, s, w) {
    return c.Inequality(a, c.LEQ, b, this.strength(s), this.weight(w));
  };

  Equasions.prototype.gte = function(a, b, s, w) {
    return c.Inequality(a, c.GEQ, b, this.strength(s), this.weight(w));
  };

  Equasions.prototype.lt = function(a, b, s, w) {
    return c.Inequality(a, c.LEQ, b, this.strength(s), this.weight(w));
  };

  Equasions.prototype.gt = function(a, b, s, w) {
    return c.Inequality(a, c.GEQ, b, this.strength(s), this.weight(w));
  };

  Equasions.prototype.plus = function(a, b) {
    return c.plus(a, b);
  };

  Equasions.prototype.minus = function(a, b) {
    return c.minus(a, b);
  };

  Equasions.prototype.multiply = function(a, b) {
    return c.times(a, b);
  };

  Equasions.prototype.divide = function(a, b) {
    return c.divide(a, b);
  };

  Equasions.prototype.edit = function(a, s, w) {
    return this.solver.addEditVar(a);
  };

  Equasions.prototype.suggest = function(a, b, s, w) {
    this.solver.solve();
    this._editvar(varr, this.strength(s), this.strength(w));
    this.solver.suggestValue(a, b);
    return this.solver.resolve();
  };

  Equasions.prototype.stay = function(path, v) {
    var i, _i, _ref1;
    for (i = _i = 1, _ref1 = arguments.length; 1 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 1 <= _ref1 ? ++_i : --_i) {
      this.solver.addStay(v);
    }
  };

  return Equasions;

})();

module.exports = Equasions;
