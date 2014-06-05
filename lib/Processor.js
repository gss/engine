var Memory, Processor;

Memory = require('./Memory.js');

Processor = (function() {
  function Processor() {
    this.memory = new Memory;
    this.memory.object = this;
    this.promises = {};
  }

  Processor.prototype.evaluate = function(op, index, context, contd, promised, from, bubbled) {
    var arg, args, binary, command, def, eager, evaluate, forked, func, getter, group, i, link, method, path, promise, result, scope, value, _i, _len;
    if (context === void 0) {
      if (context = op.context) {
        if (index === void 0) {
          index = context.indexOf(op);
        }
      }
    }
    command = method = op[0];
    func = def = this[method];
    if (def) {
      if (typeof def === 'function') {
        op.shift();
        def = def.call(this, op, op[0]);
      }
      group = def.group;
      if (contd && group && from === void 0) {
        command = '';
        def = this[group];
        if (promised) {
          op = [op[0], group, promised];
        } else {
          [group, op[1]];
        }
      }
      method = def.method;
      func = this[method];
      evaluate = def.evaluate;
    }
    args = [];
    eager = false;
    for (i = _i = 0, _len = op.length; _i < _len; i = ++_i) {
      arg = op[i];
      if (from === i) {
        args[i] = value = contd;
        forked = true;
      } else if (arg instanceof Array) {
        arg.context = op;
        args[i] = value = (evaluate || this.evaluate).call(this, arg, i, op);
      } else {
        args[i] = arg;
        continue;
      }
      switch (typeof value) {
        case "string":
          if (!arg.context || from === i || this[arg[0]].group !== group) {
            if (value === promised || forked) {
              args[i] = bubbled != null ? bubbled : this.memory[contd];
            } else {
              eager = value;
            }
          }
          break;
        case "undefined":
          return;
      }
      if (eager) {
        promise = contd ? contd + command + eager : eager;
        this.memory.watch(promise, op);
        return;
      }
    }
    if (!func) {
      if (!context) {
        return this["return"](args);
      }
      args.shift();
      switch (typeof def) {
        case "boolean":
          return args;
        case "number":
        case "string":
          return def;
        case "object":
          if (def.match && args.length > (command === '' && 2 || 1)) {
            getter = func = def.match;
            binary = true;
          } else if (def.valueOf !== Object.valueOf) {
            getter = func = def.valueOf;
          }
      }
    }
    if (command === " ") {
      debugger;
    }
    if (context && group && !eager && !contd) {
      if (contd) {
        path = this.toPath(def, contd);
      } else {
        path = this.toPath(def, args[1], args[0], op);
        this.promise(path, op);
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
      throw new Error("Engine Commands broke, couldn't find method: " + method);
    }
    if (result && (result.length === void 0 || (typeof result[0] === 'string' && this[result[0]] === true))) {
      link = path = contd;
    } else {
      path = this.toPath(result, contd, command, op);
      if (!binary) {
        this.memory.set(path, result);
      }
    }
    if (contd && result !== void 0) {
      if (context) {
        this.callback(context, path, result, index, link);
      } else {
        return this["return"](result);
      }
    }
    return path;
  };

  Processor.prototype['toPath'] = function(command, path, method, op, def) {
    var absolute, relative, second, swap;
    if (op && !def) {
      second = op[2];
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
          if (def) {
            relative = this.toPath(def, op[1]);
          } else {
            relative = (method || '') + '$' + GSS.setupId(command);
          }
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

  Processor.prototype.promise = function(key, op) {
    return this.promises[key] = op;
  };

  Processor.prototype.callback = function(op, key, value, from, singular) {
    var breadcrumb, promise, result, val, _i, _len;
    if (value === void 0) {
      if (promise = this.promises[key]) {
        return this.evaluate(promise, promise.context.indexOf(promise), promise.context, key, key);
      } else {
        return;
      }
    }
    if (typeof value === 'object' && value && typeof value.length === 'number' && this[value[0]] !== true) {
      console.groupCollapsed(key);
      for (_i = 0, _len = value.length; _i < _len; _i++) {
        val = value[_i];
        breadcrumb = this.toPath(val, key);
        this.memory.set(breadcrumb, val);
        this.evaluate(op, void 0, void 0, breadcrumb, key, from);
        result = true;
      }
      console.groupEnd(key);
      return result;
    } else {
      return this.evaluate(op, void 0, void 0, singular || this.toPath(value, key), key, from, value);
    }
  };

  return Processor;

})();

module.exports = Processor;
