var Command, Constraint, Domain, Finite, Variable,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Domain = require('../Domain');

Command = require('../Command');

Variable = require('../commands/Variable');

Constraint = require('../commands/Constraint');

Finite = (function(_super) {
  __extends(Finite, _super);

  Finite.prototype.priority = -10;

  function Finite() {
    Finite.__super__.constructor.apply(this, arguments);
  }

  Finite.prototype.variable = function(name) {
    return this.solver.decl(name);
  };

  return Finite;

})(Domain);

Finite.Constraint = Constraint.extend({}, {
  '==': function(left, right) {
    return this.solver.eq(left, right);
  },
  '!=': function(left, right) {
    return this.solver.neq(left, right);
  },
  'distinct': function() {
    return this.solver.distinct.apply(this.solver, arguments);
  },
  '<=': function(left, right) {
    return this.solver.lte(left, right);
  },
  '>=': function(left, right) {
    return this.solver.gte(left, right);
  },
  '<': function(left, right) {
    return this.solver.lt(left, right);
  },
  '>': function(left, right) {
    return this.solver.gt(left, right);
  }
});

Finite.Variable = Variable.extend({
  group: 'finite'
});

Finite.Variable.Expression = Variable.Expression.extend({
  group: 'finite'
}, {
  '+': function(left, right) {
    return this.solver.plus(left, right);
  },
  '-': function(left, right) {
    return this.solver.minus(left, right);
  },
  '*': function(left, right) {
    return this.solver.product(left, right);
  },
  '/': function(left, right) {
    return this.solver.divide(left, right);
  }
});

module.exports = Finite;
