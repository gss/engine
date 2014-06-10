var Processor;

Processor = (function() {
  function Processor() {
    this.continuations = {};
  }

  Processor.prototype.evaluate = function(operation, context, continuation, from, ascending) {
    var args, argument, func, index, item, offset, path, promise, result, scope, skip, _base, _i, _j, _len, _len1, _ref;
    offset = (_ref = operation.offset) != null ? _ref : this.preprocess(operation).offset;
    if (promise = operation.promise) {
      operation = (_base = operation.tail).shortcut || (_base.shortcut = this.getGrouppedOperation(operation));
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
    if (operation.type === 'combinator' || operation.type === 'qualifier') {
      console.log('observing', operation, GSS.getId(scope || this));
      this.observer.add(scope, operation, continuation);
    }
    path = continuation || '';
    if (result != null) {
      if (this.isCollection(result)) {
        path += operation.path;
        console.group(path);
        for (_j = 0, _len1 = result.length; _j < _len1; _j++) {
          item = result[_j];
          this.evaluate(operation.parent, void 0, path + this.toId(item), operation.index, item);
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

  Processor.prototype.toPath = function(operation) {
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

  Processor.prototype.preprocess = function(operation, parent) {
    var child, def, func, group, index, prefix, property, suffix, tail, _i, _j, _len, _len1;
    operation.name = operation[0];
    def = this[operation.name];
    if (parent) {
      operation.parent = parent;
      operation.index = parent.indexOf(operation);
    }
    operation.arity = operation.length - 1;
    if (def.lookup) {
      operation.arity--;
      operation.skip = operation.length - operation.arity;
      operation.name = (def.prefix || '') + operation[operation.skip];
      console.log(def.lookup, def, 'lol');
      for (_i = 0, _len = def.length; _i < _len; _i++) {
        property = def[_i];
        if (property !== 'lookup') {
          operation[property] = def[property];
        }
      }
      if (typeof def.lookup === 'function') {
        def = def.lookup.call(this, operation);
      } else {
        def = this[operation.name];
      }
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
    if (def !== true) {
      operation.path = this.toPath(operation);
    }
    for (index = _j = 0, _len1 = operation.length; _j < _len1; index = ++_j) {
      child = operation[index];
      if (child instanceof Array) {
        this.preprocess(child, operation).group;
        if (index === 1 && group && group === child.group) {
          tail = child.tail || (child.tail = this.canStartGroup(child, group) && child);
          if (tail) {
            operation.promise = (child.promise || child.path) + operation.path;
            console.log('promising', operation.promise, child);
            tail.head = operation;
            tail.promise = operation.promise;
            operation.tail = tail;
          }
        }
      }
    }
    operation.offset = 0;
    if (def === true) {
      operation.noop = true;
      return operation;
    }
    if (func = def[operation.arity]) {
      operation.offset += 1;
    } else {
      func = def.command;
    }
    if (typeof func === 'string') {
      if (this[func]) {
        operation.func = this[func];
      } else {
        operation.method = func;
      }
    } else {
      operation.func = func;
    }
    return operation;
  };

  Processor.prototype.getGrouppedOperation = function(operation) {
    var global, shortcut, tail;
    shortcut = [operation.group, operation.promise];
    if (operation.tail.parent === operation) {
      console.error(operation);
    }
    shortcut.parent = (operation.head || operation).parent;
    shortcut.index = (operation.head || operation).index;
    this.preprocess(shortcut);
    tail = operation.tail;
    global = tail.arity === 1 && tail.length === 2;
    if (!global) {
      shortcut.splice(1, 0, tail[1]);
    }
    return shortcut;
  };

  Processor.prototype.canStartGroup = function(operation, group) {
    if (group === '$query') {
      if (operation.name === '$combinator') {
        if (group[group.skip] !== ' ') {
          return false;
        }
      } else if (operation.arity === 2) {
        return false;
      }
    }
    return true;
  };

  Processor.prototype.isCollection = function(object) {
    if (typeof object === 'object' && object.length !== void 0) {
      if (!(typeof object[0] === 'string' && this[object[0]] === true)) {
        return true;
      }
    }
  };

  return Processor;

})();

module.exports = Processor;
