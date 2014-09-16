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

  Engine.prototype.Update = require('./concepts/Update');

  Engine.prototype.Properties = require('./properties/Axioms');

  Engine.prototype.Methods = Native.prototype.mixin(new Native, require('./methods/Conventions'));

  Engine.prototype.Domains = {
    Abstract: require('./domains/Abstract'),
    Document: require('./domains/Document'),
    Intrinsic: require('./domains/Intrinsic'),
    Numeric: require('./domains/Numeric'),
    Linear: require('./domains/Linear'),
    Finite: require('./domains/Finite'),
    Boolean: require('./domains/Boolean')
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
            } else {
              while (scope) {
                if (id = Engine.identity.find(scope)) {
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
    this.solved = new this.Boolean;
    this.solved.displayName = 'Solved';
    this.solved.eager = true;
    this.solved.setup();
    this.values = this.solved.values;
    if (typeof window === "undefined" || window === null) {
      this.strategy = 'substitute';
    } else if (this.scope) {
      this.strategy = 'document';
    } else {
      this.strategy = 'abstract';
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
      if (this.updating) {
        if (this.updating.busy.length) {
          console.error(e.target.url, 888, this.updating.busy.indexOf(e.target.url), this.updating.busy.length);
          this.updating.busy.splice(this.updating.busy.indexOf(e.target.url), 1);
          if (!this.updating.busy.length) {
            return this.updating.each(this.resolve, this, e.data) || this.onSolve();
          } else {
            return this.updating.apply(e.data);
          }
        }
      }
      return this.provide(e.data);
    },
    error: function(e) {
      throw new Error("" + e.message + " (" + e.filename + ":" + e.lineno + ")");
    },
    destroy: function(e) {
      if (this.scope) {
        Engine[this.scope._gss_id] = void 0;
      }
      if (this.worker) {
        this.worker.removeEventListener('message', this.eventHandler);
        return this.worker.removeEventListener('error', this.eventHandler);
      }
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
        if (parent) {
          parent.splice(index, 1);
        } else {
          return [];
        }
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
    if (expressions.length) {
      return this.provide(expressions);
    }
  };

  Engine.prototype.solve = function() {
    var arg, args, index, name, old, onlyRemoving, problematic, provided, providing, reason, restyled, solution, source, workflow, _i, _len, _ref, _ref1, _ref2, _ref3, _ref4;
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
    if (!(old = this.updating)) {
      this.engine.updating = new this.update;
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
    if ((_ref = this.queries) != null) {
      _ref.onBeforeSolve();
    }
    if ((_ref1 = this.pairs) != null) {
      _ref1.onBeforeSolve();
    }
    if (providing) {
      while (provided = this.providing) {
        this.providing = null;
        if ((_ref2 = args[0]) != null ? _ref2.index : void 0) {
          if (provided.index == null) {
            provided.index = args[0].index;
          }
          if (provided.parent == null) {
            provided.parent = args[0].parent;
          }
        }
        this.update(provided);
      }
      this.providing = void 0;
    }
    if (name) {
      this.console.end(reason);
    }
    workflow = this.updating;
    if (workflow.domains.length) {
      if (old) {
        if (old !== workflow) {
          old.push(workflow);
        }
      }
      if (!old || !((_ref3 = workflow.busy) != null ? _ref3.length : void 0)) {
        workflow.each(this.resolve, this);
      }
      if ((_ref4 = workflow.busy) != null ? _ref4.length : void 0) {
        return workflow;
      }
    }
    onlyRemoving = workflow.problems.length === 1 && workflow.domains[0] === null;
    restyled = onlyRemoving || (this.restyled && !old && !workflow.problems.length);
    if (this.engine === this && (!workflow.problems[workflow.index + 1] || restyled)) {
      return this.onSolve(null, restyled);
    }
  };

  Engine.prototype.onSolve = function(update, restyled) {
    var effects, scope, solution, _ref, _ref1, _ref2, _ref3, _ref4;
    if (solution = update || this.updating.solution) {
      if ((_ref = this.applier) != null) {
        _ref.solve(solution);
      }
    } else if (!this.updating.reflown && !restyled) {
      return;
    }
    if (this.intrinsic) {
      scope = this.updating.reflown || this.scope;
      this.updating.reflown = void 0;
      if ((_ref1 = this.intrinsic) != null) {
        _ref1.each(scope, this.intrinsic.update);
      }
    }
    if ((_ref2 = this.queries) != null) {
      _ref2.onSolve();
    }
    this.solved.merge(solution);
    if ((_ref3 = this.pairs) != null) {
      _ref3.onBeforeSolve();
    }
    this.updating.queries = void 0;
    effects = {};
    effects = this.updating.each(this.resolve, this, effects);
    if ((_ref4 = this.updating.busy) != null ? _ref4.length : void 0) {
      return effects;
    }
    if (effects && Object.keys(effects).length) {
      return this.onSolve(effects);
    }
    if ((!solution || this.updating.problems[this.updating.index + 1]) && (this.updating.problems.length !== 1 || this.updating.domains[0] !== null) && !this.engine.restyled) {
      return;
    }
    this.updated = this.updating;
    this.updating = void 0;
    this.console.info('Solution\t   ', this.updated, solution, this.solved.values);
    this.triggerEvent('solve', this.updated.solution, this.updated);
    if (this.scope) {
      this.dispatchEvent(this.scope, 'solve', this.updated.solution, this.updated);
    }
    this.triggerEvent('solved', this.updated.solution, this.updated);
    if (this.scope) {
      this.dispatchEvent(this.scope, 'solved', this.updated.solution, this.updated);
    }
    return this.updated.solution;
  };

  Engine.prototype.provide = function(solution) {
    var _base;
    console.log('provide', solution);
    if (solution.operation) {
      return this.engine.updating.provide(solution);
    }
    if (!solution.push) {
      return this.updating.each(this.resolve, this, solution) || this.onSolve();
    }
    if (this.providing !== void 0) {
      if (!this.hasOwnProperty('providing')) {
        (_base = this.engine).providing || (_base.providing = []);
      }
      (this.providing || (this.providing = [])).push(Array.prototype.slice.call(arguments, 0));
    } else {
      return this.update.apply(this, arguments);
    }
  };

  Engine.prototype.resolve = function(domain, problems, index, workflow) {
    var finish, imports, locals, other, others, path, problem, property, providing, remove, removes, result, url, value, worker, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref, _ref1, _ref2, _ref3, _ref4;
    if (domain && !domain.solve && domain.postMessage) {
      domain.postMessage(this.clone(problems));
      (workflow.busy || (workflow.busy = [])).push(domain.url);
      return;
    }
    if ((index = (_ref = workflow.imports) != null ? _ref.indexOf(domain) : void 0) > -1) {
      finish = index;
      imports = [];
      while (property = workflow.imports[++finish]) {
        if (typeof property !== 'string') {
          break;
        }
        if (imports.indexOf(property) === -1) {
          imports.push(property);
        }
      }
      workflow.imports.splice(index, finish - index + 1);
      for (_i = 0, _len = imports.length; _i < _len; _i++) {
        property = imports[_i];
        if (this.intrinsic.values.hasOwnProperty(property)) {
          value = this.intrinsic.values[property];
        } else if ((_ref1 = workflow.solution) != null ? _ref1.hasOwnProperty(property) : void 0) {
          value = workflow.solution[property];
        } else {
          value = (_ref2 = this.solution) != null ? _ref2[property] : void 0;
        }
        if (value != null) {
          problems.push(['value', value, property]);
        }
      }
    }
    for (index = _j = 0, _len1 = problems.length; _j < _len1; index = ++_j) {
      problem = problems[index];
      if (problem instanceof Array && problem.length === 1 && problem[0] instanceof Array) {
        problem = problems[index] = problem[0];
      }
    }
    if (problems instanceof Array && problems.length === 1 && problem instanceof Array) {
      problems = problem;
    }
    if (domain) {
      if (this.providing === void 0) {
        this.providing = null;
        providing = true;
      }
      this.console.start(problems, domain.displayName);
      result = domain.solve(problems) || void 0;
      if (result && result.postMessage) {
        (workflow.busy || (workflow.busy = [])).push(result.url);
      } else {
        if (providing && this.providing) {
          workflow.push(this.update(this.frame || true, this.providing));
          workflow.optimize();
        }
        if ((result != null ? result.length : void 0) === 1) {
          result = result[0];
        }
      }
      if (providing) {
        this.providing = void 0;
      }
      this.console.end();
    } else {
      others = [];
      removes = [];
      debugger;
      if (problems[0] === 'remove') {
        removes.push(problems);
        if (problems.length > 2) {
          debugger;
        }
      } else {
        for (_k = 0, _len2 = problems.length; _k < _len2; _k++) {
          problem = problems[_k];
          if (problem[0] === 'remove') {
            removes.push(problem);
          } else {
            others.push(problem);
          }
        }
      }
      _ref3 = this.domains;
      for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
        other = _ref3[_l];
        locals = [];
        for (_m = 0, _len4 = removes.length; _m < _len4; _m++) {
          remove = removes[_m];
          for (index = _n = 0, _len5 = remove.length; _n < _len5; index = ++_n) {
            path = remove[index];
            if (index === 0) {
              continue;
            }
            if (other.paths[path]) {
              locals.push(path);
            } else if (other.observers[path]) {
              other.remove(path);
            }
          }
        }
        if (locals.length) {
          locals.unshift('remove');
          workflow.push([locals], other, true);
        }
        if (others.length) {
          workflow.push(others, other);
        }
      }
      if (typeof problems[0] === 'string') {
        problems = [problems];
      }
      _ref4 = this.workers;
      for (url in _ref4) {
        worker = _ref4[url];
        workflow.push(problems, worker);
      }
    }
    return result;
  };

  Engine.prototype.useWorker = function(url) {
    var _this = this;
    if (!(typeof url === 'string' && self.onmessage !== void 0)) {
      return;
    }
    this.worker = this.getWorker(url);
    this.worker.url = url;
    this.worker.addEventListener('message', this.eventHandler);
    this.worker.addEventListener('error', this.eventHandler);
    return this.solve = function(commands) {
      _this.worker.postMessage(_this.clone(commands));
      return _this.worker;
    };
  };

  Engine.prototype.getWorker = function(url) {
    var _base, _base1, _base2;
    return (_base = ((_base1 = this.engine).workers || (_base1.workers = {})))[url] || (_base[url] = (_base2 = (Engine.workers || (Engine.workers = {})))[url] || (_base2[url] = new Worker(url)));
  };

  Engine.prototype.precompile = function() {
    var domain, method, name, property, _base, _base1, _base2, _base3, _ref, _ref1, _ref2, _ref3;
    if (this.constructor.prototype.running === void 0) {
      _ref = this.Methods.prototype;
      for (property in _ref) {
        method = _ref[property];
        (_base = this.constructor.prototype)[property] || (_base[property] = (_base1 = this.constructor)[property] || (_base1[property] = Engine.prototype.Method(method, property)));
      }
      this.constructor.prototype.compile();
    }
    this.Domain.compile(this.Domains, this);
    _ref1 = this.Domains;
    for (name in _ref1) {
      domain = _ref1[name];
      if (domain.prototype.helps) {
        _ref2 = domain.prototype.Methods.prototype;
        for (property in _ref2) {
          method = _ref2[property];
          (_base2 = this.constructor.prototype)[property] || (_base2[property] = (_base3 = this.constructor)[property] || (_base3[property] = Engine.prototype.Method(method, property, name.toLowerCase())));
        }
      }
    }
    this.update = Engine.prototype.Update.compile(this);
    return (_ref3 = this.mutations) != null ? _ref3.connect() : void 0;
  };

  Engine.prototype.compile = function(state) {
    var methods, properties;
    methods = this.methods || this.Methods.prototype;
    properties = this.properties || this.Properties.prototype;
    this.Method.compile(methods, this);
    this.Property.compile(properties, this);
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
    solution = engine.solve(e.data) || {};
    _ref = engine.inputs;
    for (property in _ref) {
      value = _ref[property];
      if ((value != null) || (solution[property] == null)) {
        solution[property] = value;
      }
    }
    console.error(engine.domains.map(function(e) {
      return e.constraints.length;
    }));
    return postMessage(solution);
  });
}

module.exports = this.GSS = Engine;
