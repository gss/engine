var Command, Easing, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../commands/Variable');

Easing = (function(_super) {
  __extends(Easing, _super);

  function Easing() {
    _ref = Easing.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Easing.condition = function(obj) {
    if (typeof obj === 'string') {
      if (obj = this.Type.Timings[obj]) {
        return obj;
      }
    } else if (obj[0] === 'steps' || obj[0] === 'cubic-bezier') {
      return obj;
    }
  };

  Easing.define({
    'ease': ['cubic-bezier', .42, 0, 1, 1],
    'ease-in': ['cubic-bezier', .42, 0, 1, 1],
    'ease-out': ['cubic-bezier', 0, 0, .58, 1],
    'ease-in-out': ['cubic-bezier', .42, 0, .58, 1],
    'linear': ['cubic-bezier', 0, 0, 1, 1],
    'step-start': 'step-start',
    'step-end': 'step-end'
  });

  return Easing;

})(Command);

module.exports = Easing;
