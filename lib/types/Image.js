var Command, Gradient,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../Command');

Gradient = (function(_super) {
  __extends(Gradient, _super);

  function Gradient(obj) {
    switch (typeof obj) {
      case 'object':
        if (Gradient[obj[0]]) {
          return obj;
        }
    }
  }

  Gradient.define({
    'linear-gradient': function() {},
    'radial-gradient': function() {},
    'repeating-linear-gradient': function() {},
    'repeating-radial-gradient': function() {}
  });

  return Gradient;

})(Command);

module.exports = Gradient;
