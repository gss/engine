var Command, Query;

Command = require('../concepts/Command');

Query = Command.extend({
  type: 'Query',
  constructor: function(operation) {
    return this.key = this.path = this.serialize(operation);
  },
  ascend: function(engine, operation, continuation, scope, result, ascender) {
    var contd, node, parent, _base, _base1, _i, _len;
    if (parent = operation.parent) {
      if (engine.isCollection(result)) {
        for (_i = 0, _len = result.length; _i < _len; _i++) {
          node = result[_i];
          contd = this.fork(engine, continuation, node);
          if (!(typeof (_base = parent.command)["yield"] === "function" ? _base["yield"](node, engine, operation, contd, scope, ascender) : void 0)) {
            parent.command.solve(engine, parent, contd, scope, parent.indexOf(operation), node);
          }
        }
      } else {
        if (!(typeof (_base1 = parent.command)["yield"] === "function" ? _base1["yield"](result, engine, operation, continuation, scope, ascender) : void 0)) {
          if ((ascender != null) || !this.hidden || !this.reference) {
            return parent.command.solve(engine, parent, continuation, this.subscope(scope, result) || scope, parent.indexOf(operation), result);
          } else {
            return result;
          }
        }
      }
    }
  },
  subscope: function(scope, result) {},
  serialize: function(operation) {
    var argument, cmd, index, length, start, string, _i, _ref;
    if (this.prefix != null) {
      string = this.prefix;
    } else {
      string = operation[0];
    }
    if (typeof operation[1] === 'object') {
      start = 2;
    }
    length = operation.length;
    for (index = _i = _ref = start || 1; _ref <= length ? _i < length : _i > length; index = _ref <= length ? ++_i : --_i) {
      if (argument = operation[index]) {
        if (cmd = argument.command) {
          string += cmd.key;
        } else {
          string += argument;
          if (length - 1 > index) {
            string += this.separator;
          }
        }
      }
    }
    if (this.suffix) {
      string += this.suffix;
    }
    return string;
  },
  push: function(operation) {
    var arg, cmd, i, index, inherited, match, tag, tags, _i, _j, _k, _l, _len, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
    for (index = _i = 1, _ref = operation.length; 1 <= _ref ? _i < _ref : _i > _ref; index = 1 <= _ref ? ++_i : --_i) {
      if (cmd = (_ref1 = operation[index]) != null ? _ref1.command : void 0) {
        inherited = this.inherit(cmd, inherited);
      }
    }
    if (tags = this.tags) {
      for (i = _j = 0, _len = tags.length; _j < _len; i = ++_j) {
        tag = tags[i];
        match = true;
        for (index = _k = 1, _ref2 = operation.length; 1 <= _ref2 ? _k < _ref2 : _k > _ref2; index = 1 <= _ref2 ? ++_k : --_k) {
          if (cmd = (_ref3 = (arg = operation[index])) != null ? _ref3.command : void 0) {
            if (!(((_ref4 = cmd.tags) != null ? _ref4.indexOf(tag) : void 0) > -1) || !this.checkers[tag](this, cmd, operation, arg, inherited)) {
              match = false;
              break;
            }
          }
        }
        if (match) {
          inherited = false;
          for (index = _l = 1, _ref5 = operation.length; 1 <= _ref5 ? _l < _ref5 : _l > _ref5; index = 1 <= _ref5 ? ++_l : --_l) {
            if (cmd = (_ref6 = (arg = operation[index])) != null ? _ref6.command : void 0) {
              inherited = this.mergers[tag](this, cmd, operation, arg, inherited);
            }
          }
        }
      }
    }
    return this;
  },
  inherit: function(command, inherited) {
    var path;
    if (command.scoped) {
      this.scoped = command.scoped;
    }
    if (path = command.path) {
      if (inherited) {
        this.path += this.separator + path;
      } else {
        this.path = path + this.path;
      }
    }
    return true;
  },
  "continue": function(result, engine, operation, continuation) {
    if (continuation == null) {
      continuation = '';
    }
    return continuation + this.key;
  },
  jump: function(engine, operation, continuation, scope, ascender, ascending) {
    var tail, _ref, _ref1;
    tail = this.tail;
    if ((((_ref = tail[1]) != null ? (_ref1 = _ref.command) != null ? _ref1.key : void 0 : void 0) != null) && (ascender == null) && (continuation.lastIndexOf(engine.Continuation.PAIR) === continuation.indexOf(engine.Continuation.PAIR))) {
      return tail[1].command.solve(engine, tail[1], continuation, scope);
    }
    return this.perform(engine, this.head, continuation, scope, ascender, ascending);
  },
  getPath: function(engine, operation, continuation) {
    if (continuation) {
      if (continuation.nodeType) {
        return engine.identity["yield"](continuation) + ' ' + this.path;
      } else {
        return continuation + (this.selector || this.key);
      }
    } else {
      return this.selector || this.key;
    }
  },
  retrieve: function(engine, operation, continuation, scope, ascender, ascending) {
    return engine.pairs.getSolution(operation, continuation, scope, ascender, ascending);
  },
  prepare: function() {},
  mergers: {},
  checkers: {}
});

module.exports = Query;
