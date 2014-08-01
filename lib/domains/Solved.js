/* Domain: Solved values

Merges values from all other domains, 
enables anonymous constraints on immutable values
*/

var Assumed, Solved, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Assumed = require('./Assumed');

Solved = (function(_super) {
  __extends(Solved, _super);

  function Solved() {
    _ref = Solved.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Solved.prototype.priority = Infinity;

  Solved.prototype["=="] = function(a, b) {
    return b;
  };

  Solved.prototype["<="] = function(a, b) {
    return Math.min(a, b);
  };

  Solved.prototype[">="] = function(a, b) {
    return Math.max(a, b);
  };

  Solved.prototype["<"] = function(a, b) {
    return Math.min(a, b - 1);
  };

  Solved.prototype[">"] = function(a, b) {
    return Math.max(a, b + 1);
  };

  Solved.prototype.isVariable = function(object) {
    return object[0] === 'get';
  };

  Solved.prototype.isConstraint = function(object) {
    return this.constraints[object[0]];
  };

  return Solved;

})(Assumed);

module.exports = Solved;
