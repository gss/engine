var Memory, Processor;

Memory = require('./Memory.js');

Processor = (function() {
  function Processor() {
    this.memory = new Memory;
    this.memory.object = this;
    this.promises = {};
  }

  Processor.prototype.evaluate = function(operation, index, context, contd, promised, from, bubbled, singular) {
    var arg, args, binary, command, def, evaluate, func, getter, group, i, link, method, path, result, scope, value, _i, _len;
    if (context === void 0) {
      if (context = operation.context) {
        if (index === void 0) {
          index = context.indexOf(operation);
        }
      }
    }
    command = method = operation[0];
    func = def = this[method];
    if (def) {
      if (typeof def === 'function') {
        operation.shift();
        def = def.call(this, operation, operation[0]);
      }
      group = def.group;
      if (contd && group && from === void 0) {
        command = '';
        def = this[group];
        if (promised) {
          operation = [operation[0], group, promised];
        }
      }
      method = def.method;
      func = this[method];
      evaluate = def.evaluate;
    }
    args = [];
    for (i = _i = 0, _len = operation.length; _i < _len; i = ++_i) {
      arg = operation[i];
      if (i === 0 && contd && def !== true) {
        arg = contd;
      } else if (from === i) {
        arg = bubbled;
      } else if (arg instanceof Array) {
        arg.context = operation;
        value = (evaluate || this.evaluate).call(this, arg, i, operation);
        if (typeof value === 'string') {
          if (!arg.context || this[arg[0]].group !== group) {
            if (contd) {
              value = contd + command + value;
            }
            value = this.memory.watch(value, operation);
          }
        }
        arg = value;
      }
      if (arg === void 0) {
        return;
      }
      args[i] = arg;
    }
    if (!func) {
      switch (typeof def) {
        case "boolean":
          if (!context) {
            return this["return"](args);
          }
          return args;
        case "number":
        case "string":
          return def;
        case "object":
          if (def.match && args.length > (command === '' && 3 || 2)) {
            getter = func = def.match;
            binary = true;
          } else if (def.valueOf !== Object.valueOf) {
            getter = func = def.valueOf;
          }
      }
      args.shift();
    }
    if (context && group && !contd) {
      if (contd) {
        path = this.toPath(def, contd);
      } else {
        path = this.toPath(def, args[1], args[0], operation);
        this.promises[path] = operation;
        return path;
      }
    }
    if (!func) {
      scope = args.shift();
      if (typeof scope === 'object') {
        func = scope && scope[method];
      } else if (contd) {
        scope = this.engine.queryScope;
        func = scope[method];
      }
    }
    if (func) {
      console.warn('@' + (command || method), args);
      result = func.apply(scope || this, args);
    } else {
      throw new Error("Engine broke, couldn't find method: " + method);
    }
    console.error(result, result && this.isCollection(result));
    if (result && this.isCollection(result)) {
      path = this.toPath(result, contd, command, operation);
      if (!binary) {
        this.memory.set(path, result, index);
      }
    } else {
      link = path = contd;
    }
    if (contd && result !== void 0) {
      if (promised === contd && !singular) {
        return;
      }
      return this.callback(context, path, result, index, link);
    }
    return path;
  };

  Processor.prototype['toPath'] = function(command, path, method, operation, def) {
    var absolute, relative, second, swap;
    if (operation && !def) {
      second = operation[2];
      if (second && second.push && second[0] === this[second[0]].prefix) {
        swap = path;
        path = method;
        method = swap;
      }
    }
    if (command === void 0) {
      relative = method;
    } else {
      if (command.nodeType) {
        if (command.nodeType === 9) {
          return '#document';
        } else {
          relative = def ? this.toPath(def, operation[1]) : (method || '') + '$' + GSS.setupId(command);
        }
      } else {
        if (absolute = command.selector) {
          return absolute;
        }
        relative = command.prefix || '';
        if (method) {
          relative += method;
        }
        if (command.suffix) {
          relative += command.suffix;
        }
      }
    }
    return (path || command.path || '') + relative;
  };

  Processor.prototype.isCollection = function(object) {
    if (typeof object === 'object' && object.length !== void 0) {
      if (!(typeof object[0] === 'string' && this[object[0]] === true)) {
        return true;
      }
    }
  };

  Processor.prototype.callback = function(operation, path, value, from, singular) {
    var breadcrumb, promise, val, _i, _len;
    if (!operation) {
      return value;
    }
    switch (typeof value) {
      case "undefined":
        if (promise = this.promises[path]) {
          return this.evaluate(promise, void 0, void 0, path, path);
        }
        break;
      case "object":
        if (value && typeof value.length === 'number' && this[value[0]] !== true) {
          console.groupCollapsed(path);
          for (_i = 0, _len = value.length; _i < _len; _i++) {
            val = value[_i];
            breadcrumb = this.toPath(val, path);
            this.memory.set(breadcrumb, val);
            this.evaluate(operation, void 0, void 0, breadcrumb, path, from, val);
          }
          console.groupEnd(path);
        } else {
          return this.evaluate(operation, void 0, void 0, singular || this.toPath(value, path), path, from, value, singular);
        }
    }
    return path;
  };

  return Processor;

})();

module.exports = Processor;
