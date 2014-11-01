var Command, Iterator, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../concepts/Command');

Iterator = (function(_super) {
  __extends(Iterator, _super);

  function Iterator() {
    _ref = Iterator.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Iterator.prototype.type = 'Iterator';

  Iterator.prototype.signature = [
    {
      collection: ['Query', 'Selector'],
      body: null
    }
  ];

  Iterator.prototype.provide = function(engine, result, operation, continuation, scope, ascender) {
    if (operation.index === 1) {
      operation[2].command.solve(engine, operation, continuation, ascending, operation);
      return false;
    }
  };

  Iterator.prototype.connect = function(engine, operation, continuation) {
    return this.engine.Continuation.get(continuation, null, this.DESCEND);
  };

  return Iterator;

})(Command);

Iterator.define({
  "rule": {
    index: 'rules'
  },
  "each": {}
});

module.exports = Iterator;
