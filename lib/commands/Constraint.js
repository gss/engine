var Command, Constraint, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../concepts/Command');

Constraint = (function(_super) {
  __extends(Constraint, _super);

  function Constraint() {
    _ref = Constraint.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Constraint.prototype.type = 'Constraint';

  Constraint.prototype.signature = [
    {
      left: ['Value'],
      right: ['Value']
    }, [
      {
        strength: ['String'],
        weight: ['Number']
      }
    ]
  ];

  return Constraint;

})(Command);

Constraint.Constant = (function(_super) {
  __extends(Constant, _super);

  function Constant() {
    _ref1 = Constant.__super__.constructor.apply(this, arguments);
    return _ref1;
  }

  Constant.prototype.condition = function(left, right) {
    var name, variable;
    variable = null;
    if (left.variables) {
      for (name in left.variables) {
        if (variable) {
          return;
        }
        variable = name;
      }
    }
    if (right.variables) {
      for (name in right.variables) {
        if (variable) {
          return;
        }
        variable = name;
      }
    }
    return variable;
  };

  return Constant;

})(Constraint);

module.exports = Constraint;
