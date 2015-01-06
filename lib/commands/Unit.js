var Unit, Variable, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Variable = require('./Variable');

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

  Unit.define({
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

  return Unit;

})(Variable);

module.exports = Unit;
