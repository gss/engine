var Domain, Linear, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Domain = require('../concepts/Domain');

Linear = (function(_super) {
  __extends(Linear, _super);

  function Linear() {
    _ref = Linear.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Linear.prototype.priority = -100;

  Linear.prototype.Solver = require('cassowary');

  Linear.prototype.Wrapper = require('../concepts/Wrapper');

  Linear.prototype.isVariable = function(object) {
    return object instanceof c.Variable;
  };

  Linear.prototype.isConstraint = function(object) {
    return object instanceof c.Constraint;
  };

  Linear.prototype.isExpression = function(object) {
    return object instanceof c.Expression;
  };

  Linear.prototype.setup = function() {
    Domain.prototype.setup.apply(this, arguments);
    if (!this.hasOwnProperty('solver')) {
      this.solver = new c.SimplexSolver();
      this.solver.autoSolve = false;
      return c.debug = true;
    }
  };

  Linear.prototype.provide = function(result) {
    this.constrain(result);
  };

  Linear.prototype.solve = function() {
    Domain.prototype.solve.apply(this, arguments);
    if (this.constrained) {
      this.solver.solve();
    } else {
      this.solver.resolve();
    }
    return this.apply(this.solver._changed);
  };

  Linear.prototype.constrain = function(constraint) {
    if (!Linear.__super__.constrain.apply(this, arguments)) {
      return this.solver.addConstraint(constraint);
    }
  };

  Linear.prototype.unconstrain = function(constraint) {
    this.solver.removeConstraint(constraint);
    return Linear.__super__.unconstrain.apply(this, arguments);
  };

  Linear.prototype.undeclare = function(variable) {
    var cei;
    if (!Linear.__super__.undeclare.apply(this, arguments)) {
      if (variable.editing) {
        if (cei = this.solver._editVarMap.get(variable)) {
          this.solver.removeColumn(cei.editMinus);
          return this.solver._editVarMap["delete"](variable);
        }
      }
    }
  };

  Linear.prototype.edit = function(variable, strength, weight, continuation) {
    var constraint;
    constraint = new c.EditConstraint(variable, this.strength(strength, 'strong'), this.weight(weight));
    this.constrain(constraint);
    variable.editing = constraint;
    return constraint;
  };

  Linear.prototype.nullify = function(variable) {
    return this.solver._externalParametricVars["delete"](variable);
  };

  Linear.prototype.suggest = function(path, value, strength, weight, continuation) {
    var variable, variables, _base;
    if (typeof path === 'string') {
      if (!(variable = this.variables[path])) {
        if (continuation) {
          variable = this.declare(path);
          variables = ((_base = this.variables)[continuation] || (_base[continuation] = []));
          variables.push(variable);
        } else {
          return this.verify(path, value);
        }
      }
    } else {
      variable = path;
    }
    if (!variable.editing) {
      this.edit(variable, strength, weight, continuation);
    }
    this.solver.suggestValue(variable, value);
    return variable;
  };

  Linear.prototype.variable = function(name) {
    return new c.Variable({
      name: name
    });
  };

  Linear.prototype.stay = function() {
    var arg, _i, _len;
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      arg = arguments[_i];
      this.solver.addStay(arg);
    }
  };

  return Linear;

})(Domain);

Linear.prototype.Methods = (function(_super) {
  __extends(Methods, _super);

  function Methods() {
    _ref1 = Methods.__super__.constructor.apply(this, arguments);
    return _ref1;
  }

  Methods.prototype.get = {
    command: function(operation, continuation, scope, meta, object, property, path) {
      var variable;
      if (typeof this.properties[property] === 'function' && scope && scope !== this.scope) {
        return this.properties[property].call(this, object, object);
      } else {
        variable = this.declare(this.getPath(object, property), operation);
      }
      return [variable, path || (property && object) || ''];
    }
  };

  Methods.prototype.strength = function(strength, deflt) {
    if (deflt == null) {
      deflt = 'medium';
    }
    return strength && c.Strength[strength] || c.Strength[deflt];
  };

  Methods.prototype.weight = function(weight) {
    return weight;
  };

  Methods.prototype.varexp = function(name) {
    return new c.Expression({
      name: name
    });
  };

  Methods.prototype.suggest = function() {
    return this.suggest.apply(this, arguments);
  };

  Methods.prototype['=='] = function(left, right, strength, weight) {
    return new c.Equation(left, right, this.strength(strength), this.weight(weight));
  };

  Methods.prototype['<='] = function(left, right, strength, weight) {
    return new c.Inequality(left, c.LEQ, right, this.strength(strength), this.weight(weight));
  };

  Methods.prototype['>='] = function(left, right, strength, weight) {
    return new c.Inequality(left, c.GEQ, right, this.strength(strength), this.weight(weight));
  };

  Methods.prototype['<'] = function(left, right, strength, weight) {
    return new c.Inequality(left, c.LEQ, right, this.strength(strength), this.weight(weight));
  };

  Methods.prototype['>'] = function(left, right, strength, weight) {
    return new c.Inequality(left, c.GEQ, right, this.strength(strength), this.weight(weight));
  };

  Methods.prototype['+'] = function(left, right, strength, weight) {
    return c.plus(left, right);
  };

  Methods.prototype['-'] = function(left, right, strength, weight) {
    return c.minus(left, right);
  };

  Methods.prototype['*'] = function(left, right, strength, weight) {
    return c.times(left, right);
  };

  Methods.prototype['/'] = function(left, right, strength, weight) {
    return c.divide(left, right);
  };

  return Methods;

})(Domain.prototype.Methods);

module.exports = Linear;
