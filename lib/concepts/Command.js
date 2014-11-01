var Command, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = (function() {
  function Command(operation, parent, index) {
    var command, match;
    if (!(command = operation.command)) {
      match = Command.match(this, operation, parent, index);
      command = match.instance || new match(operation);
      if (command.key != null) {
        command.push(operation);
      } else {
        match.instance = command;
      }
      operation.command = command;
    }
    return command;
  }

  Command.match = function(engine, operation, parent, index) {
    var Default, argument, command, i, j, match, signature, type;
    operation.parent = parent;
    operation.index = index;
    if (typeof operation[0] === 'string') {
      if (!(signature = engine.signatures[operation[0]])) {
        if (!(Default = engine.Default)) {
          throw operation[0] + ' is not defined';
        }
      }
      i = 0;
    } else {
      i = -1;
      Default = engine.List || Command.List;
    }
    j = operation.length;
    while (++i < j) {
      argument = operation[i];
      if (argument != null ? argument.push : void 0) {
        type = engine.Command(argument, operation, i).type;
      } else {
        type = this.types[typeof argument];
      }
      if (signature) {
        if (match = signature[type]) {
          signature = match;
        } else if (!(Default || (Default = signature.Default))) {
          throw "Unexpected " + type + " in " + operation[0];
        }
      }
    }
    if (command = Default || signature.resolved || engine.Default) {
      return command;
    } else {
      throw "Too few arguments in" + operation[0];
    }
  };

  Command.prototype.solve = function(engine, operation, continuation, scope, ascender, ascending) {
    var args, result, tail;
    if (tail = this.tail) {
      operation = this.jump(engine, tail, continuation, ascender);
    }
    if (continuation && this.path) {
      result = engine.getSolution(operation, continuation, scope);
      switch (typeof result) {
        case 'string':
          if (operation[0] === 'virtual' && result.charAt(0) !== engine.Continuation.PAIR) {
            return result;
          } else {
            continuation = result;
            result = void 0;
          }
          break;
        case 'object':
          return result;
        case 'boolean':
          return;
      }
    }
    if (result === void 0) {
      args = this.descend(engine, operation, continuation, scope, ascender, ascending);
      if (args === false) {
        return;
      }
      this.log(args, engine, operation, continuation);
      result = this.before(args, engine, operation, continuation, scope);
      if (result == null) {
        result = this.execute.apply(this, args);
      }
      result = this.after(args, result, engine, operation, continuation, scope);
    }
    if (result != null) {
      continuation = this["continue"](engine, operation, continuation, scope);
      return this.ascend(engine, operation, continuation, result, scope, ascender);
    }
  };

  Command.prototype["continue"] = function(engine, operation, continuation) {
    return continuation;
  };

  Command.prototype.before = function() {};

  Command.prototype.after = function(args, result) {
    return result;
  };

  Command.prototype.log = function(args, engine, operation, continuation) {
    return engine.console.row(operation, args, continuation || "");
  };

  Command.prototype.descend = function(engine, operation, continuation, scope, ascender, ascending) {
    var args, argument, command, contd, i, index, prev, _i, _j, _ref, _ref1, _ref2, _ref3;
    args = prev = void 0;
    for (index = _i = _ref = this.start, _ref1 = operation.length; _i < _ref1; index = _i += 1) {
      argument = ascender === index ? ascending : operation[index];
      if (command = argument.command) {
        if (ascender != null) {
          contd = this.connect(operation, continuation);
        }
        argument = command.solve(engine, argument, contd || continuation, scope);
        if (argument === void 0) {
          if (!(command.eager || engine.eager)) {
            return false;
          } else {
            continue;
          }
        }
      }
      (args || (args = [])).push(argument);
    }
    for (i = _j = 0, _ref2 = (_ref3 = this.extras) != null ? _ref3 : this.execute.length - index + 1; _j < _ref2; i = _j += 1) {
      args.push(arguments[i]);
    }
    return args;
  };

  Command.prototype.connect = function(engine, operation, continuation) {
    return engine.Continuation.get(continuation, null, this.PAIR);
  };

  Command.prototype.fork = function(engine, continuation) {
    return engine.Continuation.get(continuation, null, this.ASCEND);
  };

  Command.prototype.ascend = function(engine, operation, continuation, result, scope, ascender) {
    var parent, top;
    if (!(parent = operation.parent)) {
      return;
    }
    if ((top = parent.command).constructor === Command.List) {
      return;
    }
    if (parent.domain !== operation.domain) {
      engine.engine.subsolve(operation, continuation, scope);
      return;
    }
    if (typeof top.provide === "function" ? top.provide(engine, result, operation, continuation, scope, ascender) : void 0) {
      return;
    }
    if (ascender != null) {
      return top.solve(engine, parent, continuation, scope, operation.index, result);
    } else {
      return result;
    }
  };

  Command.extend = function(definition, methods) {
    var Constructor, Kommand, Prototype, property, value;
    if ((Constructor = this.prototype.constructor) === Command || Constructor.length === 0) {
      Constructor = void 0;
    }
    Kommand = function() {
      if (Constructor) {
        return Constructor.apply(this, arguments);
      }
    };
    Kommand.__super__ = this;
    Prototype = function() {};
    Prototype.prototype = this.prototype;
    Kommand.prototype = new Prototype;
    for (property in definition) {
      value = definition[property];
      Kommand.prototype[property] = value;
    }
    if (methods) {
      Command.define.call(Kommand, methods);
    }
    return Kommand;
  };

  Command.define = function(name, options) {
    var property, value;
    if (!options) {
      for (property in name) {
        value = name[property];
        Command.define.call(this, property, value);
      }
    } else {
      if (typeof options === 'function') {
        options = {
          execute: options
        };
      }
      this[name] = Command.extend.call(this, options);
    }
  };

  Command.reduce = function(operation, command) {
    var argument, i, _i, _ref, _ref1;
    for (i = _i = 1, _ref = operation.length; _i < _ref; i = _i += 1) {
      if (argument = operation[i]) {
        if ((_ref1 = argument.command) != null ? typeof _ref1.push === "function" ? _ref1.push(operation, command) : void 0 : void 0) {
          return argument.command;
        }
      }
    }
  };

  Command.types = {
    'string': 'String',
    'number': 'Number'
  };

  Command.compile = function(engine, command) {
    var Types, property, proto, value;
    if (!command) {
      for (property in engine) {
        value = engine[property];
        if (((proto = value != null ? value.prototype : void 0) != null) && proto instanceof Command) {
          if (property.match(/^[A-Z]/)) {
            this.compile(engine, value);
          }
        }
      }
      return;
    }
    Types = command.types = {};
    for (property in command) {
      value = command[property];
      if (property.match(/^[A-Z]/)) {
        if ((value != null ? value.prototype : void 0) instanceof Command) {
          Types[property] = value;
          this.compile(engine, value);
        }
      }
    }
    for (property in command) {
      value = command[property];
      if (value !== Command[property] && property !== '__super__') {
        if (typeof value === 'function') {
          if ((value != null ? value.prototype : void 0) instanceof Command) {
            if (!property.match(/^[A-Z]/)) {
              engine.signatures.set(property, value, Types);
            }
          }
        }
      }
    }
    this.Types = Types;
    return this;
  };

  Command.Empty = {};

  Command.prototype.start = 1;

  return Command;

})();

Command.List = (function(_super) {
  __extends(List, _super);

  function List() {
    _ref = List.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  List.prototype.start = 0;

  List.prototype.extras = 0;

  List.prototype.log = function() {};

  return List;

})(Command);

Command.Default = (function(_super) {
  __extends(Default, _super);

  function Default() {
    _ref1 = Default.__super__.constructor.apply(this, arguments);
    return _ref1;
  }

  return Default;

})(Command);

module.exports = Command;
