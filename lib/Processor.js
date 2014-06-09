var Processor;

Processor = (function() {
  function Processor() {
    this.promises = {};
  }

  Processor.prototype.evaluate = function(operation, context, continuation, promised, from, bubbled, singular) {
    var args, argument, eager, func, index, link, offset, path, result, scope, skip, value, _i, _len, _ref;
    offset = (_ref = operation.offset) != null ? _ref : this.preprocess(operation).offset;
    skip = operation.skip;
    args = null;
    for (index = _i = 0, _len = operation.length; _i < _len; index = ++_i) {
      argument = operation[index];
      if (index === 0) {
        if (offset) {
          continue;
        }
        if (continuation && !operation.noop) {
          argument = continuation;
        }
      } else if (skip === index) {
        offset += 1;
        continue;
      } else if (from === index) {
        argument = bubbled;
      } else if (argument instanceof Array) {
        argument.parent || (argument.parent = operation);
        value = (operation.evaluate || this.evaluate).call(this, argument, args);
        if (argument.group !== operation.group) {
          eager = true;
          if (typeof value === 'string') {
            if (continuation) {
              value = continuation + operation.command + value;
            }
            value = this.memory.watch(value, operation, index);
          }
        }
        argument = value;
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
    path = this.toPath(operation, args, continuation);
    if (operation.group && !continuation) {
      this.promises[path] = operation;
      return path;
    }
    if (!(func = operation.func)) {
      scope = (typeof args[0] === 'object' && args.shift()) || this.engine.queryScope;
      func = scope && scope[operation.method];
    }
    if (!func) {
      throw new Error("Engine broke, couldn't find method: " + operation.method);
    }
    result = func.apply(scope || this, args);
    console.log(this.observer, operation.combinator || operation.name === '$query');
    if (operation.combinator || operation.name === '$query') {
      this.observer.add(scope, operation, continuation);
    }
    if (result && this.isCollection(result)) {
      this.memory.set(path, result, operation.index);
      return;
    } else {
      link = path = continuation;
    }
    if (continuation) {
      if (promised === continuation && !singular) {
        return;
      }
      return this.callback(operation.parent, path, result, operation.index, link);
    }
    return path;
  };

  Processor.prototype.toPath = function(operation, args, promised) {
    var arg, index, path, prefix, subgroup, suffix, _i, _len;
    if (subgroup = operation[1].group) {
      if (subgroup !== operation.group) {
        return promised;
      }
    }
    prefix = operation.prefix || '';
    suffix = operation.suffix || '';
    path = operation.skipped || '';
    for (index = _i = 0, _len = args.length; _i < _len; index = ++_i) {
      arg = args[index];
      if (typeof arg === 'string') {
        if (index === 0) {
          prefix = arg + prefix;
        } else {
          path = arg;
        }
      }
    }
    return prefix + path + suffix;
  };

  Processor.prototype.preprocess = function(operation) {
    var arity, def, func, group, prefix, suffix;
    operation.name = operation[0];
    operation.offset = 0;
    def = this[operation[0]];
    if (operation.parent && typeof operation.index !== 'number') {
      operation.index = operation.parent.indexOf(operation);
    }
    arity = operation.length === 2 && 1 || 2;
    if (def.lookup) {
      operation.skip = arity;
      operation.skipped = operation[arity];
      operation.name = (def.prefix || '') + operation.skipped;
      if (typeof def.lookup === 'function') {
        def = def.lookup.call(this, operation);
      } else {
        def = this[operation.name];
      }
    }
    if (def === true) {
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
    if (func = def[operation.length - 1 - (!!operation.skipped)]) {
      operation.offset = 1;
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

  Processor.prototype.isCollection = function(object) {
    if (typeof object === 'object' && object.length !== void 0) {
      if (!(typeof object[0] === 'string' && this[object[0]] === true)) {
        return true;
      }
    }
  };

  Processor.prototype.callback = function(operation, path, value, from, singular) {
    var breadcrumb, promise, responsible, val, _i, _len;
    if (!operation) {
      return value;
    }
    switch (typeof value) {
      case "undefined":
        if (responsible = this.promises[path]) {
          promise = [responsible.group, path];
          promise.path = path;
          promise.parent = operation;
          promise.index = from;
          if (value !== void 0) {
            promise.push(value);
          }
          return this.evaluate(promise, void 0, path);
        }
        break;
      case "object":
        if (value && this.isCollection(value)) {
          console.group(path);
          debugger;
          for (_i = 0, _len = value.length; _i < _len; _i++) {
            val = value[_i];
            breadcrumb = path + this.toId(val);
            this.memory.set(breadcrumb, val);
            this.evaluate(operation, void 0, breadcrumb, path, from, val);
          }
          console.groupEnd(path);
        } else {
          return this.evaluate(operation, void 0, singular || this.toId(value, path), path, from, value, singular);
        }
    }
    return path;
  };

  return Processor;

})();

module.exports = Processor;
