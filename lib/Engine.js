/* Base class: Engine

Engine is a base class for scripting environments.
It initializes and orchestrates all moving parts.

It includes interpreter that operates in defined constraint domains.
Each domain has its own command set, that extends engine defaults.
*/

var Domain, Engine, Events, Native,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Native = require('./methods/Native');

Events = require('./concepts/Events');

Domain = require('./concepts/Domain');

Domain.Events || (Domain.Events = Native.prototype.mixin(Domain, Events));

Engine = (function(_super) {
  __extends(Engine, _super);

  Engine.prototype.Identity = require('./modules/Identity');

  Engine.prototype.Expressions = require('./modules/Expressions');

  Engine.prototype.Method = require('./concepts/Method');

  Engine.prototype.Property = require('./concepts/Property');

  Engine.prototype.Console = require('./concepts/Console');

  Engine.prototype.Workflow = require('./concepts/Workflow');

  Engine.prototype.Properties = require('./properties/Axioms');

  Engine.prototype.Methods = Native.prototype.mixin(new Native, require('./methods/Conventions'));

  Engine.prototype.Domains = {
    Document: require('./domains/Document'),
    Intrinsic: require('./domains/Intrinsic'),
    Numeric: require('./domains/Numeric'),
    Linear: require('./domains/Linear'),
    Finite: require('./domains/Finite')
  };

  function Engine(scope, url) {
    var argument, assumed, engine, id, index, _i, _len;
    for (index = _i = 0, _len = arguments.length; _i < _len; index = ++_i) {
      argument = arguments[index];
      if (!argument) {
        continue;
      }
      switch (typeof argument) {
        case 'object':
          if (argument.nodeType) {
            if (this.Expressions) {
              Engine[Engine.identity.provide(scope)] = this;
              this.scope = scope;
              this.all = scope.getElementsByTagName('*');
            } else {
              while (scope) {
                if (id = Engine.identity.solve(scope)) {
                  if (engine = Engine[id]) {
                    return engine;
                  }
                }
                if (!scope.parentNode) {
                  break;
                }
                scope = scope.parentNode;
              }
            }
          } else {
            assumed = argument;
          }
          break;
        case 'string':
        case 'boolean':
          url = argument;
      }
    }
    if (!this.Expressions) {
      return new Engine(scope, url);
    }
    Engine.__super__.constructor.call(this, this, url);
    this.domain = this;
    this.properties = new this.Properties(this);
    this.methods = new this.Methods(this);
    this.expressions = new this.Expressions(this);
    this.precompile();
    this.assumed = new this.Numeric(assumed);
    this.assumed.displayName = 'Assumed';
    this.assumed.setup();
    if (typeof window === "undefined" || window === null) {
      this.strategy = 'substitute';
    } else {
      this.strategy = 'document';
    }
    return this;
  }

  Engine.prototype.events = {
    message: function(e) {
      var property, value, values, _base, _ref;
      values = (_base = e.target).values || (_base.values = {});
      _ref = e.data;
      for (property in _ref) {
        value = _ref[property];
        values[property] = value;
      }
      return this.provide(e.data);
    },
    error: function(e) {
      throw new Error("" + e.message + " (" + e.filename + ":" + e.lineno + ")");
    },
    destroy: function(e) {
      return Engine[this.scope._gss_id] = void 0;
    }
  };

  Engine.prototype.substitute = function(expressions, result, parent, index) {
    var exp, expression, i, path, start, _i;
    if (result === void 0) {
      start = true;
      result = null;
    }
    for (i = _i = expressions.length - 1; _i >= 0; i = _i += -1) {
      expression = expressions[i];
      if (expression != null ? expression.push : void 0) {
        result = this.substitute(expression, result, expressions, i);
      }
    }
    if (expressions[0] === 'value') {
      if (expressions[4]) {
        exp = parent[index] = expressions[3].split(',');
        path = this.getPath(exp[1], exp[2]);
      } else if (!expressions[3]) {
        path = expressions[2];
        parent.splice(index, 1);
      }
      if (path && this.assumed[path] !== expressions[1]) {
        (result || (result = {}))[path] = expressions[1];
      }
    }
    if (!start) {
      if (!expressions.length) {
        parent.splice(index, 1);
      }
      return result;
    }
    if (result) {
      this.assumed.merge(result);
    }
    this.inputs = result;
    console.log('inputs', result);
    if (expressions.length) {
      return this.provide(expressions);
    }
  };

  Engine.prototype.solve = function() {
    var arg, args, index, name, old, problematic, provided, providing, reason, solution, source, workflow, _i, _len, _ref;
    if (typeof arguments[0] === 'string') {
      if (typeof arguments[1] === 'string') {
        source = arguments[0];
        reason = arguments[1];
        index = 2;
      } else {
        reason = arguments[0];
        index = 1;
      }
    }
    args = Array.prototype.slice.call(arguments, index || 0);
    if (!this.running) {
      this.compile(true);
    }
    problematic = void 0;
    for (index = _i = 0, _len = args.length; _i < _len; index = ++_i) {
      arg = args[index];
      if (arg && typeof arg !== 'string') {
        if (problematic) {
          if (typeof arg === 'function') {
            this.then(arg);
            args.splice(index, 1);
            break;
          }
        } else {
          problematic = arg;
        }
      }
    }
    if (typeof args[0] === 'object') {
      if (name = source || this.displayName) {
        this.console.start(reason || args[0], name);
      }
    }
    if (!(old = this.workflow)) {
      this.engine.workflow = new this.Workflow;
    }
    if (this.providing === void 0) {
      this.providing = null;
      providing = true;
    }
    if (typeof args[0] === 'function') {
      solution = args.shift().apply(this, args);
    } else {
      solution = Domain.prototype.solve.apply(this, args);
    }
    if ((solution == null) && providing) {
      while (provided = this.providing) {
        this.providing = null;
        if ((_ref = args[0]) != null ? _ref.index : void 0) {
          if (provided.index == null) {
            provided.index = args[0].index;
          }
          if (provided.parent == null) {
            provided.parent = args[0].parent;
          }
        }
        solution = this.Workflow(provided);
      }
    }
    if (providing) {
      this.providing = void 0;
    }
    if (name) {
      this.console.end(reason);
    }
    workflow = this.workflow;
    if (workflow.domains.length) {
      if (old) {
        if (old !== workflow) {
          old.merge(workflow);
        }
      } else {
        this.workflown = workflow;
        solution = workflow.each(this.resolve, this);
      }
    }
    this.engine.workflow = old;
    if (!solution || this.engine !== this) {
      return solution;
    }
    if (this.applier && !this.applier.solve(solution)) {
      return;
    }
    return this.solved(solution);
  };

  Engine.prototype.solved = function(solution) {
    if (typeof solution !== 'object') {
      return solution;
    }
    this.console.info('Solution\t   ', solution);
    this.triggerEvent('solve', solution);
    if (this.scope) {
      this.dispatchEvent(this.scope, 'solve', solution);
    }
    return solution;
  };

  Engine.prototype.provide = function(solution) {
    var _base;
    if (solution.operation) {
      return this.engine.workflow.provide(solution);
    }
    if (!solution.push) {
      if (this.merge('result', solution)) {
        return this.solved(solution);
      }
    }
    if (this.providing !== void 0) {
      if (!this.hasOwnProperty('providing')) {
        (_base = this.engine).providing || (_base.providing = []);
      }
      (this.providing || (this.providing = [])).push(Array.prototype.slice.call(arguments, 0));
    } else {
      return this.Workflow.apply(this, arguments);
    }
  };

  Engine.prototype.resolve = function(domain, problems, index, workflow) {
    var locals, others, path, problem, remove, removes, result, url, worker, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1;
    if (domain && !domain.solve && domain.postMessage) {
      return domain.postMessage(this.clone(problems));
    }
    for (index = _i = 0, _len = problems.length; _i < _len; index = ++_i) {
      problem = problems[index];
      if (problem instanceof Array && problem.length === 1 && problem[0] instanceof Array) {
        problem = problems[index] = problem[0];
      }
    }
    if (problems instanceof Array && problems.length === 1 && problem instanceof Array) {
      problems = problem;
    }
    if (domain) {
      this.console.start(problems, domain.displayName);
      this.providing = null;
      result = domain.solve(problems) || this.providing || void 0;
      if (this.providing && this.providing !== result) {
        workflow.merge(this.Workflow(this.frame || true, this.providing));
        workflow.optimize();
      }
      this.providing = void 0;
      this.console.end();
      if ((result != null ? result.length : void 0) === 1) {
        result = result[0];
      }
    } else {
      others = [];
      removes = [];
      if (problems[0] === 'remove') {
        removes.push(problems);
      } else {
        for (_j = 0, _len1 = problems.length; _j < _len1; _j++) {
          problem = problems[_j];
          if (problem[0] === 'remove') {
            removes.push(problem);
          } else {
            others.push(problem);
          }
        }
      }
      _ref = this.domains;
      for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
        domain = _ref[_k];
        locals = [];
        for (_l = 0, _len3 = removes.length; _l < _len3; _l++) {
          remove = removes[_l];
          for (index = _m = 0, _len4 = remove.length; _m < _len4; index = ++_m) {
            path = remove[index];
            if (index === 0) {
              continue;
            }
            console.log(domain.paths, path, domain.paths[path]);
            if (domain.paths[path]) {
              locals.push(path);
            }
          }
        }
        if (locals.length) {
          locals.unshift('remove');
          workflow.merge(locals, domain);
        }
        if (others.length) {
          workflow.merge(others, domain);
        }
      }
      _ref1 = this.workers;
      for (url in _ref1) {
        worker = _ref1[url];
        workflow.merge(problems, worker);
      }
    }
    return result;
  };

  Engine.prototype.useWorker = function(url) {
    var _this = this;
    if (!(typeof url === 'string' && self.onmessage !== void 0)) {
      return;
    }
    this.worker = new this.getWorker(url);
    this.worker.addEventListener('message', this.eventHandler);
    this.worker.addEventListener('error', this.eventHandler);
    return this.solve = function(commands) {
      _this.worker.postMessage(_this.clone(commands));
    };
  };

  Engine.prototype.getWorker = function(url) {
    var _base, _base1;
    return (_base = ((_base1 = Engine.prototype).workers || (_base1.workers = {})))[url] || (_base[url] = new Worker(url));
  };

  Engine.prototype.precompile = function() {
    var method, property, _base, _base1, _ref;
    if (this.constructor.prototype.running === void 0) {
      _ref = this.Methods.prototype;
      for (property in _ref) {
        method = _ref[property];
        (_base = this.constructor.prototype)[property] || (_base[property] = (_base1 = this.constructor)[property] || (_base1[property] = Engine.prototype.Method(method, true, property)));
      }
      this.constructor.prototype.compile();
    }
    this.Domain.compile(this.Domains, this);
    return this.Workflow = Engine.prototype.Workflow.compile(this);
  };

  Engine.prototype.compile = function(state) {
    var methods, properties;
    methods = this.methods || this.Methods.prototype;
    properties = this.properties || this.Properties.prototype;
    this.Method.compile(methods, this);
    this.Property.compile(properties, this);
    if (this.running) {
      this.Domain.compile(this.Domains, this);
    }
    this.running = state != null ? state : null;
    return this.triggerEvent('compile', this);
  };

  return Engine;

})(Domain.Events);

Engine.identity = Engine.prototype.identity = new Engine.prototype.Identity;

Engine.console = Engine.prototype.console = new Engine.prototype.Console;

Engine.Engine = Engine;

Engine.Domain = Engine.prototype.Domain = Domain;

Engine.mixin = Engine.prototype.mixin = Native.prototype.mixin;

Engine.time = Engine.prototype.time = Native.prototype.time;

Engine.clone = Engine.prototype.clone = Native.prototype.clone;

if (!self.window && self.onmessage !== void 0) {
  self.addEventListener('message', function(e) {
    var assumed, engine, property, solution, value, _ref;
    engine = Engine.messenger || (Engine.messenger = Engine());
    assumed = engine.assumed.toObject();
    solution = engine.solve(e.data);
    _ref = engine.inputs;
    for (property in _ref) {
      value = _ref[property];
      if (solution[property] == null) {
        solution[property] = value;
      }
    }
    console.error(engine.domains.map(function(d) {
      var _ref1, _ref2;
      return [(_ref1 = d.constraints) != null ? _ref1.length : void 0, (_ref2 = d.substituted) != null ? _ref2.length : void 0];
    }));
    return postMessage(solution);
  });
}

module.exports = this.GSS = Engine;
