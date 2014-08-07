var Domain, Finite,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Domain = require('../concepts/Domain');

Finite = (function(_super) {
  __extends(Finite, _super);

  Finite.prototype.priority = 100;

  Finite.prototype.Wrapper = require('../concepts/Wrapper');

  function Finite() {
    Finite.__super__.constructor.apply(this, arguments);
  }

  return Finite;

})(Domain);

Finite.prototype.Methods = (function() {
  function Methods() {}

  Methods.prototype.variable = function(name) {
    return this.solver.decl(name);
  };

  Methods.prototype['=='] = function(left, right) {
    return this.solver.eq(left, right);
  };

  Methods.prototype['!='] = function(left, right) {
    return this.solver.neq(left, right);
  };

  Methods.prototype['distinct'] = function() {
    return this.solver.distinct.apply(this.solver, arguments);
  };

  Methods.prototype['<='] = function(left, right) {
    return this.solver.lte(left, right);
  };

  Methods.prototype['>='] = function(left, right) {
    return this.solver.gte(left, right);
  };

  Methods.prototype['<'] = function(left, right) {
    return this.solver.lt(left, right);
  };

  Methods.prototype['>'] = function(left, right) {
    return this.solver.gt(left, right);
  };

  Methods.prototype['+'] = function(left, right) {
    return this.solver.plus(left, right);
  };

  Methods.prototype['-'] = function(left, right) {
    return this.solver.minus(left, right);
  };

  Methods.prototype['*'] = function(left, right) {
    return this.solver.times(left, right);
  };

  Methods.prototype['/'] = function(left, right) {
    return this.solver.divide(left, right);
  };

  return Methods;

})();

module.exports = Finite;
