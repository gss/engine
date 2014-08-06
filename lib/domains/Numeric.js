/* Domain: Solved values

Merges values from all other domains, 
enables anonymous constraints on immutable values
*/

var Domain, Numeric, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Domain = require('../concepts/Domain');

Numeric = (function(_super) {
  __extends(Numeric, _super);

  function Numeric() {
    _ref = Numeric.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Numeric.prototype.priority = 0;

  Numeric.prototype.Methods = (function() {
    function Methods() {}

    Methods.prototype["=="] = function(a, b) {
      return b;
    };

    Methods.prototype["<="] = function(a, b) {
      return Math.min(a, b);
    };

    Methods.prototype[">="] = function(a, b) {
      return Math.max(a, b);
    };

    Methods.prototype["<"] = function(a, b) {
      return Math.min(a, b - 1);
    };

    Methods.prototype[">"] = function(a, b) {
      return Math.max(a, b + 1);
    };

    Methods.prototype.isVariable = function(object) {
      return object[0] === 'get';
    };

    Methods.prototype.isConstraint = function(object) {
      return this.constraints[object[0]];
    };

    Methods.prototype.get = {
      command: function(operation, continuation, scope, meta, object, path) {
        return this.watch(object, path, operation, this.getContinuation(continuation || ""), scope);
      }
    };

    return Methods;

  })();

  return Numeric;

})(Domain);

module.exports = Numeric;
