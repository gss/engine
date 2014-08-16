/* Domain: Solved values

Merges values from all other domains, 
enables anonymous constraints on immutable values
*/

var Domain, Numeric, fn, property, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Domain = require('../concepts/Domain');

Numeric = (function(_super) {
  __extends(Numeric, _super);

  function Numeric() {
    _ref = Numeric.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Numeric.prototype.priority = 10;

  Numeric.prototype.url = null;

  return Numeric;

})(Domain);

Numeric.prototype.Methods = (function() {
  function Methods() {}

  Methods.prototype["&&"] = function(a, b) {
    return a && b;
  };

  Methods.prototype["||"] = function(a, b) {
    return a || b;
  };

  Methods.prototype["+"] = function(a, b) {
    debugger;
    return a + b;
  };

  Methods.prototype["-"] = function(a, b) {
    return a - b;
  };

  Methods.prototype["*"] = function(a, b) {
    return a * b;
  };

  Methods.prototype["/"] = function(a, b) {
    return a / b;
  };

  Methods.prototype['Math'] = Math;

  Methods.prototype['Infinity'] = Infinity;

  Methods.prototype['NaN'] = NaN;

  Methods.prototype.isVariable = function(object) {
    return object[0] === 'get';
  };

  Methods.prototype.isConstraint = function(object) {
    return this.constraints[object[0]];
  };

  Methods.prototype.get = {
    command: function(operation, continuation, scope, meta, object, path) {
      var method;
      method = operation.exported && 'get' || 'watch';
      console.error('!!!', method);
      return this[method](object, path, operation, this.getContinuation(continuation || ""), scope);
    }
  };

  return Methods;

})();

_ref1 = Numeric.prototype.Methods.prototype;
for (property in _ref1) {
  fn = _ref1[property];
  if (typeof fn === 'function') {
    fn = (function(property, fn) {
      var func;
      return func = Numeric.prototype.Methods.prototype[property] = function(a, b) {
        var ap, bp;
        ap = this.isPrimitive(a);
        bp = this.isPrimitive(b);
        if (ap && bp) {
          return fn.apply(this, arguments);
        }
        return [property, a, b];
      };
    })(property, fn);
    fn.binary = true;
  }
}

Numeric.prototype.Methods.prototype['*'].linear = false;

Numeric.prototype.Methods.prototype['/'].linear = false;

module.exports = Numeric;
