var Command;

Command = (function() {
  function Command(operation) {
    var command, match;
    if (!(command = operation.command)) {
      match = Command.match(this, operation);
      if (typeof operation[0] === 'string') {
        if (!match.group || !(command = Command.reduce(this, operation, match))) {
          command = match.instance || new match(operation);
          if (!match.key) {
            match.instance = command;
          }
        }
      }
      operation.command = command;
    }
    return command;
  }

  Command.match = function(engine, operation, parent, index) {
    var argument, command, i, j, match, signature, type;
    operation.parent = parent;
    operation.index = index;
    if (typeof operation[0] === 'string') {
      if (!(signature = engine.signatures[operation[0]])) {
        if (engine.Default) {
          return engine.Default;
        } else {
          throw operation[0] + ' is not defined';
        }
      }
      i = 0;
    } else {
      i = -1;
    }
    j = operation.length;
    while (++i < j) {
      argument = operation[i];
      if (argument != null ? argument.push : void 0) {
        type = engine.Command(argument).type;
      } else {
        type = this.types[typeof argument];
      }
      if (match = signature[type]) {
        signature = match;
      } else if (engine.Default) {
        return engine.Default;
      } else {
        throw "Unexpected " + type + " in " + operation[0];
      }
    }
    if (command = signature.resolved) {
      return command;
    } else if (engine.Default) {
      return engine.Default;
    } else {
      throw "Too few arguments in" + operation[0];
    }
  };

  Command.prototype.solve = function(engine, operation, continuation, scope, ascender, ascending) {
    var args, command, result, solve, solved, _ref, _ref1;
    if (scope == null) {
      scope = this.engine.scope;
    }
    if ((command = this) === Command) {
      command = engine.Command(operation, !operation.hasOwnProperty('parent'));
    }
    if ((solve = (_ref = operation.parent) != null ? (_ref1 = _ref.command) != null ? _ref1.solve : void 0 : void 0)) {
      solved = solve.call(engine, operation, continuation, scope, ascender, ascending);
      if (solved === false) {
        return;
      }
      if (typeof solved === 'string') {
        continuation = solved;
      }
    }
    if (this.tail) {
      if (this.tail.path === this.tail.key || (ascender != null) || (continuation && continuation.lastIndexOf(engine.Continuation.PAIR) !== continuation.indexOf(engine.Continuation.PAIR))) {
        operation = this.head;
      } else {
        operation = this.tail[1];
      }
    }
    if (continuation && command.path) {
      result = engine.getSolution(operation, continuation, scope);
      switch (typeof result) {
        case 'string':
          if (operation[0] === '$virtual' && result.charAt(0) !== engine.Continuation.PAIR) {
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
      args = command.descend(engine, operation, continuation, scope, ascender, ascending);
      if (args === false) {
        return;
      }
      if (operation.name && !command.hidden) {
        this.engine.console.row(operation, args, continuation || "");
      }
      if (command) {
        result = command.execute(engine, operation, continuation, scope, args);
        continuation = this.getContinuation(operation, continuation, scope);
      }
    }
    return command.ascend(engine, operation, continuation, result, scope, ascender);
  };

  Command.prototype.getContinuation = function(operation, continuation, scope) {
    if (continuation == null) {
      continuation = '';
    }
    if (this.key && !this.hidden) {
      if (this.scoped && operation.length === 3) {
        return continuation + this.path;
      } else {
        return continuation + this.key;
      }
    } else {
      return continuation;
    }
  };

  Command.prototype.execute = function(engine, operation, continuation, scope, args) {
    var result;
    scope || (scope = engine.scope);
    if (this.before) {
      result = this.before(node || scope, args, engine, operation, continuation, scope);
    }
    if (result === void 0) {
      result = func.apply(engine, args);
    }
    if (this.after) {
      result = this.after(node || scope, args, result, engine, operation, continuation, scope);
    }
    return result;
  };

  Command.prototype.descend = function(engine, operation, continuation, scope, ascender, ascending) {
    var args, argument, command, contd, index, offset, prev, stopping, _i, _len;
    args = prev = void 0;
    offset = 0;
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      argument = operation[index];
      if (index === 0) {
        if (typeof argument === 'string') {
          offset = 1;
          continue;
        }
      }
      if (ascender === index) {
        argument = ascending;
      } else if (argument instanceof Array) {
        if (ascender != null) {
          contd = engine.Continuation.descend(operation, continuation, ascender);
        } else {
          contd = continuation;
        }
        argument = this.solve(argument, contd, scope, void 0, prev);
      }
      if (argument === void 0) {
        command = operation.command;
        if ((ascender != null) || (!engine.eager && (command != null ? command.eager : void 0))) {
          if ((command != null ? command.capture : void 0) && (operation.parent ? !command : !offset)) {
            stopping = true;
          } else if (command || offset) {
            return false;
          }
        }
        offset += 1;
        continue;
      }
      (args || (args = []))[index + offset] = prev = argument;
    }
    return args;
  };

  Command.prototype.ascend = function(engine, operation, continuation, result, scope, ascender) {
    var contd, item, parent, pcommand, scoped, solution, _i, _len, _ref, _ref1;
    if (result != null) {
      if (parent = operation.parent) {
        pcommand = engine.Command(parent);
      }
      if (parent && (typeof parent[0] === 'string' || operation.command.noop) && (parent.domain === operation.domain || parent.domain === this.engine.document || parent.domain === this.engine)) {
        if (parent && engine.isCollection(result)) {
          engine.console.group('%s \t\t\t\t%O\t\t\t%c%s', engine.Continuation.ASCEND, operation.parent, 'font-weight: normal; color: #999', continuation);
          for (_i = 0, _len = result.length; _i < _len; _i++) {
            item = result[_i];
            contd = engine.Continuation.ascend(continuation, item);
            this.ascend(engine, operation, contd, item, scope, operation.index);
          }
          engine.console.groupEnd();
          return;
        } else {
          if (pcommand != null ? (_ref = pcommand.capture) != null ? _ref.call(engine, result, operation, continuation, scope, ascender) : void 0 : void 0) {
            return;
          }
          if (!operation.command && typeof operation[0] === 'string' && result.length === 1) {
            return;
          }
          if (!parent.name) {
            if (result && (!parent || (!pcommand && (!parent.parent || parent.length === 1) || (ascender != null)))) {
              if (result.length === 1) {
                result = result[0];
              }
              return engine.provide(result);
            }
          } else if (parent && ((ascender != null) || ((result.nodeType || operation.command.key) && (!operation.command.hidden || parent.command.tail === parent)))) {
            this.solve(engine, parent, continuation, scope, operation.index, result);
            return;
          }
          return result;
        }
      } else if (parent && ((typeof parent[0] === 'string' || operation.exported) && (parent.domain !== operation.domain))) {
        if (!continuation && operation[0] === 'get') {
          continuation = operation[3];
        }
        solution = ['value', result, continuation || '', operation.toString()];
        if (!(scoped = scope !== engine.scope && scope)) {
          if (operation[0] === 'get' && operation[4]) {
            scoped = engine.identity.solve(operation[4]);
          }
        }
        if (operation.exported || scoped) {
          solution.push((_ref1 = operation.exported) != null ? _ref1 : null);
        }
        if (scoped) {
          solution.push(engine.identity.provide(scoped));
        }
        solution.operation = operation;
        solution.parent = operation.parent;
        solution.domain = operation.domain;
        solution.index = operation.index;
        parent[operation.index] = solution;
        engine.engine.provide(solution);
        return;
      } else {
        return engine.provide(result);
      }
    }
    return result;
  };

  Command.extend = function(definition, methods) {
    var Kommand, Prototype, property, value;
    Kommand = function() {};
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
      this[name] = Command.extend.call(this, options);
    }
  };

  Command.reduce = function(operation) {
    var argument, i, _i, _ref, _ref1;
    for (i = _i = 1, _ref = operation.length; 1 <= _ref ? _i < _ref : _i > _ref; i = 1 <= _ref ? ++_i : --_i) {
      if (argument = operation[i]) {
        if ((_ref1 = argument.command) != null ? typeof _ref1.push === "function" ? _ref1.push(operation) : void 0 : void 0) {
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
    var Types, property, proto, signed, value, _base, _base1;
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
              if (!(signed = value.__super__.signed)) {
                signed = (_base = value.__super__).signed || (_base.signed = {
                  displayName: property
                });
                engine.signatures.set(value, (signed || (signed = {
                  displayName: property
                })), value, Types);
              }
              engine.signatures.apply((_base1 = engine.signatures)[property] || (_base1[property] = {}), signed);
              console.log(signed, property);
            }
          }
        }
      }
    }
    this.Types = Types;
    return this;
  };

  module.exports = Command;

  return Command;

})();
