var Command, Query,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../concepts/Command');

Query = (function(_super) {
  __extends(Query, _super);

  Query.prototype.type = 'Query';

  function Query(operation) {
    this.key = this.path = this.toString(operation);
  }

  Query.prototype.toString = function(operation) {
    var argument, cmd, index, start, string, _i, _ref, _ref1;
    if (this.prefix != null) {
      string = this.prefix;
    } else {
      string = operation[0];
    }
    if (typeof operation[1] === 'object') {
      start = 2;
    }
    for (index = _i = _ref = start || 1, _ref1 = operation.length; _ref <= _ref1 ? _i < _ref1 : _i > _ref1; index = _ref <= _ref1 ? ++_i : --_i) {
      if (argument = operation[index]) {
        if (cmd = argument.command) {
          string += cmd.key;
        } else {
          string += argument;
          if (operation.length - 1 > index) {
            string += this.separator;
          }
        }
      }
    }
    if (this.suffix) {
      string += this.suffix;
    }
    return string;
  };

  Query.prototype.push = function(operation) {
    var arg, cmd, i, index, inherited, match, tag, tags, _i, _j, _k, _l, _len, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
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
          if (cmd = (_ref3 = operation[index]) != null ? _ref3.command : void 0) {
            if (!(((_ref4 = cmd.tags) != null ? _ref4.indexOf(tag) : void 0) > -1)) {
              match = false;
              break;
            }
          }
        }
        if (match) {
          inherited = false;
          for (i = _l = 1, _ref5 = operation.length; 1 <= _ref5 ? _l < _ref5 : _l > _ref5; i = 1 <= _ref5 ? ++_l : --_l) {
            arg = operation[i];
            if (cmd = arg != null ? arg.command : void 0) {
              inherited = this.mergers[tag](this, cmd, operation, arg, inherited);
            }
          }
        }
      }
    }
    return this;
  };

  Query.prototype.inherit = function(command, inherited) {
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
  };

  Query.prototype.mergers = {};

  return Query;

})(Command);

module.exports = Query;
