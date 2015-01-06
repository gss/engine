var Unit, Variable, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Variable = require('../Variable');

Unit = (function(_super) {
  __extends(Unit, _super);

  function Unit() {
    _ref = Unit.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Unit.prototype.signature = [
    {
      value: ['Variable', 'Number']
    }
  ];

  return Unit;

})(Variable);

Unit.define({
  px: function(value) {
    return value;
  },
  pt: function(value) {
    return value;
  },
  cm: function(value) {
    return value * 37.8;
  },
  mm: function(value) {
    return value * 3.78;
  },
  "in": function(value) {
    return value * 96;
  },
  deg: function(value) {
    return value * (Math.PI / 180);
  },
  grad: function(value) {
    return value * (Math.PI / 180) / (360 / 400);
  },
  turn: function(value) {
    return value * (Math.PI / 180) * 360;
  },
  rad: function(value) {
    return value;
  }
});

Unit.prototype.Dynamic = (function(_super) {
  __extends(Dynamic, _super);

  function Dynamic() {
    _ref1 = Dynamic.__super__.constructor.apply(this, arguments);
    return _ref1;
  }

  Dynamic.prototype.signature = [
    {
      value: ['Variable', 'Number']
    }
  ];

  Dynamic.define({
    em: function(value, engine, operation, continuation, scope) {
      return ['*', ['px', value], ['get', 'font-size']];
    },
    rem: function(value, engine, operation, continuation, scope) {
      return ['*', ['px', value], ['get', this.engine.getPath(engine.scope._gss_id, 'font-size')]];
    },
    vw: function(value, engine, operation, continuation, scope) {
      return ['*', ['/', ['px', value], 100], ['get', '::window[width]']];
    },
    vh: function(value, engine, operation, continuation, scope) {
      return ['*', ['/', ['px', value], 100], ['get', '::window[height]']];
    },
    vmin: function(value, engine, operation, continuation, scope) {
      return ['*', ['/', ['px', value], 100], ['min', ['get', '::window[height]'], ['get', '::window[width]']]];
    },
    vmax: function(value, engine, operation, continuation, scope) {
      return ['*', ['/', ['px', value], 100], ['max', ['get', '::window[height]'], ['get', '::window[width]']]];
    }
  });

  return Dynamic;

})(Variable);

module.exports = Unit;
