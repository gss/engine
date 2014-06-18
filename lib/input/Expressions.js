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
      buffer.push(args);
    } else {
      return this.output.read.apply(this.output, args);
    }
  };

  Expressions.prototype.evaluate = function(operation, continuation, scope, ascender, ascending, overloaded) {
    var args, argument, callback, def, evaluated, func, index, item, object, offset, parent, path, pdef, prev, promise, result, skip, subpath, _base, _i, _j, _len, _len1;
    console.log(operation);
    def = operation.def || this.analyze(operation).def;
    if ((parent = operation.parent) && !overloaded) {
      if ((pdef = parent.def) && pdef.evaluate) {
        evaluated = pdef.evaluate.call(this, operation, continuation, scope, ascender, ascending);
        if (evaluated !== this) {
          return evaluated;
        }
      }
    }
    if (promise = operation.promise) {
      operation = (_base = operation.tail).shortcut || (_base.shortcut = this.context[def.group].perform(this, operation));
      ascender = ascender !== void 0 && 1 || void 0;
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
        if (continuation) {
          argument = continuation;
        }
      } else if (ascender === index) {
        argument = ascending;
      } else if (skip === index) {
        offset += 1;
        continue;
      } else if (argument instanceof Array) {
        argument = this.evaluate(argument, continuation, scope, void 0, prev);
      }
      if (argument === void 0) {
        return;
      }
      (args || (args = []))[index - offset] = prev = argument;
    }
    if (operation.noop) {
      if (parent && parent.def.receive) {
        return parent.def.receive(this.engine, scope, args);
      } else if (parent && (!parent.noop || parent.parent)) {
        return args;
      } else {
        return this.write(args);
      }
    }
    if (def.scoped) {
      scope || (scope = this.engine.scope);
      (args || (args = [])).unshift(scope);
    }
    if (!(func = operation.func)) {
      object = (typeof args[0] === 'object' && args.shift()) || this.engine.scope;
      func = object && object[operation.method];
    }
    if (!func) {
      throw new Error("Engine broke, couldn't find method: " + operation.method);
    }
    result = func.apply(object || this.context, args);
    if (callback = operation.def.callback) {
      result = this.context[callback](object, args, result, operation, continuation, scope);
    }
    path = (continuation || '') + operation.path;
    if (result != null) {
      if (parent) {
        if (this.engine.isCollection(result)) {
          console.group(path);
          for (_j = 0, _len1 = result.length; _j < _len1; _j++) {
            item = result[_j];
            subpath = this.engine.references.combine(path, item);
            this.evaluate(parent, subpath, scope, operation.index, item);
          }
          console.groupEnd(path);
          return;
        } else if (parent.def.receive) {
          parent.def.receive(this.engine, object, result);
        } else if (ascender != null) {
          this.evaluate(parent, path, scope, operation.index, result);
        }
      } else {
        return this.write(result);
      }
    }
    return result;
  };

  Expressions.prototype.analyze = function(operation, parent) {
    var child, command, def, func, groupper, index, otherdef, tail, _i, _j, _len, _len1;
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
    operation.path = this.serialize(operation, otherdef);
    if (def.group && (groupper = this.context[def.group])) {
      groupper.analyze(operation);
    }
    for (index = _j = 0, _len1 = operation.length; _j < _len1; index = ++_j) {
      child = operation[index];
      if (child instanceof Array) {
        if (index === 1 && def.group) {
          if (def.group === child.def.group) {
            tail = child.tail || (child.tail = groupper.attempt(child) && child);
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
      operation.offset = 1;
    } else if (func = def[operation.arity]) {
      operation.offset = 1;
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

  Expressions.prototype.serialize = function(operation, otherdef) {
    var def, index, op, path, prefix, start, suffix, _i, _ref;
    def = operation.def;
    prefix = def.prefix || (otherdef && otherdef.prefix) || (operation.noop && operation.name) || '';
    suffix = def.suffix || (otherdef && otherdef.suffix) || '';
    path = '';
    start = 1 + (operation.length > 2);
    for (index = _i = start, _ref = operation.length; start <= _ref ? _i < _ref : _i > _ref; index = start <= _ref ? ++_i : --_i) {
      if (op = operation[index]) {
        if (typeof op !== 'object') {
          path += operation[index];
        }
      }
    }
    return prefix + path + suffix;
  };

  return Expressions;

})();

module.exports = Expressions;
