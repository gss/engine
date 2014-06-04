var Memory, Processor;

Memory = require('./Memory.js');

Processor = (function() {
  function Processor() {
    this.memory = new Memory;
    this.memory.object = this;
    this.promises = {};
  }

  Processor.prototype.evaluate = function(op, i, context, contd) {
    var arg, args, command, def, eager, evaluate, func, getter, group, method, path, result, scope, value, _i, _len;
    method = op[0];
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
        method = def.method;
      }
      func = this[def.method];
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
            eager = value;
          }
          break;
        case "undefined":
          return;
      }
      if (eager) {
        console.info('@' + op[0], 'Got promise:', [eager, method]);
        this.memory.watch(eager, op);
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
      debugger;
      return path;
    }
    if (!func) {
      scope = args.shift();
      if (typeof scope === 'object') {
        func = scope && scope[method];
      } else if (contd) {
        scope = document;
        func = scope[method];
      }
    }
    if (func) {
      result = func.apply(scope || this, args);
    } else {
      throw new Error("Engine Commands broke, couldn't find method: " + method);
    }
    path = this.toPath(result, command || method);
    console.warn('publish', path, result);
    this.memory.set(path, result);
    return path;
  };

  Processor.prototype['toPath'] = function(command, method, path) {
    var absolute, relative;
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
    if (typeof value === 'object' && value && value.length) {
      _results = [];
      for (_i = 0, _len = value.length; _i < _len; _i++) {
        val = value[_i];
        _results.push(this.evaluate(op, i, context, key, value));
      }
      return _results;
    } else {
      return this.evaluate(op, i, context, key, value);
    }
  };

  return Processor;

})();

module.exports = Processor;
