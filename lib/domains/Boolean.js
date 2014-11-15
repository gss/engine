var Boolean, Command, Constraint, Numeric, Value, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Numeric = require('./Numeric');

Command = require('../concepts/Command');

Value = require('../commands/Value');

Constraint = require('../commands/Constraint');

Boolean = (function(_super) {
  __extends(Boolean, _super);

  function Boolean() {
    _ref = Boolean.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Boolean.prototype.immutable = true;

  return Boolean;

})(Numeric);

Boolean.prototype.Constraint = Constraint.extend({}, {
  "&&": function(a, b) {
    return a && b;
  },
  "||": function(a, b) {
    return a || b;
  },
  "!=": function(a, b) {
    return a === b;
  },
  "==": function(a, b) {
    return a === b;
  },
  "<=": function(a, b) {
    return a <= b;
  },
  ">=": function(a, b) {
    return a >= b;
  },
  "<": function(a, b) {
    return a < b;
  },
  ">": function(a, b) {
    return a > b;
  }
});

Boolean.prototype.Value = Value.Variable.extend({}, {
  get: function(path, engine) {
    return engine.values[path];
  }
});

module.exports = Boolean;
