var Buffer, Engine, Space, Suggested, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Space = require('../concepts/Space');

Buffer = require('../concepts/Buffer');

Engine = require('../Engine');

Suggested = (function(_super) {
  var Commands;

  __extends(Suggested, _super);

  function Suggested() {
    _ref = Suggested.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Commands = (function() {
    function Commands() {}

    Commands.prototype["=="] = function(a, b) {
      return b;
    };

    Commands.prototype["<="] = function(a, b) {
      return Math.min(a, b);
    };

    Commands.prototype[">="] = function(a, b) {
      return Math.max(a, b);
    };

    Commands.prototype["<"] = function(a, b) {
      return Math.min(a, b - 1);
    };

    Commands.prototype[">"] = function(a, b) {
      return Math.max(a, b + 1);
    };

    return Commands;

  })();

  return Suggested;

})(Engine.include(Space, Buffer));

module.exports = Suggested;
