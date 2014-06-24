var Constraints, method, property, _ref;

require('cassowary');

Constraints = (function() {
  function Constraints() {}

  Constraints.prototype.onConstraint = function(node, args, result, operation, continuation, scope) {
    var arg, _i, _len;
    for (_i = 0, _len = args.length; _i < _len; _i++) {
      arg = args[_i];
      if (arg.path) {
        (result.variables || (result.variables = [])).push(arg);
      }
    }
    return result;
  };

  Constraints.prototype.get = function(scope, property, path) {
    var variable;
    if (typeof this[property] === 'function') {
      variable = this[property](scope);
    } else {
      variable = this["var"]((scope || '') + property);
    }
    variable.path = path || scope || '';
    return variable;
  };

  Constraints.prototype.remove = function() {
    var constrain, constraints, path, solutions, _i, _j, _len;
    solutions = this.engine.solutions;
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      path = arguments[_i];
      if (constraints = solutions[path]) {
        for (_j = constraints.length - 1; _j >= 0; _j += -1) {
          constrain = constraints[_j];
          solutions.remove(constrain, path);
        }
      }
    }
    return this;
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

  Constraints.prototype.eq = function(left, right, strength, weight) {
    return new c.Equation(left, right, this.strength(strength), this.weight(weight));
  };

  Constraints.prototype.lte = function(left, right, strength, weight) {
    return new c.Inequality(left, c.LEQ, right, this.strength(strength), this.weight(weight));
  };

  Constraints.prototype.gte = function(left, right, strength, weight) {
    return new c.Inequality(left, c.GEQ, right, this.strength(strength), this.weight(weight));
  };

  Constraints.prototype.lt = function(left, right, strength, weight) {
    return new c.Inequality(left, c.LEQ, right, this.strength(strength), this.weight(weight));
  };

  Constraints.prototype.gt = function(left, right, strength, weight) {
    return new c.Inequality(left, c.GEQ, right, this.strength(strength), this.weight(weight));
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

  return Constraints;

})();

_ref = Constraints.prototype;
for (property in _ref) {
  method = _ref[property];
  method.callback = 'onConstraint';
}

module.exports = Constraints;
