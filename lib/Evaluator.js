var Evaluator, Registry,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Registry = require('./Registry.js');

Evaluator = (function(_super) {
  __extends(Evaluator, _super);

  function Evaluator() {
    this.values = {};
    Evaluator.__super__.constructor.call(this);
  }

  Evaluator.prototype.evaluate = function(op, i, context, contd) {
    var absolute, arg, args, def, eager, evaluate, func, group, method, promise, result, scope, value, _i, _len;
    method = op[0];
    func = def = this[method];
    console.log(op, i, method);
    if (method === '$combinator') {
      debugger;
    }
    if (def) {
      if (typeof def === 'function') {
        op.shift();
        def = def.call(this, context, op[0]);
      }
      func = this[def.method];
      evaluate = def.evaluate;
      group = def.group;
    }
    args = [];
    eager = false;
    for (i = _i = 0, _len = op.length; _i < _len; i = ++_i) {
      arg = op[i];
      if (arg instanceof Array) {
        arg.parent = op;
        args[i] = value = (evaluate || this.evaluate).call(this, arg, i, op, contd);
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
        console.info('@' + op[0], 'Resolve promise:', eager);
        this.subscribe(eager, context);
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
            func = def.valueOf;
          }
      }
    }
    if (group && !eager) {
      promise = this.toPath(def, args[0], args[1]);
      this.register(promise, op);
      console.log('promising', promise, op);
      return promise;
    }
    if (!func) {
      scope = args.shift();
      if (typeof scope === 'object') {
        func = scope && scope[method];
      }
    }
    if (func) {
      result = func.apply(scope || this, args);
    } else if (result === void 0) {
      throw new Error("Engine Commands broke, couldn't find method: " + method);
    }
    absolute = this.toPath(result, method);
    this.operations[absolute] = context;
    return absolute;
  };

  Evaluator.prototype['toPath'] = function(command, method, path) {
    var absolute, relative;
    if (absolute = command.selector) {
      return absolute;
    }
    relative = command.prefix;
    if (method) {
      relative += method;
    }
    if (command.suffix) {
      relative += command.suffix;
    }
    return (path || command.path || '') + relative;
  };

  Evaluator.prototype.continuate = function(arg, i, context) {
    return evaluate(context, i, context.parent);
    return 123;
  };

  return Evaluator;

})(Registry);

module.exports = Evaluator;
