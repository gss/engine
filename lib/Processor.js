var Memory, Processor;

Memory = require('./Memory.js');

Processor = (function() {
  function Processor() {
    this.memory = new Memory;
    this.memory.object = this;
    this.promises = {};
  }

  Processor.prototype.evaluate = function(op, i, context, contd, promised) {
    var arg, args, command, def, eager, evaluate, func, getter, group, method, path, promise, result, scope, value, _i, _len;
    command = method = op[0];
    func = def = this[method];
    if (def) {
      if (typeof def === 'function') {
        op.shift();
        def = def.call(this, op, op[0]);
      }
      group = def.group;
      if (contd && group) {
        command = method;
        def = this[group];
      }
      method = def.method;
      func = this[method];
      evaluate = def.evaluate;
    }
    args = [];
    eager = false;
    for (i = _i = 0, _len = op.length; _i < _len; i = ++_i) {
      arg = op[i];
      if (arg instanceof Array) {
        arg.context = op;
        args[i] = value = (evaluate || this.evaluate).call(this, arg, i, op);
      } else {
        args[i] = arg;
        continue;
      }
      switch (typeof value) {
        case "object":
        case "number":
          eager = value;
          break;
        case "string":
          if (this[arg[0]].group !== group) {
            if (value === promised) {
              args[i] = this.memory[promised];
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
        console.info('@[' + command, '] got promise: ', [eager, promise]);
        this.memory.watch(promise, op);
        return;
      }
    }
    if (!func) {
      args.shift();
      switch (typeof def) {
        case "boolean":
          return args;
        case "number":
        case "string":
          return def;
        case "object":
          if (def.valueOf !== Object.valueOf) {
            getter = func = def.valueOf;
          }
      }
    }
    if (group && !eager && !contd) {
      path = this.toPath(def, args[0], args[1]);
      this.promise(path, op);
      console.log('promising', path, op, args.slice());
      return path;
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
      result = func.apply(scope || this, args);
    } else {
      throw new Error("Engine Commands broke, couldn't find method: " + method);
    }
    path = this.toPath(result, command);
    console.warn('publish', contd, path, result);
    this.memory.set(contd || path, result);
    return path;
  };

  Processor.prototype['toPath'] = function(command, method, path) {
    var absolute, relative;
    if (command.nodeType) {
      relative = '$' + (method || '') + GSS.setupId(command);
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
    return (path || command.path || '') + relative;
  };

  Processor.prototype.promise = function(key, op) {
    return this.promises[key] = op;
  };

  Processor.prototype.callback = function(op, key, value) {
    var context, i, promise, val, _i, _len, _results;
    if (value === void 0) {
      if (promise = this.promises[key]) {
        return this.evaluate(promise, promise.context.indexOf(promise), promise.context, key);
      } else {
        return;
      }
    }
    context = op.context;
    i = context.indexOf(op);
    if (typeof value === 'object' && value && typeof value.length === 'number') {
      _results = [];
      for (_i = 0, _len = value.length; _i < _len; _i++) {
        val = value[_i];
        _results.push(this.evaluate(op, i, context, this.toPath(val, null, key), key));
      }
      return _results;
    } else {
      return this.evaluate(op, i, context, this.toPath(value, null, key), key);
    }
  };

  return Processor;

})();

module.exports = Processor;
