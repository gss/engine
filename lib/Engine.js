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

  Engine.prototype.Methods = Native.prototype.mixin(new Native, require('./methods/Conventions'), require('./methods/Algebra'), require('./methods/Variables'));

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
    this.strategy = (typeof window !== "undefined" && window !== null) && 'document' || 'linear';
    return this;
  }

  Engine.prototype.events = {
    message: function(e) {
      return this.provide(e.data);
    },
    error: function(e) {
      throw new Error("" + e.message + " (" + e.filename + ":" + e.lineno + ")");
    },
    destroy: function(e) {
      return Engine[this.scope._gss_id] = void 0;
    }
  };

  Engine.prototype.solve = function() {
    var arg, args, i, index, name, old, problematic, provided, reason, solution, source, workflow, _i, _len;
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
    if (typeof args[0] === 'function') {
      solution = args.shift().apply(this, args);
    } else {
      this.providing = null;
      if (!(solution = Domain.prototype.solve.apply(this, args))) {
        while (provided = this.providing) {
          i = 0;
          this.providing = null;
          if (provided.index == null) {
            provided.index = args[0].index;
          }
          if (provided.parent == null) {
            provided.parent = args[0].parent;
          }
          solution = this.Workflow(provided);
        }
      }
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

  Engine.prototype.resolve = function(domain, problems, index) {
    var problem, result, _i, _len;
    for (index = _i = 0, _len = problems.length; _i < _len; index = ++_i) {
      problem = problems[index];
      if (problem instanceof Array && problem.length === 1 && problem[0] instanceof Array) {
        problem = problems[index] = problem[0];
      }
    }
    if (problems instanceof Array && problems.length === 1 && problems[0] instanceof Array) {
      problems = problem;
    }
    this.console.start(problems, domain.displayName);
    this.providing = null;
    result = domain.solve(problems) || this.providing || void 0;
    this.providing = void 0;
    this.console.end();
    if ((result != null ? result.length : void 0) === 1) {
      result = result[0];
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
    var _base;
    return (_base = (Engine.workers || (Engine.workers = {})))[url] || (_base[url] = new Worker(url));
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
    return this.Domain.compile(this.Domains, this);
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
    return postMessage((self.engine || (self.engine = Engine())).solve(e.data));
  });
}

module.exports = this.GSS = Engine;
