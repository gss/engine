var Expressions;

Expressions = (function() {
  function Expressions(engine, output) {
    this.engine = engine;
    this.output = output;
    this.commands = this.engine && this.engine.commands || this;
  }

  Expressions.prototype.pull = function() {
    var buffer, result;
    buffer = this.capture();
    this.engine.start();
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
        console.error(args);
        debugger;
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
    } else {
      return this.buffer = void 0;
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
    var args, contd, evaluate, evaluated, result, _ref;
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
      contd = continuation;
      continuation = this.log(operation, continuation);
    }
    return this.ascend(operation, continuation, result, scope, ascender, contd === continuation);
  };

  Expressions.prototype.execute = function(operation, continuation, scope, args) {
    var command, context, func, method, node, onAfter, onBefore, result;
    scope || (scope = this.engine.scope);
    if (operation.def.scoped || !args) {
      node = scope;
      (args || (args = [])).unshift(scope);
    } else if (typeof args[0] === 'object') {
      node = args[0];
    } else if (!operation.bound) {
      node = this.engine.scope;
    } else {
      node = scope;
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
            func = this.engine[command.reference];
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
    _ref = continuation.split('–');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      bit = key;
      if ((index = bit.indexOf('…')) > -1) {
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
        if (ascender != null) {
          contd = continuation;
          if (operation.def.rule && ascender === 1) {
            if (contd.charAt(contd.length - 1) !== '…') {
              contd += '…';
            }
          } else {
            if (contd.charAt(contd.length - 1) !== '–') {
              contd += '–';
            }
          }
        }
        argument = this.evaluate(argument, contd || continuation, scope, void 0, prev);
      }
      if (argument === void 0) {
        if (!operation.def.eager || (ascender != null)) {
          if (!operation.def.capture && (operation.parent ? operation.def.noop : !operation.name)) {
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

  Expressions.prototype.ascend = function(operation, continuation, result, scope, ascender, hidden) {
    var breadcrumbs, item, parent, plural, _i, _len, _ref;
    if (result != null) {
      if ((parent = operation.parent) || operation.def.noop) {
        if (parent && this.engine.isCollection(result) && (plural = this.getPluralIndex(continuation)) === -1) {
          console.group(continuation);
          for (_i = 0, _len = result.length; _i < _len; _i++) {
            item = result[_i];
            breadcrumbs = this.engine.getContinuation(continuation, item);
            this.evaluate(operation.parent, breadcrumbs, scope, operation.index, item);
          }
          console.groupEnd(continuation);
          return;
          console.log('bound to', plural);
        } else if ((parent != null ? (_ref = parent.def.capture) != null ? _ref.call(this.engine, result, operation, continuation, scope) : void 0 : void 0) === true) {
          return;
        } else {
          if (plural != null) {
            console.log(result, plural);
            result = result[plural];
          }
          if (operation.def.noop && operation.name && result.length === 1) {
            return;
          }
          if (operation.def.noop || (parent.def.noop && !parent.name)) {
            if (result && (!parent || (parent.def.noop && (!parent.parent || parent.length === 1) || (ascender != null)))) {
              return this.push(result.length === 1 ? result[0] : result);
            }
          } else if (parent && ((ascender != null) || (result.nodeType && (!operation.def.hidden || parent.tail === parent)))) {
            this.evaluate(parent, continuation, scope, operation.index, result);
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

  Expressions.prototype.pluralRegExp = /(^|–)([^–]+)(\$[a-z0-9-]+)($|–)/i;

  Expressions.prototype.getPluralIndex = function(continuation) {
    var plural;
    if (!continuation) {
      return;
    }
    if (plural = continuation.match(this.pluralRegExp)) {
      console.log(this.engine.queries[plural[2]], 666, this.engine.elements[plural[3]], plural[3]);
      debugger;
      return this.engine.queries[plural[2]].indexOf(this.engine.elements[plural[3]]);
    }
    return -1;
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
    var child, def, func, groupper, index, otherdef, _i, _len, _ref;
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
        if (groupper = this.commands[def.group]) {
          groupper.analyze(operation, false);
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

  Expressions.prototype.release = function() {
    if (this.engine.expressions.buffer) {
      return this.engine.expressions.flush();
    } else {
      return this.engine.expressions.buffer = void 0;
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
