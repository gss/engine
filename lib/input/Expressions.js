var Expressions;

Expressions = (function() {
  function Expressions(engine, context, output) {
    this.engine = engine;
    this.context = context;
    this.output = output;
    this.context || (this.context = this.engine && this.engine.context || this);
  }

  Expressions.prototype.read = function() {
    var result;
    this.buffer = null;
    console.log(this.engine.onDOMContentLoaded && 'Document' || 'Worker', 'input:', JSON.parse(JSON.stringify(arguments[0])));
    result = this.evaluate.apply(this, arguments);
    if (this.buffer) {
      this.lastOutput = this.buffer;
      this.output.read(this.buffer);
      this.buffer = void 0;
    }
    return result;
  };

  Expressions.prototype.write = function(args, batch) {
    var buffer, last;
    if ((buffer = this.buffer) !== void 0) {
      if (args == null) {
        return;
      }
      if (buffer) {
        if (batch) {
          if (last = buffer[buffer.length - 1]) {
            if (last[0] === args[0]) {
              last.push.apply(last, args.slice(1));
              return buffer;
            }
          }
        }
      } else {
        this.buffer = buffer = [];
      }
    } else {
      return this.output.read.apply(this.output, args);
    }
  };

  Expressions.prototype.evaluate = function(operation, context, continuation, from, ascending) {
    var args, argument, callback, func, index, item, offset, parent, path, promise, result, scope, skip, _base, _i, _j, _len, _len1, _ref;
    console.log(operation);
    offset = (_ref = operation.offset) != null ? _ref : this.analyze(operation).offset;
    if (promise = operation.promise) {
      operation = (_base = operation.tail).shortcut || (_base.shortcut = this.context[operation.group].perform(this, operation));
      from = ascending !== void 0 && 1 || void 0;
    }
    args = null;
    skip = operation.skip;
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      argument = operation[index];
      if (offset > index) {
        continue;
      }
      if (index === 0 && (!operation.noop && !offset)) {
        if (continuation) {
          argument = continuation;
        }
      } else if (from === index) {
        argument = ascending;
      } else if (skip === index) {
        offset += 1;
        continue;
      } else if (argument instanceof Array) {
        argument = (operation.evaluate || this.evaluate).call(this, argument, (args || (args = [])));
      }
      if (argument === void 0) {
        return;
      }
      (args || (args = []))[index - offset] = argument;
    }
    if (operation.noop) {
      parent = operation.parent;
      if (parent && (!parent.noop || parent.parent)) {
        return args;
      } else {
        return this.write(args);
      }
    }
    if (!(func = operation.func)) {
      scope = (typeof args[0] === 'object' && args.shift()) || this.engine.scope;
      func = scope && scope[operation.method];
    }
    if (!func) {
      throw new Error("Engine broke, couldn't find method: " + operation.method);
    }
    result = func.apply(scope || this.context, args);
    if (callback = operation.callback) {
      result = this.context[callback](this.engine, scope, args, result, operation, continuation);
    }
    path = (continuation || '') + operation.path;
    if (result != null) {
      if (this.engine.isCollection(result)) {
        console.group(path);
        for (_j = 0, _len1 = result.length; _j < _len1; _j++) {
          item = result[_j];
          this.evaluate(operation.parent, void 0, this.engine.references.combine(path, item), operation.index, item);
        }
        console.groupEnd(path);
      } else if (!context) {
        if (operation.parent) {
          this.evaluate(operation.parent, void 0, path, operation.index, result);
        } else {
          return this.write(result);
        }
      }
    }
    return result;
  };

  Expressions.prototype.analyze = function(operation, parent) {
    var callback, child, command, def, evaluate, func, group, index, prefix, property, suffix, tail, _i, _j, _len, _len1;
    operation.name = operation[0];
    def = this.engine.context[operation.name];
    if (parent) {
      operation.parent = parent;
      operation.index = parent.indexOf(operation);
    }
    operation.arity = operation.length - 1;
    if (def && def.lookup) {
      operation.arity--;
      operation.skip = operation.length - operation.arity;
      operation.name = (def.prefix || '') + operation[operation.skip];
      for (property in def) {
        if (property !== 'lookup') {
          operation[property] = def[property];
        }
      }
      if (typeof def.lookup === 'function') {
        def = def.lookup.call(this, operation);
      } else {
        def = this.context[operation.name];
      }
    }
    operation.offset = 0;
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      child = operation[index];
      if (child instanceof Array) {
        this.analyze(child, operation).group;
      }
    }
    if (def === void 0) {
      operation.noop = true;
      return operation;
    }
    if (group = def.group) {
      operation.group = group;
    }
    if (prefix = def.prefix) {
      operation.prefix = prefix;
    }
    if (suffix = def.suffix) {
      operation.suffix = suffix;
    }
    if (callback = def.callback) {
      operation.callback = callback;
    }
    if (evaluate = def.evaluate) {
      operation.evaluate = evaluate;
    }
    operation.path = this.serialize(operation);
    for (index = _j = 0, _len1 = operation.length; _j < _len1; index = ++_j) {
      child = operation[index];
      if (child instanceof Array) {
        if (index === 1 && group && group === child.group) {
          if (def = this.context[group]) {
            tail = child.tail || (child.tail = def.attempt(child) && child);
            if (tail) {
              operation.promise = (child.promise || child.path) + operation.path;
              tail.head = operation;
              tail.promise = operation.promise;
              operation.tail = tail;
            }
          }
        }
      }
    }
    if (typeof def === 'function') {
      func = def;
      operation.offset += 1;
    } else if (func = def[operation.arity]) {
      operation.offset += 1;
    } else {
      func = def.command;
    }
    if (typeof func === 'string') {
      if (command = this.context[func]) {
        operation.func = command;
      } else {
        operation.method = func;
      }
    } else {
      operation.func = func;
    }
    return operation;
  };

  Expressions.prototype.serialize = function(operation) {
    var index, path, prefix, start, suffix, _i, _ref;
    prefix = operation.prefix || (operation.noop && operation.name) || '';
    suffix = operation.suffix || '';
    path = '';
    start = 1 + (operation.length > 2);
    for (index = _i = start, _ref = operation.length; start <= _ref ? _i < _ref : _i > _ref; index = start <= _ref ? ++_i : --_i) {
      path += operation[index];
    }
    return prefix + path + suffix;
  };

  return Expressions;

})();

module.exports = Expressions;
