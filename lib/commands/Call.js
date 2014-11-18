var Call, Command, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../concepts/Command');

Call = (function(_super) {
  __extends(Call, _super);

  function Call() {
    _ref = Call.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Call.prototype.type = 'Call';

  Call.prototype.signature = [
    {
      value: ['Value']
    }
  ];

  return Call;

})(Command);

Call.Unsafe = (function(_super) {
  __extends(Unsafe, _super);

  function Unsafe() {
    _ref1 = Unsafe.__super__.constructor.apply(this, arguments);
    return _ref1;
  }

  Unsafe.prototype.signature = false;

  return Unsafe;

})(Call);

module.exports = Call;
