var Constraints;

require('cassowary');

Constraints = (function() {
  function Constraints() {}

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
    return c.Expression({
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

module.exports = Constraints;
