/* Base class: Engine

Engine is a base class for scripting environments.
It initializes and orchestrates all moving parts.

It includes interpreter that operates in defined constraint domains.
Each domain has its own command set, that extends engine defaults.
*/

var Domain, Engine, Events, Native,
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

Native = require('./methods/Native');

Events = require('./concepts/Events');

Domain = require('./concepts/Domain');

Domain.Events || (Domain.Events = Native.prototype.mixin(Domain, Events));

Engine = (function(_super) {
  __extends(Engine, _super);

  Engine.prototype.Identity = require('./concepts/Identity');

  Engine.prototype.Evaluator = require('./concepts/Evaluator');

  Engine.prototype.Operation = require('./concepts/Operation');

  Engine.prototype.Variable = require('./concepts/Variable');

  Engine.prototype.Method = require('./concepts/Method');

  Engine.prototype.Property = require('./concepts/Property');

  Engine.prototype.Console = require('./concepts/Console');

  Engine.prototype.Debugger = require('./concepts/Debugger');

  Engine.prototype.Update = require('./concepts/Update');

  Engine.prototype.Continuation = require('./concepts/Continuation');

  Engine.prototype.Properties = require('./properties/Axioms');

  Engine.prototype.Methods = Native;

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
            if (this.Evaluator) {
              Engine[Engine.identity.provide(argument)] = this;
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
    if (!this.Evaluator) {
      return new Engine(arguments[0], arguments[1], arguments[2]);
    }
    Engine.__super__.constructor.call(this, this, url);
    this.domain = this;
    this.properties = new this.Properties(this);
    this.methods = new this.Methods(this);
    this.evaluator = new this.Evaluator(this);
    this["debugger"] = new this.Debugger(this);
    this.precompile();
    this.Operation = new this.Operation(this);
    this.Variable = new this.Variable(this);
    this.Continuation = this.Continuation["new"](this);
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
    if (expressions[0] === 'remove') {
      this.updating.push(expressions, null);
      if (parent) {
        parent.splice(index, 1);
      }
    }
    if (expressions[0] === 'value') {
      if (expressions[4]) {
        exp = parent[index] = expressions[3].split(',');
        path = this.Variable.getPath(exp[1], exp[2]);
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
      return this.provide(expressions);
    }
  };

  Engine.prototype.solve = function() {
    var arg, args, index, name, old, onlyRemoving, problematic, provided, providing, reason, restyled, solution, source, workflow, _base, _i, _len, _ref, _ref1, _ref2, _ref3, _ref4;
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
        _base.start = this.engine.time();
      }
      console.profile(1);
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
        _ref1.each(scope, this.intrinsic.update);
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
    debugger;
    if ((!solution || (!solution.push && !Object.keys(solution).length) || this.updating.problems[this.updating.index + 1]) && (this.updating.problems.length !== 1 || this.updating.domains[0] !== null) && !this.engine.restyled) {
      return;
    }
    if (!this.updating.problems.length && ((_ref4 = this.updated) != null ? _ref4.problems.length : void 0) && !this.engine.restyled) {
      this.updating.finish();
      this.updating = void 0;
      return;
    } else {
      this.updated = this.updating;
      this.updating.finish();
      this.updating = void 0;
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
    this["debugger"].update(this);
    return this.updated.solution;
  };

  Engine.prototype.provide = function(solution) {
    var _base, _ref;
    if (solution.operation) {
      return this.engine.updating.provide(solution);
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

  Engine.prototype.resolve = function(domain, problems, index, workflow) {
    var finish, i, imports, locals, other, others, path, problem, property, providing, remove, removes, result, url, value, worker, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _p, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    if (domain && !domain.solve && domain.postMessage) {
      workflow.postMessage(domain, problems);
      workflow.await(domain.url);
      return domain;
    }
    debugger;
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
      for (_l = 0, _len3 = removes.length; _l < _len3; _l++) {
        remove = removes[_l];
        for (index = _m = 0, _len4 = remove.length; _m < _len4; index = ++_m) {
          path = remove[index];
          if (index === 0) {
            continue;
          }
          this.unbypass(path);
        }
      }
      _ref3 = this.domains;
      for (i = _n = 0, _len5 = _ref3.length; _n < _len5; i = ++_n) {
        other = _ref3[i];
        locals = [];
        other.changes = void 0;
        for (_o = 0, _len6 = removes.length; _o < _len6; _o++) {
          remove = removes[_o];
          for (index = _p = 0, _len7 = remove.length; _p < _len7; index = ++_p) {
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
        if (other.changes) {
          _ref4 = other.changes;
          for (property in _ref4) {
            value = _ref4[property];
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
      _ref5 = this.workers;
      for (url in _ref5) {
        worker = _ref5[url];
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
    if ((_ref3 = this.mutations) != null) {
      _ref3.connect();
    }
    if (location.search.indexOf('export=') > -1) {
      return this.preexport();
    }
  };

  Engine.prototype.preexport = function() {
    var baseline, element, height, match, pairs, scope, width, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6,
      _this = this;
    if ((scope = this.scope).nodeType === 9) {
      scope = this.scope.body;
    }
    this.identity.provide(scope);
    _ref = scope.getElementsByTagName('*');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      element = _ref[_i];
      if (element.tagName !== 'SCRIPT' && (element.tagName !== 'STYLE' || ((_ref1 = element.getAttribute('type')) != null ? _ref1.indexOf('gss') : void 0) > -1)) {
        this.identity.provide(element);
      }
    }
    if (window.Sizes) {
      this.sizes = [];
      _ref2 = window.Sizes;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        pairs = _ref2[_j];
        _ref3 = pairs[0];
        for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
          width = _ref3[_k];
          _ref4 = pairs[1];
          for (_l = 0, _len3 = _ref4.length; _l < _len3; _l++) {
            height = _ref4[_l];
            this.sizes.push(width + 'x' + height);
          }
        }
      }
    }
    if (match = (_ref5 = location.search.match(/export=([a-z0-9]+)/)) != null ? _ref5[1] : void 0) {
      if (match.indexOf('x') > -1) {
        _ref6 = match.split('x'), width = _ref6[0], height = _ref6[1];
        baseline = 72;
        width = parseInt(width) * baseline;
        height = parseInt(height) * baseline;
        window.addEventListener('load', function() {
          localStorage[match] = JSON.stringify(_this["export"]());
          return _this.postexport();
        });
        document.body.style.width = width + 'px';
        this.intrinsic.properties['::window[height]'] = function() {
          return height;
        };
        return this.intrinsic.properties['::window[width]'] = function() {
          return width;
        };
      } else {
        if (match === 'true') {
          localStorage.clear();
          return this.postexport();
        }
      }
    }
  };

  Engine.prototype.postexport = function() {
    var property, result, size, value, _i, _len, _ref;
    _ref = this.sizes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      size = _ref[_i];
      if (!localStorage[size]) {
        location.search = location.search.replace(/[&?]export=([a-z0-9])+/, '') + '?export=' + size;
        return;
      }
    }
    result = {};
    for (property in localStorage) {
      value = localStorage[property];
      if (property.match(/^\d+x\d+$/)) {
        result[property] = JSON.parse(value);
      }
    }
    return document.write(JSON.stringify(result));
  };

  Engine.prototype["export"] = function() {
    var id, index, path, property, value, values, _ref;
    values = {};
    _ref = this.values;
    for (path in _ref) {
      value = _ref[path];
      if ((index = path.indexOf('[')) > -1 && path.indexOf('"') === -1) {
        property = this.camelize(path.substring(index + 1, path.length - 1));
        id = path.substring(0, index);
        if (property === 'x' || property === 'y' || document.body.style[property] !== void 0) {
          if (this.values[id + '[intrinsic-' + property + ']'] == null) {
            values[path] = Math.ceil(value);
          }
        }
      }
    }
    values.stylesheets = this.stylesheets["export"]();
    return values;
  };

  Engine.prototype.generate = function() {};

  Engine.prototype.compile = function(state) {
    var methods, properties;
    methods = this.methods || this.Methods.prototype;
    properties = this.properties || this.Properties.prototype;
    this.Method.compile(methods, this);
    this.Property.compile(properties, this);
    this.console.compile(this);
    this.running = state != null ? state : null;
    return this.triggerEvent('compile', this);
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

  return Engine;

})(Domain.Events);

Engine.Continuation = Engine.prototype.Continuation;

Engine.identity = Engine.prototype.identity = new Engine.prototype.Identity;

Engine.console = Engine.prototype.console = new Engine.prototype.Console;

Engine.Engine = Engine;

Engine.Domain = Engine.prototype.Domain = Domain;

Engine.mixin = Engine.prototype.mixin = Native.prototype.mixin;

Engine.time = Engine.prototype.time = Native.prototype.time;

Engine.clone = Engine.prototype.clone = Native.prototype.clone;

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
