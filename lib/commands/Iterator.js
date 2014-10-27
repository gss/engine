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
      collection: ['Object'],
      body: null
    }
  ];

  Iterator.prototype.solve = function(engine, operation, continuation, scope, ascender, ascending) {
    if (operation.index === 2 && !ascender && (ascending != null)) {
      this._solve(engine, operation, continuation, ascending, operation);
      return false;
    }
  };

  Iterator.prototype.capture = function(engine, result, parent, continuation, scope) {
    if (!result.nodeType && !engine.isCollection(result) && typeof result !== 'string') {
      engine.provide(result);
      return true;
    }
  };

  return Iterator;

})(Command);

Command.define.call(Iterator({
  "rule": {
    index: 'rules'
  },
  "each": {}
}));

module.exports = Iterator;
