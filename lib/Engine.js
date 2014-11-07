/* Base class: Engine

Engine is a base class for scripting environments.
It initializes and orchestrates all moving parts.

It includes interpreter that operates in multiple environments called domains.
Each domain has its own command set, that extends engine defaults.
Domains that set constraints only include constraints that refer shared variables
forming multiple unrelated dependency graphs.
*/

var Domain, Engine,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

this.require || (this.require = function(string) {
  var bits;
  if (string === 'cassowary') {
    return c;
  }
  bits = string.replace('', '').split('/');
  return this[bits[bits.length - 1]];
});

this.module || (this.module = {});

Domain = require('./concepts/Domain');

Engine = (function(_super) {
  __extends(Engine, _super);

  Engine.prototype.Command = require('./concepts/Command');

  Engine.prototype.Property = require('./concepts/Property');

  Engine.prototype.Update = require('./concepts/Update');

  Engine.prototype.Operation = require('./concepts/Operation');

  Engine.prototype.Continuation = require('./concepts/Continuation');

  Engine.prototype.Console = require('./utilities/Console');

  Engine.prototype.Inspector = require('./utilities/Inspector');

  Engine.prototype.Exporter = require('./utilities/Exporter');

  Engine.prototype.Properties = require('./properties/Axioms');

  Engine.prototype.Identity = require('./modules/Identity');

  Engine.prototype.Signatures = require('./modules/Signatures');

  Engine.prototype.Domains = {
    Abstract: require('./domains/Abstract'),
    Document: require('./domains/Document'),
    Intrinsic: require('./domains/Intrinsic'),
    Numeric: require('./domains/Numeric'),
    Linear: require('./domains/Linear'),
    Finite: require('./domains/Finite'),
    Boolean: require('./domains/Boolean')
  };

  function Engine() {
    var argument, assumed, engine, id, index, scope, url, _i, _len;
    for (index = _i = 0, _len = arguments.length; _i < _len; index = ++_i) {
      argument = arguments[index];
      if (!argument) {
        continue;
      }
      switch (typeof argument) {
        case 'object':
          if (argument.nodeType) {
            if (this.Command) {
              Engine[Engine.identity["yield"](argument)] = this;
              this.scope = scope = argument;
            } else {
              scope = argument;
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
    if (!this.Command) {
      return new Engine(arguments[0], arguments[1], arguments[2]);
    }
    Engine.__super__.constructor.call(this, this, url);
    this.domains = [];
    this.domain = this;
    this.inspector = new this.Inspector(this);
    this.precompile();
    this.Operation = new this.Operation(this);
    this.Continuation = this.Continuation["new"](this);
    this.assumed = new this.Numeric(assumed);
    this.assumed.displayName = 'Assumed';
    this.assumed.setup();
    this.solved = new this.Boolean;
    this.solved.displayName = 'Solved';
    this.solved.eager = true;
    this.solved.setup();
    this.values = this.solved.values;
    this.variables = {};
    this.bypassers = {};
    this.strategy = typeof window === "undefined" || window === null ? 'substitute' : this.scope ? 'document' : 'abstract';
    return this;
  }

  Engine.prototype.events = {
    message: function(e) {
      var i, property, value, values, _base, _ref;
      values = (_base = e.target).values || (_base.values = {});
      _ref = e.data;
      for (property in _ref) {
        value = _ref[property];
        values[property] = value;
      }
      if (this.updating) {
        if (this.updating.busy.length) {
          this.updating.busy.splice(this.updating.busy.indexOf(e.target.url), 1);
          if ((i = this.updating.solutions.indexOf(e.target)) > -1) {
            this.updating.solutions[i] = e.data;
          }
          if (!this.updating.busy.length) {
            return this.updating.each(this.resolve, this, e.data) || this.onSolve();
          } else {
            return this.updating.apply(e.data);
          }
        }
      }
      return this["yield"](e.data);
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
    if (expressions[0] === 'remove') {
      this.updating.push(expressions, null);
      if (parent) {
        parent.splice(index, 1);
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
      if (path && this.assumed.values[path] !== expressions[1]) {
        if (!(result || (result = {})).hasOwnProperty(path)) {
          result[path] = expressions[1];
        } else if (result[path] == null) {
          delete result[path];
        }
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
    if (this.updating) {
      this.updating.each(this.resolve, this, result);
    }
    if (expressions.length) {
      return this["yield"](expressions);
    }
  };

  Engine.prototype.solve = function() {
    var arg, args, index, name, old, onlyRemoving, problematic, providing, reason, restyled, solution, source, workflow, yieldd, _base, _i, _len, _ref, _ref1, _ref2, _ref3;
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
      if ((_base = this.engine.updating).start == null) {
        _base.start = this.engine.console.time();
      }
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
    if (solution) {
      this.updating.apply(solution);
    }
    if ((_ref = this.queries) != null) {
      _ref.onBeforeSolve();
    }
    if ((_ref1 = this.pairs) != null) {
      _ref1.onBeforeSolve();
    }
    if (providing) {
      while (yieldd = this.providing) {
        this.providing = null;
        this.update(yieldd);
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
      if (!old || !((_ref2 = workflow.busy) != null ? _ref2.length : void 0)) {
        workflow.each(this.resolve, this);
      }
      if ((_ref3 = workflow.busy) != null ? _ref3.length : void 0) {
        return workflow;
      }
    }
    onlyRemoving = workflow.problems.length === 1 && workflow.domains[0] === null;
    restyled = onlyRemoving || (this.restyled && !old && !workflow.problems.length);
    if (this.engine === this && providing && (!workflow.problems[workflow.index + 1] || restyled)) {
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
      if (!this.updating.problems.length) {
        this.updating = void 0;
      }
      return;
    }
    if (this.intrinsic) {
      this.intrinsic.changes = {};
      scope = this.updating.reflown || this.scope;
      this.updating.reflown = void 0;
      if ((_ref1 = this.intrinsic) != null) {
        _ref1.each(scope, this.intrinsic.measure);
      }
      this.updating.apply(this.intrinsic.changes);
      this.intrinsic.changes = void 0;
    }
    this.solved.merge(solution);
    if ((_ref2 = this.pairs) != null) {
      _ref2.onBeforeSolve();
    }
    this.updating.reset();
    if (effects = this.updating.effects) {
      this.updating.effects = void 0;
    } else {
      effects = {};
    }
    effects = this.updating.each(this.resolve, this, effects);
    if ((_ref3 = this.updating.busy) != null ? _ref3.length : void 0) {
      return effects;
    }
    if (effects && Object.keys(effects).length) {
      return this.onSolve(effects);
    }
    if ((!solution || (!solution.push && !Object.keys(solution).length) || this.updating.problems[this.updating.index + 1]) && (this.updating.problems.length !== 1 || this.updating.domains[0] !== null) && !this.engine.restyled) {
      return;
    }
    if (!this.updating.problems.length && ((_ref4 = this.updated) != null ? _ref4.problems.length : void 0) && !this.engine.restyled) {
      this.updating.finish();
      this.restyled = void 0;
      this.updating = void 0;
      return;
    } else {
      this.updated = this.updating;
      this.updating.finish();
      this.updating = void 0;
      this.restyled = void 0;
    }
    this.console.info('Solution\t   ', this.updated, solution, this.solved.values);
    this.triggerEvent('solve', this.updated.solution, this.updated);
    if (this.scope) {
      this.dispatchEvent(this.scope, 'solve', this.updated.solution, this.updated);
    }
    this.triggerEvent('solved', this.updated.solution, this.updated);
    if (this.scope) {
      this.dispatchEvent(this.scope, 'solved', this.updated.solution, this.updated);
    }
    this.inspector.update(this);
    return this.updated.solution;
  };

  Engine.prototype["yield"] = function(solution) {
    var _base, _ref;
    if (solution.operation) {
      return this.engine.updating["yield"](solution);
    }
    if (!solution.push) {
      return ((_ref = this.updating) != null ? _ref.each(this.resolve, this, solution) : void 0) || this.onSolve();
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

  Engine.prototype.subsolve = function(result, operation, continuation, scope) {
    var scoped, solution, _ref;
    if (!continuation && operation[0] === 'get') {
      continuation = operation[3];
    }
    solution = ['value', result, continuation || '', operation.toString()];
    if (!(scoped = scope !== engine.scope && scope)) {
      if (operation[0] === 'get' && operation[4]) {
        scoped = engine.identity.solve(operation[4]);
      }
    }
    if (operation.exported || scoped) {
      solution.push((_ref = operation.exported) != null ? _ref : null);
    }
    if (scoped) {
      solution.push(engine.identity["yield"](scoped));
    }
    solution.operation = operation;
    solution.parent = operation.parent;
    solution.domain = operation.domain;
    solution.index = operation.index;
    parent[operation.index] = solution;
    return engine.engine["yield"](solution);
  };

  Engine.prototype.resolve = function(domain, problems, index, workflow) {
    var finish, i, imports, locals, other, others, path, problem, property, providing, remove, removes, result, url, value, worker, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
    if (domain && !domain.solve && domain.postMessage) {
      workflow.postMessage(domain, problems);
      workflow.await(domain.url);
      return domain;
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
      workflow.imports.splice(index, finish - index);
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
        workflow.await(result.url);
      } else {
        if (providing && this.providing) {
          workflow.push(this.update(this.frame || true, this.providing));
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
      if (problems[0] === 'remove') {
        removes.push(problems);
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
      for (i = _l = 0, _len3 = _ref3.length; _l < _len3; i = ++_l) {
        other = _ref3[i];
        locals = [];
        other.changes = void 0;
        for (_m = 0, _len4 = removes.length; _m < _len4; _m++) {
          remove = removes[_m];
          for (index = _n = 0, _len5 = remove.length; _n < _len5; index = ++_n) {
            path = remove[index];
            if (index === 0) {
              continue;
            }
            if (other.paths[path]) {
              locals.push(path);
            } else if ((_ref4 = other.observers) != null ? _ref4[path] : void 0) {
              other.remove(path);
            }
          }
        }
        if (other.changes) {
          _ref5 = other.changes;
          for (property in _ref5) {
            value = _ref5[property];
            (result || (result = {}))[property] = value;
          }
          other.changes = void 0;
        }
        if (locals.length) {
          other.remove.apply(other, locals);
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
      _ref6 = this.workers;
      for (url in _ref6) {
        worker = _ref6[url];
        workflow.push(problems, worker);
      }
    }
    return result;
  };

  Engine.prototype.getWorkerURL = (function() {
    var scripts, src, _ref;
    if (typeof document !== "undefined" && document !== null) {
      scripts = document.getElementsByTagName('script');
      src = scripts[scripts.length - 1].src;
      if (((_ref = location.search) != null ? _ref.indexOf('log=0') : void 0) > -1) {
        src += ((src.indexOf('?') > -1) && '&' || '?') + 'log=0';
      }
    }
    return function(url) {
      return typeof url === 'string' && url || src;
    };
  })();

  Engine.prototype.useWorker = function(url) {
    var _this = this;
    if (!(typeof url === 'string' && (typeof Worker !== "undefined" && Worker !== null) && self.onmessage !== void 0)) {
      return;
    }
    this.worker = this.getWorker(url);
    this.worker.url = url;
    this.worker.addEventListener('message', this.eventHandler);
    this.worker.addEventListener('error', this.eventHandler);
    this.solve = function(commands) {
      var _base;
      (_base = _this.engine).updating || (_base.updating = new _this.update);
      _this.engine.updating.postMessage(_this.worker, commands);
      return _this.worker;
    };
    return this.worker;
  };

  Engine.prototype.getWorker = function(url) {
    var _base, _base1, _base2;
    return (_base = ((_base1 = this.engine).workers || (_base1.workers = {})))[url] || (_base[url] = (_base2 = (Engine.workers || (Engine.workers = {})))[url] || (_base2[url] = new Worker(url)));
  };

  Engine.prototype.precompile = function() {
    var _ref, _ref1;
    this.Domain.compile(this.Domains, this);
    if ((_ref = this.intrinsic) != null) {
      _ref.compile(true);
    }
    this.update = Engine.prototype.Update.compile(this);
    if ((_ref1 = this.mutations) != null) {
      _ref1.connect(true);
    }
    if (location.search.indexOf('export=') > -1) {
      return this.preexport();
    }
  };

  Engine.prototype.isCollection = function(object) {
    if (object && object.length !== void 0 && !object.substring && !object.nodeType) {
      if (object.isCollection) {
        return true;
      }
      switch (typeof object[0]) {
        case "object":
          return object[0].nodeType;
        case "undefined":
          return object.length === 0;
      }
    }
  };

  Engine.prototype.clone = function(object) {
    if (object && object.map) {
      return object.map(this.clone, this);
    }
    return object;
  };

  Engine.prototype.indexOfTriplet = function(array, a, b, c) {
    var index, op, _i, _len;
    if (array) {
      for (index = _i = 0, _len = array.length; _i < _len; index = _i += 3) {
        op = array[index];
        if (op === a && array[index + 1] === b && array[index + 2] === c) {
          return index;
        }
      }
    }
    return -1;
  };

  Engine.prototype.compile = function(state) {
    var domain, name;
    if (state) {
      for (name in this.Domains) {
        if (domain = this[name.toLowerCase()]) {
          this.Command.compile(domain);
        }
      }
      this.Command.compile(this.assumed);
      this.Command.compile(this.solved);
    }
    this.console.compile(this);
    this.running = state != null ? state : null;
    return this.triggerEvent('compile', this);
  };

  return Engine;

})(Domain);

Engine.Continuation = Engine.prototype.Continuation;

Engine.identity = Engine.prototype.identity = new Engine.prototype.Identity;

Engine.console = Engine.prototype.console = new Engine.prototype.Console;

Engine.Engine = Engine;

Engine.Domain = Engine.prototype.Domain = Domain;

if (!self.window && self.onmessage !== void 0) {
  self.addEventListener('message', function(e) {
    var changes, engine, property, solution, value;
    engine = Engine.messenger || (Engine.messenger = Engine());
    changes = engine.assumed.changes = {};
    solution = engine.solve(e.data) || {};
    engine.assumed.changes = void 0;
    for (property in changes) {
      value = changes[property];
      solution[property] = value;
    }
    return postMessage(solution);
  });
}

module.exports = this.GSS = Engine;
