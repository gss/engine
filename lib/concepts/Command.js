var Command,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

Command = (function() {
  function Command(operation, parent, index) {
    var command, match;
    if (!(command = operation.command)) {
      match = Command.match(this, operation, parent, index);
      if (!(command = match.instance)) {
        command = new match(operation, this);
      }
      if (!parent) {
        command = Command.descend(command, this, operation);
      }
      if (command.key != null) {
        command.push(operation);
      } else {
        (command.definition || match).instance = command;
      }
      operation.command = command;
    }
    return command;
  }

  Command.subtype = function(engine, operation, types) {};

  Command.match = function(engine, operation, parent, index) {
    var Default, argument, command, first, i, j, match, signature, type;
    first = operation[0];
    i = -1;
    switch (typeof first) {
      case 'string':
        if (!(signature = engine.signatures[first])) {
          if (!(Default = engine.Default)) {
            throw new Error('`' + first + '` is not defined in ' + engine.displayName + ' domain');
          }
        }
        i = 0;
        break;
      case 'object':
        type = this.typeOfObject(first);
        if (!(signature = engine.signatures[type.toLowerCase()])) {
          if (!(Default = engine[type] || Command[type])) {
            throw new Error('`' + type + '` can\'t be invoked in ' + engine.displayName + ' domain');
          }
        } else {
          i = 0;
        }
    }
    j = operation.length;
    while (++i < j) {
      argument = operation[i];
      if (argument != null ? argument.push : void 0) {
        if (argument.parent == null) {
          argument.parent = operation;
        }
        type = engine.Command(argument, operation, i).type;
      } else {
        type = this.types[typeof argument];
        if (type === 'Object') {
          type = this.typeOfObject(argument);
        }
      }
      if (signature) {
        if (match = signature[type] || signature.Any) {
          signature = match;
        } else if (!(Default || (Default = signature.Default || engine.Default))) {
          throw new Error("Unexpected `" + type + "` in `" + operation[0] + '` of ' + engine.displayName + ' domain');
        }
      }
    }
    if (command = Default || (signature != null ? signature.resolved : void 0) || engine.Default) {
      return command;
    } else {
      throw new Error("Too few arguments in `" + operation[0] + '` for ' + engine.displayName + ' domain');
    }
  };

  Command.descend = function(command, engine, operation) {
    var advices, argument, cmd, proto, type, _i, _j, _len, _len1;
    if (advices = command.advices) {
      for (_i = 0, _len = advices.length; _i < _len; _i++) {
        type = advices[_i];
        if ((proto = type.prototype).condition) {
          if (!proto.condition(engine, operation, command)) {
            continue;
          }
        } else {
          type(engine, operation, command);
          continue;
        }
        if (!(command = type.instance)) {
          command = new type(operation);
        }
        operation.command = command;
        if (command.key == null) {
          type.instance = command;
        }
        break;
      }
    }
    for (_j = 0, _len1 = operation.length; _j < _len1; _j++) {
      argument = operation[_j];
      if (cmd = argument.command) {
        Command.descend(cmd, engine, argument);
      }
    }
    return command;
  };

  Command.prototype["continue"] = function(result, engine, operation, continuation) {
    return continuation;
  };

  Command.prototype.before = function() {};

  Command.prototype.after = function(args, result) {
    return result;
  };

  Command.prototype.log = function(args, engine, operation, continuation, scope, name) {
    return engine.console.row(name || operation[0], args, continuation || "");
  };

  Command.prototype.solve = function(engine, operation, continuation, scope, ascender, ascending) {
    var args, domain, result;
    domain = operation.domain || engine;
    switch (typeof (result = this.retrieve(domain, operation, continuation, scope, ascender, ascending))) {
      case 'object':
      case 'string':
        if (continuation.indexOf(engine.Continuation.PAIR) > -1 || this.reference) {
          return result;
        }
        break;
      case 'boolean':
        if (result) {
          result = void 0;
          continuation = engine.Continuation.getScopePath(scope, continuation);
        } else {
          return;
        }
    }
    if (this.head) {
      return this.jump(domain, operation, continuation, scope, ascender, ascending);
    }
    if (result === void 0) {
      args = this.descend(domain, operation, continuation, scope, ascender, ascending);
      if (args === false) {
        return;
      }
      this.log(args, domain, operation, continuation);
      result = this.before(args, domain, operation, continuation, scope, ascender, ascending);
      if (result == null) {
        result = this.execute.apply(this, args);
      }
      if (result = this.after(args, result, domain, operation, continuation, scope, ascender, ascending)) {
        continuation = this["continue"](result, domain, operation, continuation, scope, ascender, ascending);
      }
    }
    if (result != null) {
      return this.ascend(engine, operation, continuation, scope, result, ascender, ascending);
    }
  };

  Command.prototype.descend = function(engine, operation, continuation, scope, ascender, ascending) {
    var args, argument, command, contd, extras, i, index, _i, _j, _ref, _ref1;
    for (index = _i = 1, _ref = operation.length; _i < _ref; index = _i += 1) {
      if (ascender === index) {
        argument = ascending;
      } else {
        argument = operation[index];
        if (argument instanceof Array) {
          command = argument.command || engine.Command(argument);
          argument.parent || (argument.parent = operation);
          contd = this.connect(engine, operation, continuation, scope, args, ascender);
          argument = command.solve(operation.domain || engine, argument, contd || continuation, scope, void 0, ascending);
          if (argument === void 0) {
            return false;
          }
        }
      }
      (args || (args = Array(operation.length - 1 + this.padding)))[this.permutation[index - 1]] = argument;
    }
    extras = (_ref1 = this.extras) != null ? _ref1 : this.execute.length - index + 1;
    if (extras > 0) {
      for (i = _j = 0; _j < extras; i = _j += 1) {
        (args || (args = Array(operation.length - 1 + this.padding))).push(arguments[i]);
      }
    }
    return args;
  };

  Command.prototype.ascend = function(engine, operation, continuation, scope, result, ascender, ascending) {
    var domain, parent, top, wrapper, yielded;
    if ((parent = operation.parent)) {
      if (domain = operation.domain) {
        if ((wrapper = parent.domain) && wrapper !== domain && wrapper !== engine) {
          this.transfer(operation.domain, parent, continuation, scope, ascender, ascending, parent.command);
          return;
        }
      }
      if (top = parent.command) {
        if (yielded = typeof top["yield"] === "function" ? top["yield"](result, engine, operation, continuation, scope, ascender) : void 0) {
          if (yielded === true) {
            return;
          }
          return yielded;
        }
      }
      if (ascender != null) {
        return top.solve(parent.domain || engine, parent, continuation, scope, parent.indexOf(operation), result);
      }
    }
    return result;
  };

  Command.prototype.patch = function(engine, operation, continuation, scope, replacement) {
    var domain, op;
    op = this.sanitize(engine, operation, void 0, replacement).parent;
    domain = replacement || engine;
    return op.command.transfer(domain, op, continuation, scope, void 0, void 0, op.command, replacement);
  };

  Command.prototype.transfer = function(engine, operation, continuation, scope, ascender, ascending, top, replacement) {
    var meta, parent, path, value, _ref, _ref1;
    if ((meta = this.getMeta(operation))) {
      for (path in operation.variables) {
        if ((value = (replacement || engine).values[path]) != null) {
          (meta.values || (meta.values = {}))[path] = value;
        } else if ((_ref = meta.values) != null ? _ref[path] : void 0) {
          delete meta.values[path];
        }
      }
    }
    if (top) {
      parent = operation;
      while (((_ref1 = parent.parent) != null ? _ref1.domain : void 0) === parent.domain && !(parent.parent.command instanceof Command.List)) {
        parent = parent.parent;
      }
      return engine.updating.push([parent], parent.domain);
    }
  };

  Command.prototype.getMeta = function(operation) {
    var parent;
    parent = operation;
    while (parent = parent.parent) {
      if (parent[0].key != null) {
        return parent[0];
      }
    }
  };

  Command.prototype.connect = function(engine, operation, continuation, scope, args, ascender) {
    if ((ascender != null) && continuation[continuation.length - 1] !== engine.Continuation.DESCEND) {
      return engine.Continuation.get(continuation, null, engine.Continuation.PAIR);
    }
  };

  Command.prototype.fork = function(engine, continuation, item) {
    return engine.Continuation.get(continuation + engine.identity["yield"](item), null, engine.Continuation.ASCEND);
  };

  Command.prototype.jump = function() {};

  Command.prototype.retrieve = function() {};

  Command.prototype.permutation = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  Command.prototype.padding = 0;

  Command.prototype.extras = void 0;

  Command.prototype.toExpression = function(operation) {
    switch (typeof operation) {
      case 'object':
        if (operation[0] === 'get') {
          if (operation.length === 2) {
            return operation[1];
          } else {
            return operation[1].command.path + '[' + operation[2] + ']';
          }
        }
        return this.toExpression(operation[1] || '') + operation[0] + this.toExpression(operation[2] || '');
      default:
        return operation;
    }
  };

  Command.prototype.sanitize = function(engine, operation, ascend, replacement) {
    var argument, _i, _len, _ref;
    for (_i = 0, _len = operation.length; _i < _len; _i++) {
      argument = operation[_i];
      if (ascend !== argument) {
        if ((argument != null ? argument.domain : void 0) === engine) {
          if (argument[0] === 'get') {
            return ascend;
          }
          this.sanitize(engine, argument, false);
        }
      }
    }
    operation.domain = operation.command = void 0;
    if (replacement) {
      operation.domain = replacement;
      replacement.Command(operation);
    }
    if (ascend !== false) {
      if (((_ref = operation.parent) != null ? _ref.domain : void 0) === engine) {
        return this.sanitize(engine, operation.parent, operation, replacement);
      }
    }
    return operation;
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
    Kommand.prototype.definition = Kommand;
    Kommand.extend = Command.extend;
    Kommand.define = Command.define;
    for (property in definition) {
      value = definition[property];
      Kommand.prototype[property] = value;
    }
    if (methods) {
      Kommand.define(methods);
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
      this[name] = this.extend(options);
    }
  };

  Command.types = {
    'string': 'String',
    'number': 'Number',
    'object': 'Object'
  };

  Command.typeOfObject = function(object) {
    if (object.nodeType) {
      return 'Node';
    }
    if (object.push) {
      return 'List';
    }
    return 'Object';
  };

  Command.compile = function(engine, command) {
    var Types, aliases, name, property, proto, value, _i, _len;
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
        if ((value != null ? value.prototype : void 0) instanceof Command) {
          if (!property.match(/^[A-Z]/)) {
            engine.Signatures.set(engine.signatures, property, value, Types);
            if (engine.helps) {
              engine.engine[property] = this.Helper(engine, property);
              if (aliases = value.prototype.helpers) {
                for (_i = 0, _len = aliases.length; _i < _len; _i++) {
                  name = aliases[_i];
                  engine.engine[name] = engine.engine[property];
                }
              }
            }
          }
        }
      }
    }
    this.Types = Types;
    return this;
  };

  Command.Empty = {};

  Command.Helper = function(engine, name) {
    var base, signature;
    signature = engine.signatures[name];
    base = [name];
    return engine[name] || (engine[name] = function() {
      var args, command;
      args = Array.prototype.slice.call(arguments);
      command = Command.match(engine, base.concat(args)).prototype;
      args.length = command.permutation.length + command.padding;
      return command.execute.apply(command, args.concat(engine, args, '', engine.scope));
    });
  };

  return Command;

})();

Command.List = (function(_super) {
  __extends(List, _super);

  function List() {}

  List.prototype.extras = 0;

  List.prototype.execute = function() {};

  List.prototype.log = function() {};

  List.prototype["yield"] = function() {
    return true;
  };

  List.prototype.descend = function(engine, operation, continuation, scope, ascender, ascending) {
    var argument, command, index, _i, _len;
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      argument = operation[index];
      if (command = argument != null ? argument.command : void 0) {
        command.solve(engine, argument, continuation, scope);
      }
    }
  };

  return List;

})(Command);

Command.Default = (function(_super) {
  __extends(Default, _super);

  Default.prototype.type = 'Default';

  Default.prototype.extras = 2;

  Default.prototype.execute = function() {
    var args, engine, operation, _i;
    args = 3 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 2) : (_i = 0, []), engine = arguments[_i++], operation = arguments[_i++];
    args.unshift(operation[0]);
    return args;
  };

  function Default() {}

  return Default;

})(Command);

Command.Object = (function(_super) {
  __extends(Object, _super);

  Object.prototype.type = 'List';

  function Object() {}

  return Object;

})(Command);

module.exports = Command;
