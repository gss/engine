var Expressions;

Expressions = (function() {
  function Expressions(engine, output) {
    this.engine = engine;
    this.output = output;
    this.commands = this.engine && this.engine.commands || this;
  }

  Expressions.prototype.pull = function(expression, continuation) {
    var capture, result;
    if (expression) {
      capture = this.capture(expression);
      result = this.evaluate.apply(this, arguments);
      if (capture) {
        this.release();
      }
    }
    return result;
  };

  Expressions.prototype.push = function(args, batch) {
    var buffer;
    if (args == null) {
      return;
    }
    if ((buffer = this.buffer) !== void 0) {
      if (!(this.engine.onBuffer && this.engine.onBuffer(buffer, args, batch) === false)) {
        (buffer || (this.buffer = [])).push(args);
      }
    } else {
      return this.output.pull.apply(this.output, args);
    }
  };

  Expressions.prototype.flush = function() {
    var added, buffer;
    if (this.engine.onFlush) {
      added = this.engine.onFlush(this.buffer);
    }
    buffer = this.buffer && added && added.concat(this.buffer) || this.buffer || added;
    this.lastOutput = this.engine.clone(buffer);
    if (buffer) {
      this.buffer = void 0;
      this.output.pull(buffer);
    } else if (this.buffer === void 0) {
      this.engine.push();
    } else {
      this.buffer = void 0;
    }
    return this.engine.console.groupEnd();
  };

  Expressions.prototype.evaluate = function(operation, continuation, scope, meta, ascender, ascending) {
    var args, contd, evaluate, evaluated, result, _ref;
    if (!operation.def) {
      this.analyze(operation);
    }
    if (meta !== operation && (evaluate = (_ref = operation.parent) != null ? _ref.def.evaluate : void 0)) {
      evaluated = evaluate.call(this.engine, operation, continuation, scope, meta, ascender, ascending);
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
    args = this.resolve(operation, continuation, scope, meta, ascender, ascending);
    if (args === false) {
      return;
    }
    if (operation.name) {
      this.engine.console.row(operation, args, continuation || "");
    }
    if (operation.def.noop) {
      result = args;
    } else {
      result = this.execute(operation, continuation, scope, args);
      contd = continuation;
      continuation = this.log(operation, continuation);
    }
    return this.ascend(operation, continuation, result, scope, meta, ascender);
  };

  Expressions.prototype.execute = function(operation, continuation, scope, args) {
    var command, context, func, method, node, onAfter, onBefore, result;
    scope || (scope = this.engine.scope);
    if (operation.def.scoped || !args) {
      node = scope;
      (args || (args = [])).unshift(scope);
    } else {
      node = this.engine.getContext(args, operation, scope, node);
    }
    if (!(func = operation.func)) {
      if (method = operation.method) {
        if (node && (func = node[method])) {
          if (args[0] === node) {
            args.shift();
          }
          context = node;
        }
        if (!func) {
          if (!context && (func = scope[method])) {
            context = scope;
          } else if (command = this.commands[method]) {
            func = this.engine[command.displayName];
          }
        }
      }
    }
    if (!func) {
      throw new Error("Couldn't find method: " + operation.method);
    }
    if (onBefore = operation.def.before) {
      result = this.engine[onBefore](context || node || scope, args, operation, continuation, scope);
    }
    if (result === void 0) {
      result = func.apply(context || this.engine, args);
    }
    if (onAfter = operation.def.after) {
      result = this.engine[onAfter](context || node || scope, args, result, operation, continuation, scope);
    }
    if (result !== result) {
      args.unshift(operation.name);
      return args;
    }
    return result;
  };

  Expressions.prototype.reuse = function(path, continuation) {
    var bit, index, key, length, _i, _len, _ref;
    length = path.length;
    _ref = continuation.split(this.engine.RIGHT);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      bit = key;
      if ((index = bit.lastIndexOf(this.engine.DOWN)) > -1) {
        bit = bit.substring(index + 1);
      }
      if (bit === path || bit.substring(0, path.length) === path) {
        if (length < bit.length && bit.charAt(length) === '$') {
          return this.engine.elements[bit.substring(length)];
        } else {
          return this.engine.queries[key];
        }
      }
    }
    return false;
  };

  Expressions.prototype.resolve = function(operation, continuation, scope, meta, ascender, ascending) {
    var args, argument, contd, index, mark, offset, prev, shift, skip, stopping, _i, _len;
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
        args = [operation, continuation || operation.path, scope, meta];
        shift += 3;
        continue;
      } else if (ascender === index) {
        argument = ascending;
      } else if (skip === index) {
        shift--;
        continue;
      } else if (argument instanceof Array) {
        if (ascender != null) {
          mark = operation.def.rule && ascender === 1 && this.engine.DOWN || this.engine.RIGHT;
          if (mark) {
            contd = this.engine.getContinuation(continuation, null, mark);
          } else {
            contd = continuation;
          }
        }
        argument = this.evaluate(argument, contd || continuation, scope, meta, void 0, prev);
      }
      if (argument === void 0) {
        if (!operation.def.eager || (ascender != null)) {
          if (operation.def.capture && (operation.parent ? operation.def.noop : !operation.name)) {
            stopping = true;
          } else if (!operation.def.noop || operation.name) {
            return false;
          }
        }
        offset += 1;
        continue;
      }
      (args || (args = []))[index - offset + shift] = prev = argument;
    }
    return args;
  };

  Expressions.prototype.ascend = function(operation, continuation, result, scope, meta, ascender) {
    var breadcrumbs, captured, item, parent, _base, _i, _len, _ref;
    if (result != null) {
      if ((parent = operation.parent) || operation.def.noop) {
        if (parent && (typeof (_base = this.engine).isCollection === "function" ? _base.isCollection(result) : void 0)) {
          this.engine.console.group('%s \t\t\t\t%o\t\t\t%c%s', this.engine.UP, operation.parent, 'font-weight: normal; color: #999', continuation);
          for (_i = 0, _len = result.length; _i < _len; _i++) {
            item = result[_i];
            breadcrumbs = this.engine.getContinuation(continuation, item, this.engine.UP);
            this.evaluate(operation.parent, breadcrumbs, scope, meta, operation.index, item);
          }
          this.engine.console.groupEnd();
          return;
        } else {
          captured = parent != null ? (_ref = parent.def.capture) != null ? _ref.call(this.engine, result, operation, continuation, scope, meta) : void 0 : void 0;
          switch (captured) {
            case true:
              return;
            default:
              if (typeof captured === 'string') {
                continuation = captured;
                operation = operation.parent;
                parent = parent.parent;
              }
          }
          if (operation.def.noop && operation.name && result.length === 1) {
            return;
          }
          if (operation.def.noop || (parent.def.noop && !parent.name)) {
            if (result && (!parent || (parent.def.noop && (!parent.parent || parent.length === 1) || (ascender != null)))) {
              return this.push(result.length === 1 ? result[0] : result);
            }
          } else if (parent && ((ascender != null) || (result.nodeType && (!operation.def.hidden || parent.tail === parent)))) {
            this.evaluate(parent, continuation, scope, meta, operation.index, result);
            return;
          } else {
            return result;
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
    var child, def, func, index, otherdef, _i, _len, _ref;
    if (typeof operation[0] === 'string') {
      operation.name = operation[0];
    }
    def = this.commands[operation.name];
    if (parent) {
      operation.parent = parent;
      operation.index = parent.indexOf(operation);
      if (parent.bound || ((_ref = parent.def) != null ? _ref.bound : void 0) === operation.index) {
        operation.bound = true;
      }
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
    operation.def = def || (def = {
      noop: true
    });
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      child = operation[index];
      if (child instanceof Array) {
        this.analyze(child, operation);
      }
    }
    if (def.noop) {
      return;
    }
    if (def.serialized) {
      operation.key = this.serialize(operation, otherdef, false);
      operation.path = this.serialize(operation, otherdef);
      if (def.group) {
        operation.groupped = this.serialize(operation, otherdef, def.group);
      }
    }
    if (def.init) {
      this.engine[def.init](operation, false);
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
        return continuation + (operation.key || operation.path);
      }
      return continuation;
    } else {
      return operation.path;
    }
  };

  Expressions.prototype.release = function() {
    this.endTime = this.engine.time();
    this.flush();
    return this.endTime;
  };

  Expressions.prototype.capture = function(reason) {
    var fmt, method, name;
    if (this.buffer !== void 0) {
      return;
    }
    this.engine.start();
    fmt = '%c%s%c';
    if (typeof reason !== 'string') {
      if (reason != null ? reason.slice : void 0) {
        reason = this.engine.clone(reason);
      }
      fmt += '\t\t%O';
    } else {
      fmt += '\t%s';
    }
    if (this.engine.onDOMContentLoaded) {
      name = 'GSS.Document';
    } else {
      name = 'GSS.Solver';
      method = 'groupCollapsed';
    }
    this.engine.console[method || 'group'](fmt, 'font-weight: normal', name, 'color: #666; font-weight: normal', reason);
    this.startTime = this.engine.time();
    this.buffer = null;
    return true;
  };

  return Expressions;

})();

this.module || (this.module = {});

module.exports = Expressions;
