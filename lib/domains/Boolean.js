var Boolean, Numeric, property, value, _fn, _ref, _ref1, _ref2,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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

Boolean.prototype.Methods = (function() {
  function Methods() {}

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

  Methods.prototype.get = function(object, property) {
    var path;
    path = this.engine.Variable.getPath(object, property);
    if (this.intrinsic.properties[path]) {
      return this.intrinsic.get(null, path);
    }
    return this.values[path];
  };

  return Methods;

})();

_ref1 = Boolean.prototype.Methods.prototype;
_fn = function(property, value) {
  return Boolean.prototype.Methods.prototype[property] = function(a, b) {
    if ((a != null) && (b != null)) {
      if (typeof a !== 'object' && typeof b !== 'object') {
        return value.call(this, a, b);
      } else {
        return [property, a, b];
      }
    }
  };
};
for (property in _ref1) {
  value = _ref1[property];
  _fn(property, value);
}

module.exports = Boolean;

_ref2 = Numeric.prototype.Methods.prototype;
for (property in _ref2) {
  value = _ref2[property];
  Boolean.prototype.Methods.prototype[property] = value;
}
