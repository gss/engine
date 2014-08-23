var Boolean, Numeric, Selectors, property, value, _ref, _ref1, _ref2,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Selectors = require('../methods/Selectors');

Numeric = require('./Numeric');

Boolean = (function(_super) {
  __extends(Boolean, _super);

  function Boolean() {
    _ref = Boolean.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Boolean.prototype.immutable = true;

  return Boolean;

})(Numeric);

Boolean.prototype.Methods = (function(_super) {
  __extends(Methods, _super);

  function Methods() {
    _ref1 = Methods.__super__.constructor.apply(this, arguments);
    return _ref1;
  }

  Methods.prototype["!="] = function(a, b) {
    return a === b;
  };

  Methods.prototype["=="] = function(a, b) {
    return a === b;
  };

  Methods.prototype["<="] = function(a, b) {
    return a <= b;
  };

  Methods.prototype[">="] = function(a, b) {
    return a >= b;
  };

  Methods.prototype["<"] = function(a, b) {
    return a < b;
  };

  Methods.prototype[">"] = function(a, b) {
    return a > b;
  };

  return Methods;

})(Numeric.prototype.Methods);

_ref2 = Selectors.prototype;
for (property in _ref2) {
  value = _ref2[property];
  Boolean.prototype.Methods.prototype[property] = value;
}

module.exports = Boolean;
