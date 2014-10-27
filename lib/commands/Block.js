var Block, Command, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../concepts/Command');

Block = (function(_super) {
  __extends(Block, _super);

  function Block() {
    _ref = Block.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Block.prototype.type = 'Block';

  Block.prototype.signature = [
    {
      body: null
    }
  ];

  return Block;

})(Command);

Command.define.call(Block, {
  "scoped": {
    solve: function(engine, operation, continuation, scope, ascender, ascending) {
      if (operation.index === 2 && !ascender && (ascending != null)) {
        this._solve(engine, operation, continuation, ascending, operation);
        return false;
      }
    }
  }
});

module.exports = Block;
