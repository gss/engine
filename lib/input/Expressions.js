var Expressions;

Expressions = (function() {
  function Expressions(engine, output) {
    this.engine = engine;
    this.output = output;
    this.commands = this.engine && this.engine.commands || this;
  }

  Expressions.prototype.pull = function() {
    var buffer, result;
    this.engine.start();
    buffer = this.capture();
    result = this.evaluate.apply(this, arguments);
    if (buffer) {
      this.flush();
    }
    return result;
  };

  Expressions.prototype.push = function(args, batch) {
    var buffer;
    if (args == null) {
      return;
    }
    if ((buffer = this.buffer) !== void 0) {
      if (!(this.engine._onBuffer && this.engine._onBuffer(buffer, args, batch) === false)) {
        (buffer || (this.buffer = [])).push(args);
      }
    } else {
      return this.output.pull.apply(this.output, args);
    }
  };

  Expressions.prototype.flush = function() {
    var added, buffer;
    buffer = this.buffer;
    if (this.engine._onFlush) {
      added = this.engine._onFlush(buffer);
      buffer = buffer && added && added.concat(buffer) || buffer || added;
    }
    this.lastOutput = GSS.clone(buffer);
    console.log(this.engine.onDOMContentLoaded && 'Document' || 'Worker', 'Output:', buffer);
    if (buffer) {
      this.buffer = void 0;
      return this.output.pull(buffer);
    } else if (this.buffer === void 0) {
      return this.engine.push();
    }
  };

  Expressions.prototype["do"] = function() {
    var buffer, lastOutput, result;
    lastOutput = this.lastOutput, buffer = this.buffer;
    this.lastOutput = this.buffer = void 0;
    result = this.pull.apply(this, arguments);
    this.lastOutput = lastOutput;
    this.buffer = buffer;
    return result;
  };

  Expressions.prototype.evaluate = function(operation, continuation, scope, ascender, ascending, meta) {
    var args, evaluate, evaluated, result, _ref;
    if (!operation.def) {
      this.analyze(operation);
    }
    if (!meta && (evaluate = (_ref = operation.parent) != null ? _ref.def.evaluate : void 0)) {
      evaluated = evaluate.call(this.engine, operation, continuation, scope, ascender, ascending);
      if (evaluated === false) {
        return;
      }
      if (typeof evaluated === 'string') {
        continuation = evaluated;
      }
    }
    if (operation.tail) {
      operation = this.skip(operation, ascender);
    }
    if (continuation && operation.path) {
      if ((result = this.reuse(operation.path, continuation)) !== false) {
        return result;
      }
    }
    args = this.resolve(operation, continuation, scope, ascender, ascending, meta);
    if (args === false) {
      return;
    }
    if (operation.def.noop) {
      result = args;
    } else {
      result = this.execute(operation, continuation, scope, args);
      continuation = this.log(operation, continuation);
    }
    return this.ascend(operation, continuation, result, scope, ascender);
  };

  Expressions.prototype.execute = function(operation, continuation, scope, args) {
    var callback, command, context, func, method, node, result;
    scope || (scope = this.engine.scope);
    if (operation.def.scoped || !args) {
      (args || (args = [])).unshift(scope);
    }
    if (typeof args[0] === 'object') {
      node = args[0];
    }
    if (!(func = operation.func)) {
      if (method = operation.method) {
        if (node && (func = node[method])) {
          args.shift();
          context = node;
        }
        if (!func) {
          if (!context && (func = scope[method])) {
            context = scope;
          } else if (command = this.commands[method]) {
            func = this.engine[command.reference];
          }
        }
      }
    }
    if (!func) {
      throw new Error("Couldn't find method: " + operation.method);
    }
    result = func.apply(context || this.engine, args);
    if (result !== result) {
      args.unshift(operation.name);
      return args;
    }
    if (callback = operation.def.callback) {
      result = this.engine[callback](context || node || scope, args, result, operation, continuation, scope);
    }
    return result;
  };

  Expressions.prototype.reuse = function(path, continuation) {
    var breaking, id, index, last, separator, start;
    last = -1;
    while ((index = continuation.indexOf('–', last + 1))) {
      if (index === -1) {
        if (last === continuation.length - 1) {
          break;
        }
        index = continuation.length;
        breaking = true;
      }
      start = continuation.substring(last + 1, last + 1 + path.length);
      if (start === path) {
        separator = last + 1 + path.length;
        if (separator < index) {
          if (continuation.charAt(separator) === '$') {
            id = continuation.substring(separator, index);
          }
        }
        if (id) {
          return this.engine.elements[id];
        } else {
          return this.engine.queries[continuation.substring(0, separator)];
        }
      }
      if (breaking) {
        break;
      }
      last = index;
    }
    return false;
  };

  Expressions.prototype.resolve = function(operation, continuation, scope, ascender, ascending, meta) {
    var args, argument, contd, index, offset, prev, shift, skip, stopping, _i, _len;
    args = prev = void 0;
    skip = operation.skip;
    shift = 0;
    offset = operation.offset || 0;
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      argument = operation[index];
      if (offset > index) {
        continue;
      }
      if (!offset && index === 0 && !operation.def.noop) {
        args = [operation, continuation || operation.path, scope];
        shift += 2;
        continue;
      } else if (ascender === index) {
        argument = ascending;
      } else if (skip === index) {
        shift--;
        continue;
      } else if (argument instanceof Array) {
        if (ascender < index) {
          contd = continuation;
          if (contd.charAt(contd.length - 1) !== '–') {
            contd += '–';
          }
        }
        argument = this.evaluate(argument, contd || continuation, scope, void 0, prev);
      }
      if (argument === void 0) {
        if (!operation.def.eager || (ascender != null)) {
          if (!operation.def.noop || operation.parent) {
            return false;
          }
          if (operation.name && !operation.parent) {
            stopping = true;
          }
        }
        offset += 1;
        continue;
      }
      (args || (args = []))[index - offset + shift] = prev = argument;
    }
    if (stopping || (!args && operation.def.noop)) {
      return false;
    }
    return args;
  };

  Expressions.prototype.ascend = function(operation, continuation, result, scope, ascender) {
    var breadcrumbs, captured, item, parent, _i, _len;
    if (result != null) {
      if ((parent = operation.parent) || operation.def.noop) {
        if (parent && this.engine.isCollection(result)) {
          console.group(continuation);
          for (_i = 0, _len = result.length; _i < _len; _i++) {
            item = result[_i];
            breadcrumbs = this.engine.getContinuation(continuation, item);
            this.evaluate(operation.parent, breadcrumbs, scope, operation.index, item);
          }
          console.groupEnd(continuation);
          return;
        } else if (parent != null ? parent.def.capture : void 0) {
          captured = parent.def.capture.call(this.engine, result, operation, continuation, scope);
          if (captured === true) {
            return;
          }
        } else {
          if (operation.def.noop || (parent.def.noop && !parent.name)) {
            if (result && (!parent || (parent.def.noop && (!parent.parent || parent.length === 1) || (ascender != null)))) {
              return this.push(result.length === 1 ? result[0] : result);
            }
          } else if (parent && ((ascender != null) || result.nodeType)) {
            this.evaluate(parent, continuation, scope, operation.index, result);
            return;
          }
        }
      } else {
        return this.push(result);
      }
    }
    return result;
  };

  Expressions.prototype.skip = function(operation, ascender) {
    var _base;
    if (operation.tail.path === operation.tail.key || (ascender != null)) {
      return (_base = operation.tail).shortcut || (_base.shortcut = this.engine.commands[operation.def.group].perform.call(this.engine, operation));
    } else {
      return operation.tail[1];
    }
  };

  Expressions.prototype.analyze = function(operation, parent) {
    var child, def, func, groupper, index, otherdef, _i, _len;
    if (typeof operation[0] === 'string') {
      operation.name = operation[0];
    }
    def = this.commands[operation.name];
    if (parent) {
      operation.parent = parent;
      operation.index = parent.indexOf(operation);
    }
    operation.arity = operation.length - 1;
    if (def && def.lookup) {
      if (operation.arity > 1) {
        operation.arity--;
        operation.skip = operation.length - operation.arity;
      } else {
        operation.skip = 1;
      }
      operation.name = (def.prefix || '') + operation[operation.skip] + (def.suffix || '');
      otherdef = def;
      switch (typeof def.lookup) {
        case 'function':
          def = def.lookup.call(this, operation);
          break;
        case 'string':
          def = this.commands[def.lookup + operation.name];
          break;
        default:
          def = this.commands[operation.name];
      }
    }
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      child = operation[index];
      if (child instanceof Array) {
        this.analyze(child, operation);
      }
    }
    if (def === void 0) {
      operation.def = {
        noop: true
      };
      return operation;
    }
    operation.def = def;
    if (def.serialized) {
      operation.key = this.serialize(operation, otherdef, false);
      operation.path = this.serialize(operation, otherdef);
      if (def.group) {
        operation.groupped = this.serialize(operation, otherdef, def.group);
        if (groupper = this.commands[def.group]) {
          groupper.analyze(operation);
        }
      }
    }
    if (typeof def === 'function') {
      func = def;
      operation.offset = 1;
    } else if (func = def[operation.arity]) {
      operation.offset = 1;
    } else {
      func = def.command;
    }
    if (def.offset) {
      if (operation.offset == null) {
        operation.offset = def.offset;
      }
    }
    if (typeof func === 'string') {
      operation.method = func;
    } else {
      operation.func = func;
    }
    return operation;
  };

  Expressions.prototype.serialize = function(operation, otherdef, group) {
    var after, before, def, groupper, index, op, prefix, separator, suffix, tail, _i, _ref;
    def = operation.def;
    prefix = def.prefix || (otherdef && otherdef.prefix) || (operation.def.noop && operation.name) || '';
    suffix = def.suffix || (otherdef && otherdef.suffix) || '';
    separator = operation.def.separator;
    after = before = '';
    for (index = _i = 1, _ref = operation.length; 1 <= _ref ? _i < _ref : _i > _ref; index = 1 <= _ref ? ++_i : --_i) {
      if (op = operation[index]) {
        if (typeof op !== 'object') {
          after += op;
        } else if (op.key && group !== false) {
          if (group && (groupper = this.commands[group])) {
            if (op.def.group === group) {
              if (tail = op.tail || (op.tail = groupper.condition(op) && op)) {
                operation.groupped = groupper.promise(op, operation);
                tail.head = operation;
                operation.tail = tail;
                before += (before && separator || '') + op.groupped || op.key;
              } else {
                continue;
              }
            } else {
              group = false;
              continue;
            }
          } else if (separator) {
            before += (before && separator || '') + op.path;
          } else {
            before += op.path;
          }
        }
      }
    }
    return before + prefix + after + suffix;
  };

  Expressions.prototype.log = function(operation, continuation) {
    if (continuation != null) {
      if (operation.def.serialized && !operation.def.hidden) {
        return continuation + operation.key;
      }
      return continuation;
    } else {
      return operation.path;
    }
  };

  Expressions.prototype.capture = function() {
    if (this.buffer === void 0) {
      this.buffer = null;
      return true;
    }
  };

  return Expressions;

})();

this.module || (this.module = {});

module.exports = Expressions;
