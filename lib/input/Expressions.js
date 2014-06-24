var Expressions;

Expressions = (function() {
  function Expressions(engine, context, output) {
    this.engine = engine;
    this.context = context;
    this.output = output;
    this.context || (this.context = this.engine && this.engine.context || this);
  }

  Expressions.prototype.pull = function() {
    var buffer, result;
    if (this.buffer === void 0) {
      this.buffer = null;
      buffer = true;
    }
    console.log(this.engine.onDOMContentLoaded && 'Document' || 'Worker', 'input:', JSON.parse(JSON.stringify(arguments[0])));
    result = this.evaluate.apply(this, arguments);
    if (buffer) {
      this.flush();
    }
    return result;
  };

  Expressions.prototype.flush = function() {
    console.log(123123123, this.buffer);
    this.lastOutput = this.buffer;
    this.output.pull(this.buffer);
    return this.buffer = void 0;
  };

  Expressions.prototype.push = function(args, batch) {
    var buffer, last;
    if (args == null) {
      return;
    }
    if ((buffer = this.buffer) !== void 0) {
      if (buffer) {
        if (batch) {
          if (last = buffer[buffer.length - 1]) {
            if (last[0] === args[0]) {
              if (last.indexOf(args[1]) === -1) {
                last.push.apply(last, args.slice(1));
              }
              return buffer;
            }
          }
        }
      } else {
        this.buffer = buffer = [];
      }
      buffer.push(args);
    } else {
      return this.output.pull.apply(this.output, args);
    }
  };

  Expressions.prototype.evaluate = function(operation, continuation, scope, ascender, ascending, overloaded) {
    var args, argument, bit, breaking, callback, contd, context, def, evaluated, func, id, index, item, last, method, node, offset, parent, path, pdef, prev, result, separator, skip, subpath, _base, _i, _j, _len, _len1;
    def = operation.def || this.analyze(operation).def;
    if ((parent = operation.parent) && !overloaded) {
      if ((pdef = parent.def) && pdef.evaluate) {
        evaluated = pdef.evaluate.call(this, operation, continuation, scope, ascender, ascending);
        if (evaluated !== this) {
          return evaluated;
        }
      }
    }
    if (operation.tail) {
      if (operation.tail.path === operation.tail.key || (ascender != null)) {
        console.log('Shortcut up', operation, operation.tail, [continuation]);
        operation = (_base = operation.tail).shortcut || (_base.shortcut = this.context[def.group].perform(this, operation));
      } else {
        console.log('Shortcut down', operation, operation.tail, [continuation]);
        operation = operation.tail[1];
      }
      parent = operation.parent;
      ascender = ascender !== void 0 && 1 || void 0;
      def = operation.def;
    }
    if (operation.path && continuation) {
      last = -1;
      while ((index = continuation.indexOf('–', last + 1))) {
        if (index === -1) {
          index = continuation.length;
          breaking = true;
        }
        bit = continuation.substring(last + 1, index);
        if (bit === operation.path) {
          separator = last + 1 + operation.path.length;
          id = continuation.substring(separator, index);
          if (id) {
            return this.engine[id];
          } else {
            return this.engine.queries[continuation.substring(0, separator)];
          }
        }
        if (breaking) {
          break;
        }
        last = index;
      }
    }
    args = prev = void 0;
    skip = operation.skip;
    offset = operation.offset || 0;
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      argument = operation[index];
      if (offset > index) {
        continue;
      }
      if (index === 0 && (!operation.noop && !offset)) {
        argument = continuation || operation;
      } else if (ascender === index) {
        argument = ascending;
      } else if (skip === index) {
        offset += 1;
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
      if (argument === void 0 && (!def.eager || ascender !== void 0)) {
        return;
      }
      (args || (args = []))[index - offset] = prev = argument;
    }
    if (operation.noop) {
      if (parent && parent.def.capture) {
        return parent.def.capture(this.engine, args, parent, continuation, scope);
      } else if (parent && (!parent.noop || parent.parent)) {
        return args;
      } else {
        return this.push(args);
      }
    }
    scope || (scope = this.engine.scope);
    if (def.scoped || !args) {
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
          } else {
            func = this[method] || this.context[method];
          }
        }
      }
    }
    if (!func) {
      throw new Error("Engine broke, couldn't find method: " + operation.method);
    }
    result = func.apply(context || this.context, args);
    if (callback = operation.def.callback) {
      result = this.context[callback](context || node || scope, args, result, operation, continuation, scope);
    }
    if (continuation) {
      path = continuation;
      if (def.serialized && !def.hidden) {
        path += operation.key;
      }
    } else {
      path = operation.path;
    }
    if (result != null) {
      if (parent) {
        if (this.engine.isCollection(result)) {
          console.group(path);
          for (_j = 0, _len1 = result.length; _j < _len1; _j++) {
            item = result[_j];
            subpath = this.engine.getPath(path, item);
            this.evaluate(parent, subpath, scope, operation.index, item);
          }
          console.groupEnd(path);
          return;
        } else if (parent.def.capture) {
          return parent.def.capture(this.engine, result, parent, continuation, scope);
        } else if ((ascender != null) || result.nodeType) {
          this.evaluate(parent, path, scope, operation.index, result);
          return;
        }
      } else {
        return this.push(result);
      }
    }
    return result;
  };

  Expressions.prototype.analyze = function(operation, parent) {
    var child, def, func, groupper, index, otherdef, _i, _len;
    operation.name = operation[0];
    def = this.engine.context[operation.name];
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
      operation.name = (def.prefix || '') + operation[operation.skip];
      otherdef = def;
      if (typeof def.lookup === 'function') {
        def = def.lookup.call(this, operation);
      } else {
        def = this.context[operation.name];
      }
    }
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      child = operation[index];
      if (child instanceof Array) {
        this.analyze(child, operation);
      }
    }
    if (def === void 0) {
      operation.def = operation.noop = true;
      return operation;
    }
    operation.def = def;
    if (def.serialized) {
      operation.key = this.serialize(operation, otherdef, false);
      operation.path = this.serialize(operation, otherdef);
      if (def.group) {
        operation.groupped = this.serialize(operation, otherdef, def.group);
        if (groupper = this.context[def.group]) {
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
    prefix = def.prefix || (otherdef && otherdef.prefix) || (operation.noop && operation.name) || '';
    suffix = def.suffix || (otherdef && otherdef.suffix) || '';
    separator = operation.def.separator;
    after = before = '';
    for (index = _i = 1, _ref = operation.length; 1 <= _ref ? _i < _ref : _i > _ref; index = 1 <= _ref ? ++_i : --_i) {
      if (op = operation[index]) {
        if (typeof op !== 'object') {
          after += op;
        } else if (op.key && group !== false) {
          if (group && (groupper = this.context[group])) {
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

  return Expressions;

})();

module.exports = Expressions;
