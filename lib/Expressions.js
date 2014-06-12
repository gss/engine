var Expression;

Expression = (function() {
  function Expression() {}

  Expression.prototype.evaluate = function(operation, context, continuation, from, ascending) {
    var args, argument, func, index, item, offset, path, promise, result, scope, skip, _base, _i, _j, _len, _len1, _ref;
    offset = (_ref = operation.offset) != null ? _ref : this.preprocess(operation).offset;
    if (promise = operation.promise) {
      operation = (_base = operation.tail).shortcut || (_base.shortcut = this.commands[operation.group].perform(this, operation));
      from = ascending !== void 0 && 1 || void 0;
    }
    args = null;
    skip = operation.skip;
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      argument = operation[index];
      if (offset > index) {
        continue;
      }
      if (index === 0) {
        if (continuation && !operation.noop) {
          argument = continuation;
        }
      } else if (from === index) {
        argument = ascending;
      } else if (skip === index) {
        offset += 1;
        continue;
      } else if (argument instanceof Array) {
        argument = (operation.evaluate || this.evaluate).call(this, argument, args);
      }
      if (argument === void 0) {
        return;
      }
      (args || (args = []))[index - offset] = argument;
    }
    if (operation.noop) {
      if (operation.parent) {
        return args;
      } else {
        return this["return"](args);
      }
    }
    if (!(func = operation.func)) {
      scope = (typeof args[0] === 'object' && args.shift()) || this.engine.queryScope;
      func = scope && scope[operation.method];
    }
    if (!func) {
      throw new Error("Engine broke, couldn't find method: " + operation.method);
    }
    result = func.apply(scope || this, args);
    if (operation.type === 'combinator' || operation.type === 'qualifier' || operation.group === '$query') {
      result = this.observer.set(scope || operation.func && args[0], result, operation, continuation);
    }
    path = (continuation || '') + operation.path;
    if (result != null) {
      if (this.isCollection(result)) {
        console.group(path);
        for (_j = 0, _len1 = result.length; _j < _len1; _j++) {
          item = result[_j];
          this.evaluate(operation.parent, void 0, this.getObjectPath(path, item), operation.index, item);
        }
        console.groupEnd(path);
      } else if (!context) {
        if (operation.parent) {
          this.evaluate(operation.parent, void 0, path, operation.index, result);
        } else {
          return this["return"](result);
        }
      }
    }
    return result;
  };

  Expression.prototype.preprocess = function(operation, parent) {
    var child, command, def, func, group, index, prefix, property, suffix, tail, _i, _j, _len, _len1;
    operation.name = operation[0];
    def = this.commands[operation.name];
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
        def = this.commands[operation.name];
      }
    }
    operation.offset = 0;
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      child = operation[index];
      if (child instanceof Array) {
        this.preprocess(child, operation).group;
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
    operation.path = this.getOperationPath(operation);
    for (index = _j = 0, _len1 = operation.length; _j < _len1; index = ++_j) {
      child = operation[index];
      if (child instanceof Array) {
        if (index === 1 && group && group === child.group) {
          if (def = this.commands[group]) {
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
    if (func = def[operation.arity]) {
      operation.offset += 1;
    } else {
      func = def.command;
    }
    if (typeof func === 'string') {
      if (command = this.commands[func]) {
        operation.func = command;
      } else {
        operation.method = func;
      }
    } else {
      operation.func = func;
    }
    return operation;
  };

  Expression.prototype.isCollection = function(object) {
    if (typeof object === 'object' && object.length !== void 0) {
      if (!(typeof object[0] === 'string' && !this.commands[object[0]])) {
        return true;
      }
    }
  };

  Expression.prototype.getOperationPath = function(operation) {
    var index, path, prefix, start, suffix, _i, _ref;
    prefix = operation.prefix || '';
    suffix = operation.suffix || '';
    path = '';
    start = 1 + (operation.length > 2);
    for (index = _i = start, _ref = operation.length; start <= _ref ? _i < _ref : _i > _ref; index = start <= _ref ? ++_i : --_i) {
      path += operation[index];
    }
    return prefix + path + suffix;
  };

  return Expression;

})();

module.exports = Expression;
