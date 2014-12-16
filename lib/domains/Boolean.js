var Boolean, Constraint, Numeric, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Numeric = require('./Numeric');

Constraint = require('../Constraint');

Boolean = (function(_super) {
  __extends(Boolean, _super);

  function Boolean() {
    _ref = Boolean.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Boolean.prototype.immutable = true;

  return Boolean;

})(Numeric);

Boolean.prototype.Constraint = Constraint.extend({
  signature: [
    {
      left: ['Variable', 'Number', 'Constraint'],
      right: ['Variable', 'Number', 'Constraint']
    }
  ]
}, {
  "&&": function(a, b) {
    return a && b;
  },
  "||": function(a, b) {
    debugger;
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

module.exports = Boolean;
