var Abstract, Domain, op, _fn, _i, _len, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Domain = require('../concepts/Domain');

Abstract = (function(_super) {
  __extends(Abstract, _super);

  function Abstract() {
    _ref = Abstract.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  return Abstract;

})(Domain);

Abstract.prototype.Methods = (function() {
  function Methods() {}

  Methods.prototype.get = {
    command: function(operation, continuation, scope, meta, object, property, contd) {
      var id, prop;
      console.error(object, property, operation, 555);
      if (typeof object === 'string') {
        id = object;
      } else if (object.absolute === 'window' || object === document) {
        id = '::window';
      } else if (object.nodeType) {
        id = this.identity.provide(object);
      }
      if (!property) {
        id = '';
        property = object;
        object = void 0;
      }
      if (object) {
        if (prop = this.properties[property]) {
          if (!prop.matcher) {
            return prop.call(this, object, contd);
          }
        }
      }
      return ['get', id, property, this.getContinuation(continuation || contd || '')];
    }
  };

  Methods.prototype.set = {
    command: function(operation, continuation, scope, meta, property, value) {
      if (this.intrinsic) {
        this.intrinsic.restyle(scope, property, value);
      } else {
        this.assumed.set(scope, property, value);
      }
    }
  };

  Methods.prototype.suggest = {
    command: function() {
      return this.assumed.set.apply(this.assumed, arguments);
    }
  };

  Methods.prototype.value = function(value, continuation, string, exported) {
    var op, property, scope;
    console.info(Array.prototype.slice.call(arguments));
    if (exported) {
      op = string.split(',');
      scope = op[1];
      property = op[2];
      this.engine.values[this.engine.getPath(scope, property)] = value;
    }
    return value;
  };

  return Methods;

})();

_ref1 = ['+', '-', '*', '/'];
_fn = function(op) {
  return Abstract.prototype.Methods.prototype[op] = function(a, b) {
    return [op, a, b];
  };
};
for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
  op = _ref1[_i];
  _fn(op);
}

module.exports = Abstract;
