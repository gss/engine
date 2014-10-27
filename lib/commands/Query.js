var Command, Query, _class, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../concepts/Command');

Query = (function(_super) {
  __extends(Query, _super);

  function Query() {
    _ref = _class.apply(this, arguments);
    return _ref;
  }

  Query.prototype.type = 'Query';

  Query.construct = function() {
    return function(operation) {
      var _ref1, _ref2;
      this.name = this.toString(operation, this.constructor);
      return this.path = (((_ref1 = operation[1]) != null ? (_ref2 = _ref1.selector) != null ? _ref2.path : void 0 : void 0) || '') + this.name;
    };
  };

  _class = Query.construct();

  Query.prototype.push = function(operation) {
    var cmd, command, group, i, _i, _j, _ref1, _ref2, _ref3, _ref4;
    if (!(group = this.group)) {
      return;
    }
    if (!(command = this.engine.methods[operation[0]])) {
      return;
    }
    if (command.group !== group) {
      return;
    }
    for (i = _i = 1, _ref1 = operation.length; 1 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 1 <= _ref1 ? ++_i : --_i) {
      if (cmd = (_ref2 = operation[i]) != null ? _ref2.command : void 0) {
        if (cmd.group !== group) {
          return;
        }
      }
    }
    for (i = _j = 1, _ref3 = operation.length; 1 <= _ref3 ? _j < _ref3 : _j > _ref3; i = 1 <= _ref3 ? ++_j : --_j) {
      if (cmd = (_ref4 = operation[i]) != null ? _ref4.command : void 0) {
        this.merge(cmd);
      }
    }
    this.merge(command, operation);
    return this;
  };

  Query.prototype.before = function(node, args, engine, operation, continuation, scope) {
    if (!this.hidden) {
      return engine.queries.fetch(node, args, operation, continuation, scope);
    }
  };

  Query.prototype.after = function(node, args, result, engine, operation, continuation, scope) {
    if (!this.hidden) {
      return engine.queries.update(node, args, result, operation, continuation, scope);
    }
  };

  Query.prototype.merge = function(command, operation) {
    var string;
    if (command === this) {
      return;
    }
    string = this.toString(command, operation);
    if (operation) {
      this.tail = operation;
      this.path += string;
      this.name += string;
    } else {
      this.path += this.separator + string;
    }
    if (command.scoped) {
      return this.scoped = command.scoped;
    }
  };

  return Query;

})(Command);

module.exports = Query;
