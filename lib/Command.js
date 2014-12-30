var Command, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

Command = (function() {
  var _i, _results;

  Command.prototype.type = 'Command';

  function Command(operation, parent, index) {
    var command, match;
    if (!(command = operation.command)) {
      match = Command.match(this, operation, parent, index);
      if (!(command = match.instance)) {
        command = new match(operation, this);
      }
      if (command.key != null) {
        command.push(operation);
      } else {
        (command.definition || match).instance = command;
      }
      operation.command = command;
      if (!parent) {
        command = Command.descend(command, this, operation);
      }
    }
    return command;
  }

  Command.prototype.solve = function(engine, operation, continuation, scope, ascender, ascending) {
    var args, domain, result;
    domain = operation.domain || engine;
    switch (typeof (result = this.retrieve(domain, operation, continuation, scope, ascender, ascending))) {
      case 'undefined':
        break;
      case 'function':
        if ((continuation = result.call(this, engine, operation, continuation, scope)) == null) {
          return;
        }
        result = void 0;
        break;
      default:
        if (continuation.indexOf(this.PAIR) > -1 || this.reference) {
          return result;
        }
    }
    if (result === void 0) {
      if (this.head) {
        return this.jump(domain, operation, continuation, scope, ascender, ascending);
      }
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
          if (continuation && ascender && ascender !== index) {
            contd = this.connect(engine, operation, continuation, scope, args, ascender);
          }
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

  Command.prototype.patch = function(engine, operation, continuation, scope, replacement) {
    var domain, op;
    op = this.sanitize(engine, operation, void 0, replacement);
    if (!op.parent.command.boundaries) {
      op = op.parent;
    }
    domain = replacement || engine;
    if (op.domain !== domain && op.command) {
      return op.command.transfer(domain, op, continuation, scope, void 0, void 0, op.command, replacement);
    }
  };

  Command.prototype.transfer = function(engine, operation, continuation, scope, ascender, ascending, top, replacement) {
    var domain, meta, parent, path, value, _ref, _ref1, _ref2;
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
      while (((_ref1 = parent.parent) != null ? _ref1.domain : void 0) === parent.domain && !parent.parent.command.boundaries) {
        operation = parent;
        parent = parent.parent;
      }
      if (!(domain = parent.domain)) {
        if (domain = (_ref2 = parent.command.domains) != null ? _ref2[parent.indexOf(operation)] : void 0) {
          domain = engine[domain];
        }
      }
      return engine.updating.push([parent], domain);
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
    if ((ascender != null) && continuation[continuation.length - 1] !== this.DESCEND) {
      return this.delimit(continuation, this.PAIR);
    }
  };

  Command.prototype.rewind = function(engine, operation, continuation, scope) {
    return this.getPrefixPath(engine, continuation);
  };

  Command.prototype.fork = function(engine, continuation, item) {
    return this.delimit(continuation + engine.identify(item), this.ASCEND);
  };

  Command.prototype.jump = function() {};

  Command.prototype.retrieve = function() {};

  Command.prototype.permutation = (function() {
    _results = [];
    for (_i = 0; _i < 640; _i++){ _results.push(_i); }
    return _results;
  }).apply(this);

  Command.prototype.padding = 0;

  Command.prototype.extras = void 0;

  Command.prototype.toExpression = function(operation) {
    var str, _ref, _ref1;
    switch (typeof operation) {
      case 'object':
        if (operation[0] === 'get') {
          if (operation.length === 2) {
            return operation[1];
          } else {
            return operation[1].command.path + '[' + operation[2] + ']';
          }
        }
        str = this.toExpression((_ref = operation[1]) != null ? _ref : '') + operation[0] + this.toExpression((_ref1 = operation[2]) != null ? _ref1 : '');
        return str;
      default:
        return operation;
    }
  };

  Command.prototype.sanitize = function(engine, operation, ascend, replacement) {
    var argument, parent, _j, _len;
    if (ascend !== false) {
      for (_j = 0, _len = operation.length; _j < _len; _j++) {
        argument = operation[_j];
        if (ascend !== argument) {
          if (argument.push && (argument != null ? argument.domain : void 0) === engine) {
            if (argument[0] === 'get') {
              return ascend;
            }
            this.sanitize(engine, argument, false, replacement);
          }
        }
      }
    }
    operation.domain = operation.command = void 0;
    if (replacement) {
      operation.domain = replacement;
      replacement.Command(operation);
    }
    if (ascend !== false) {
      if ((parent = operation.parent) && parent.domain === engine && !parent.command.boundaries) {
        return this.sanitize(engine, parent, operation, replacement);
      }
    }
    return operation;
  };

  Command.prototype.ASCEND = String.fromCharCode(8593);

  Command.prototype.PAIR = String.fromCharCode(8594);

  Command.prototype.DESCEND = String.fromCharCode(8595);

  Command.prototype.DELIMITERS = [8593, 8594, 8595];

  Command.prototype.delimit = function(path, delimeter) {
    if (delimeter == null) {
      delimeter = '';
    }
    if (!path) {
      return path;
    }
    if (this.DELIMITERS.indexOf(path.charCodeAt(path.length - 1)) > -1) {
      return path.substring(0, path.length - 1) + delimeter;
    } else {
      return path + delimeter;
    }
  };

  Command.prototype.getRoot = function(operation) {
    while (operation.command.type !== 'Default') {
      operation = operation.parent;
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

  Command.orphanize = function(operation) {
    var arg, _j, _len;
    if (operation.domain) {
      operation.domain = void 0;
    }
    if (operation.variables) {
      operation.variables = void 0;
    }
    for (_j = 0, _len = operation.length; _j < _len; _j++) {
      arg = operation[_j];
      if (arg != null ? arg.push : void 0) {
        this.orphanize(arg);
      }
    }
    return operation;
  };

  Command.compile = function(engine, command) {
    var Types, aliases, name, property, proto, value, _base, _j, _len;
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
            this.register(engine.signatures, property, value, Types);
            if (engine.helps) {
              (_base = engine.engine)[property] || (_base[property] = this.Helper(engine, property));
              if (aliases = value.prototype.helpers) {
                for (_j = 0, _len = aliases.length; _j < _len; _j++) {
                  name = aliases[_j];
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

  Command.Helper = function(engine, name) {
    var base, signature, _base;
    signature = engine.signatures[name];
    base = [name];
    return (_base = engine.engine)[name] || (_base[name] = function() {
      var args, command, extras, length, result, _ref;
      args = Array.prototype.slice.call(arguments);
      command = Command.match(engine, base.concat(args)).prototype;
      length = (command.hasOwnProperty('permutation') && command.permutation.length || 0) + command.padding;
      if (length > args.length) {
        args.length = length;
      }
      if (extras = (_ref = command.extras) != null ? _ref : command.execute.length) {
        args.push(engine);
        if (extras > 1) {
          args.push(args);
          if (extras > 2) {
            args.push('');
            if (extras > 3) {
              args.push(engine.scope);
            }
          }
        }
      }
      if ((result = command.execute.apply(command, args)) != null) {
        if (command.ascend !== command.constructor.__super__.ascend) {
          command.ascend(engine, args, '', engine.scope, result);
        }
        return result;
      }
    });
  };

  /* 
  
  Generate lookup structures to match methods by name and argument type signature
  
  Signature for `['==', ['get', 'a'], 10]` would be `engine.signatures['==']['Variable']['Number']`
  
  A matched signature returns customized class for an operation that can further 
  pick a sub-class dynamically. Signatures allows special case optimizations and 
  composition to be implemented structurally, instead of branching in runtime.
  
  Signatures are shared between commands. Dispatcher support css-style 
  typed optional argument groups, but has no support for keywords or repeating groups yet
  */


  Command.sign = function(command, object) {
    var signature, signatures, signed, storage, _j, _len;
    if (signed = command.signed) {
      return signed;
    }
    command.signed = storage = [];
    if (signature = object.signature) {
      this.get(command, storage, signature);
    } else if (signature === false) {
      storage.push(['default']);
    } else if (signatures = object.signatures) {
      for (_j = 0, _len = signatures.length; _j < _len; _j++) {
        signature = signatures[_j];
        this.get(command, storage, signature);
      }
    }
    return storage;
  };

  Command.permute = function(arg, permutation) {
    var group, i, index, j, keys, position, values, _j, _k, _l, _len, _len1, _m, _ref, _ref1, _ref2;
    keys = Object.keys(arg);
    if (!permutation) {
      return keys;
    }
    values = Object.keys(arg);
    group = [];
    for (index = _j = 0, _len = permutation.length; _j < _len; index = ++_j) {
      position = permutation[index];
      if (position !== null) {
        group[position] = keys[index];
      }
    }
    for (i = _k = _ref = permutation.length, _ref1 = keys.length; _k < _ref1; i = _k += 1) {
      for (j = _l = 0, _ref2 = keys.length; _l < _ref2; j = _l += 1) {
        if (group[j] == null) {
          group[j] = keys[i];
          break;
        }
      }
    }
    for (_m = 0, _len1 = group.length; _m < _len1; _m++) {
      arg = group[_m];
      if (arg === void 0) {
        return;
      }
    }
    return group;
  };

  Command.getPermutation = function(args, properties) {
    var arg, index, result, _j, _k, _len;
    result = [];
    for (index = _j = 0, _len = args.length; _j < _len; index = ++_j) {
      arg = args[index];
      if (arg !== null) {
        result[arg] = properties[index];
      }
    }
    for (index = _k = result.length - 1; _k >= 0; index = _k += -1) {
      arg = result[index];
      if (arg == null) {
        result.splice(index, 1);
      }
    }
    return result;
  };

  Command.getPositions = function(args) {
    var arg, index, result, value, _j, _k, _len;
    result = [];
    for (index = _j = 0, _len = args.length; _j < _len; index = ++_j) {
      value = args[index];
      if (value != null) {
        result[value] = index;
      }
    }
    for (index = _k = result.length - 1; _k >= 0; index = _k += -1) {
      arg = result[index];
      if (arg == null) {
        result.splice(index, 1);
      }
    }
    return result;
  };

  Command.getProperties = function(signature) {
    var a, arg, definition, properties, property, _j, _k, _len, _len1;
    if (properties = signature.properties) {
      return properties;
    }
    signature.properties = properties = [];
    for (_j = 0, _len = signature.length; _j < _len; _j++) {
      arg = signature[_j];
      if (arg.push) {
        for (_k = 0, _len1 = arg.length; _k < _len1; _k++) {
          a = arg[_k];
          for (property in a) {
            definition = a[property];
            properties.push(definition);
          }
        }
      } else {
        for (property in arg) {
          definition = arg[property];
          properties.push(definition);
        }
      }
    }
    return properties;
  };

  Command.generate = function(combinations, positions, properties, combination, length) {
    var i, j, position, props, type, _j, _len, _ref;
    if (combination) {
      i = combination.length;
    } else {
      combination = [];
      combinations.push(combination);
      i = 0;
    }
    while ((props = properties[i]) === void 0 && i < properties.length) {
      i++;
    }
    if (i === properties.length) {
      combination.length = length;
      combination.push(positions);
    } else {
      _ref = properties[i];
      for (j = _j = 0, _len = _ref.length; _j < _len; j = ++_j) {
        type = _ref[j];
        if (j === 0) {
          combination.push(type);
        } else {
          position = combinations.indexOf(combination);
          combination = combination.slice(0, i);
          combination.push(type);
          combinations.push(combination);
        }
        this.generate(combinations, positions, properties, combination, length);
      }
    }
    return combinations;
  };

  Command.write = function(command, storage, combination) {
    var arg, i, last, proto, resolved, variant, _j, _ref, _ref1, _ref2;
    for (i = _j = 0, _ref = combination.length; 0 <= _ref ? _j < _ref : _j > _ref; i = 0 <= _ref ? ++_j : --_j) {
      if ((arg = combination[i]) === 'default') {
        storage.Default = command;
      } else {
        last = combination.length - 1;
        if (arg !== void 0 && i < last) {
          storage = storage[arg] || (storage[arg] = {});
        } else {
          variant = command.extend({
            permutation: combination[last],
            padding: last - i,
            definition: command
          });
          if (resolved = storage.resolved) {
            proto = resolved.prototype;
            if (variant.prototype.condition) {
              if (!proto.hasOwnProperty('advices')) {
                proto.advices = ((_ref1 = proto.advices) != null ? _ref1.slice() : void 0) || [];
                if (proto.condition) {
                  proto.advices.push(resolved);
                }
              }
              proto.advices.push(variant);
            } else {
              if (proto.condition) {
                variant.prototype.advices = ((_ref2 = proto.advices) != null ? _ref2.slice() : void 0) || [resolved];
                storage.resolved = variant;
              }
            }
          } else {
            storage.resolved = variant;
          }
        }
      }
    }
  };

  Command.register = function(signatures, property, command, types) {
    var Prototype, combination, execute, kind, proto, storage, subcommand, type, value, _j, _k, _len, _len1, _ref, _ref1;
    storage = signatures[property] || (signatures[property] = {});
    for (type in types) {
      subcommand = types[type];
      if (proto = command.prototype) {
        if ((execute = proto[type]) || ((kind = subcommand.prototype.kind) && ((kind === 'auto') || (execute = proto[kind])))) {
          Prototype = subcommand.extend();
          for (property in proto) {
            if (!__hasProp.call(proto, property)) continue;
            value = proto[property];
            Prototype.prototype[property] = value;
          }
          if (typeof execute === 'object') {
            for (property in execute) {
              value = execute[property];
              Prototype.prototype[property] = value;
            }
          } else if (execute) {
            Prototype.prototype.execute = execute;
          }
          _ref = this.sign(subcommand, Prototype.prototype);
          for (_j = 0, _len = _ref.length; _j < _len; _j++) {
            combination = _ref[_j];
            this.write(Prototype, storage, combination);
          }
        }
      }
    }
    _ref1 = this.sign(command, command.prototype);
    for (_k = 0, _len1 = _ref1.length; _k < _len1; _k++) {
      combination = _ref1[_k];
      this.write(command, storage, combination);
    }
  };

  Command.get = function(command, storage, signature, args, permutation) {
    var arg, argument, group, i, j, k, keys, obj, property, _j, _k, _l, _len, _len1, _ref;
    args || (args = []);
    i = args.length;
    seeker: {;
    for (_j = 0, _len = signature.length; _j < _len; _j++) {
      arg = signature[_j];
      if (arg.push) {
        for (k = _k = 0, _len1 = arg.length; _k < _len1; k = ++_k) {
          obj = arg[k];
          j = 0;
          group = arg;
          for (property in obj) {
            if (!i) {
              arg = obj;
              if (!(keys = this.permute(arg, permutation))) {
                return;
              }
              argument = arg[property];
              break seeker;
            }
            i--;
            j++;
          }
        }
      } else {
        j = void 0;
        for (property in arg) {
          if (!i) {
            argument = arg[property];
            break seeker;
          }
          i--;
        }
      }
    }
    };
    if (!argument) {
      this.generate(storage, this.getPositions(args), this.getPermutation(args, this.getProperties(signature)), void 0, args.length);
      return;
    }
    if (keys && (j != null)) {
      permutation || (permutation = []);
      for (i = _l = 0, _ref = keys.length; _l < _ref; i = _l += 1) {
        if (permutation.indexOf(i) === -1) {
          this.get(command, storage, signature, args.concat(args.length - j + i), permutation.concat(i));
        }
      }
      this.get(command, storage, signature, args.concat(null), permutation.concat(null));
      return;
    }
    return this.get(command, storage, signature, args.concat(args.length));
  };

  return Command;

})();

Command.List = (function(_super) {
  __extends(List, _super);

  List.prototype.type = 'List';

  function List() {}

  List.prototype.extras = 0;

  List.prototype.boundaries = true;

  List.prototype.execute = function() {};

  List.prototype.log = function() {};

  List.prototype["yield"] = function() {
    return true;
  };

  List.prototype.descend = function(engine, operation, continuation, scope, ascender, ascending) {
    var argument, command, index, _i, _len;
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      argument = operation[index];
      if (argument != null ? argument.push : void 0) {
        argument.parent || (argument.parent = operation);
        if (command = argument.command || engine.Command(argument)) {
          command.solve(engine, argument, continuation, scope);
        }
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

  function Object() {}

  return Object;

})(Command);

Command.Meta = (function(_super) {
  __extends(Meta, _super);

  function Meta() {
    _ref = Meta.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Meta.prototype.type = 'Meta';

  Meta.prototype.signature = [
    {
      body: ['Any']
    }
  ];

  Meta.prototype.execute = function(data) {
    return data;
  };

  return Meta;

})(Command);

module.exports = Command;
