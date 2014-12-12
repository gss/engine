var Command, Iterator, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('./Command');

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
      body: ['Any']
    }
  ];

  Iterator.prototype["yield"] = function(result, engine, operation, continuation, scope) {
    var contd, op;
    if (operation.parent.indexOf(operation) === 1) {
      contd = this.delimit(continuation, this.DESCEND);
      op = operation.parent[2];
      op.command.solve(engine, op, contd, result);
      return true;
    }
  };

  Iterator.prototype.descend = function(engine, operation, continuation, scope, ascender, ascending) {
    var argument, command;
    argument = operation[1];
    command = argument.command || engine.Command(argument);
    argument.parent || (argument.parent = operation);
    command.solve(operation.domain || engine, argument, continuation, scope);
    return false;
  };

  return Iterator;

})(Command);

Iterator.define({
  "rule": {
    index: 'rules',
    advices: [
      function(engine, operation, command) {
        var parent;
        parent = operation;
        while (parent.parent) {
          parent = parent.parent;
        }
        operation.index = parent.rules = (parent.rules || 0) + 1;
      }
    ]
  },
  "each": {}
});

module.exports = Iterator;
