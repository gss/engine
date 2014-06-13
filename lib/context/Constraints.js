var Constraints, command, property, _ref;

require('cassowary');

Constraints = (function() {
  function Constraints(input, output) {
    this.input = input;
    this.output = output;
    this.solver = new c.SimplexSolver();
  }

  Constraints.prototype.onConstraint = function(engine, scope, args, result, operation, continuation) {
    return this.solver.addConstraint(result);
  };

  Constraints.prototype.get = function(property, scope) {
    if (typeof this[property] === 'function') {
      return this[property](scope);
    }
    return this["var"]((scope || '') + property);
  };

  Constraints.prototype["var"] = function(name) {
    return new c.Variable({
      name: name
    });
  };

  Constraints.prototype.strength = function(strength) {
    return strength;
  };

  Constraints.prototype.weight = function(weight) {
    return weight;
  };

  Constraints.prototype.varexp = function(name) {
    return new c.Expression({
      name: name
    });
  };

  Constraints.prototype.eq = function(path, left, right, strength, weight) {
    return new c.Equation(left, right, this.strength(strength), this.weight(weight));
  };

  Constraints.prototype.lte = function(path, left, right, strength, weight) {
    return c.Inequality(left, c.LEQ, right, this.strength(strength), this.weight(weight));
  };

  Constraints.prototype.gte = function(left, right, strength, weight) {
    return c.Inequality(left, c.GEQ, right, this.strength(strength), this.weight(weight));
  };

  Constraints.prototype.lt = function(left, right, strength, weight) {
    return c.Inequality(left, c.LEQ, right, this.strength(strength), this.weight(weight));
  };

  Constraints.prototype.gt = function(left, right, strength, weight) {
    return c.Inequality(left, c.GEQ, right, this.strength(strength), this.weight(weight));
  };

  Constraints.prototype.plus = function(left, right, strength, weight) {
    return c.plus(left, right);
  };

  Constraints.prototype.minus = function(left, right, strength, weight) {
    return c.minus(left, right);
  };

  Constraints.prototype.multiply = function(left, right, strength, weight) {
    return c.times(left, right);
  };

  Constraints.prototype.divide = function(left, right, strength, weight) {
    return c.divide(a, right);
  };

  Constraints.prototype.edit = function(variable) {
    return this.solver.addEditVar(variable);
  };

  Constraints.prototype.suggest = function(variable, value, strength, weight) {
    this.solver.solve();
    this.edit(variable, this.strength(strength), this.weight(weight));
    this.solver.suggestValue(variable, value);
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

_ref = Constraints.prototype;
for (property in _ref) {
  command = _ref[property];
  if (command && command.type === 'constraint') {
    command.callback = 'onConstraint';
  }
}

module.exports = Constraints;
