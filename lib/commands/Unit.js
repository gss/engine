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

  Unit.prototype.getProperty = function(operation) {
    var parent;
    parent = operation;
    while (parent = parent.parent) {
      if (parent.command.type === 'Assignment') {
        return parent[1];
      }
    }
  };

  Unit.prototype.Dependencies = {
    'margin-top': 'containing-width',
    'margin-top': 'containing-width',
    'margin-right': 'containing-width',
    'margin-left': 'containing-width',
    'padding-top': 'containing-width',
    'padding-top': 'containing-width',
    'padding-right': 'containing-width',
    'padding-left': 'containing-width',
    'left': 'containing-width',
    'right': 'containing-width',
    'width': 'containing-width',
    'min-width': 'containing-width',
    'max-width': 'containing-width',
    'text-width': 'containing-width',
    'top': 'containing-height',
    'bottom': 'containing-height',
    'height': 'containing-height',
    'font-size': 'containing-font-size',
    'vertical-align': 'line-height',
    'background-position-x': 'width',
    'background-position-y': 'height'
  };

  Unit.define({
    '%': function(value, engine, operation, continuation, scope) {
      var path, property;
      property = this.Dependencies[this.getProperty(operation)] || 'containing-width';
      path = engine.getPath(scope, property);
      return ['*', ['px', value], ['get', path]];
    },
    em: function(value, engine, operation, continuation, scope) {
      var path;
      path = engine.getPath(scope, 'computed-font-size');
      return ['*', ['px', value], ['get', path]];
    },
    rem: function(value, engine, operation, continuation, scope) {
      var path;
      path = this.engine.getPath(engine.scope._gss_id, 'computed-font-size');
      return ['*', ['px', value], ['get', path]];
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
    },
    vmax: function(value, engine, operation, continuation, scope) {
      return ['*', ['/', ['px', value], 100], ['max', ['get', '::window[height]'], ['get', '::window[width]']]];
    }
  });

  return Unit;

})(Variable);

module.exports = Unit;
