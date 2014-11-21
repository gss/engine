var Command, Unit, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../concepts/Command');

Unit = (function(_super) {
  __extends(Unit, _super);

  function Unit() {
    _ref = Unit.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Unit.prototype.type = 'Unit';

  Unit.prototype.signature = [
    {
      value: ['Variable']
    }
  ];

  return Unit;

})(Command);

Unit.define({
  px: function(value) {
    return value;
  },
  pt: function(value) {
    return value;
  },
  cm: function(value) {
    return this['*'](value, 37.8);
  },
  mm: function(value) {
    return this['*'](value, 3.78);
  },
  "in": function(value) {
    return this['*'](value, 96);
  },
  deg: function(value) {
    return this['*'](value, Math.PI / 180);
  },
  grad: function(value) {
    return this.deg(this['/'](value, 360 / 400));
  },
  turn: function(value) {
    return this.deg(this['*'](value, 360));
  },
  rad: function(value) {
    return value;
  }
});

Unit.define({
  em: function(value, engine, operation, continuation, scope) {
    return this['*'](this.get(scope, 'font-size', continuation), value);
  },
  rem: function(value, engine, operation, continuation, scope) {
    return this['*'](this.get('::window', 'font-size', continuation), value);
  },
  vw: function(value, engine, operation, continuation, scope) {
    return this['*'](this['/'](this.get('::window', 'width', continuation), 100), value);
  },
  vh: function(value, engine, operation, continuation, scope) {
    return this['*'](this['/'](this.get('::window', 'height', continuation), 100), value);
  },
  vmin: function(value, engine, operation, continuation, scope) {
    return this['*'](this['/'](this.get('::window', 'min', continuation), 100), value);
  },
  vmax: function(value, engine, operation, continuation, scope) {
    return this['*'](this['/'](this.get('::window', 'max', continuation), 100), value);
  }
});

module.exports = Unit;
