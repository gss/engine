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
              Engine[Engine.identity(argument)] = this;
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
    this.addListeners(this.$events);
    this.domains = [];
    this.domain = this;
    this.inspector = new this.Inspector(this);
    this.precompile();
    this.Continuation = this.Continuation["new"](this);
    this.assumed = new this.Numeric(assumed);
    this.assumed.displayName = 'Assumed';
    this.assumed["static"] = true;
    this.assumed.setup();
    this.solved = new this.Boolean;
    this.solved.displayName = 'Solved';
    this.solved.setup();
    this.values = this.solved.values;
    this.variables = {};
    this.strategy = typeof window === "undefined" || window === null ? 'evaluate' : this.scope ? 'document' : 'abstract';
    return this;
  }

  Engine.prototype.evaluate = function(expressions) {
    return this.update(expressions).solution;
  };

  Engine.prototype.solve = function() {
    var arg, args, index, name, old, onlyRemoving, problematic, providing, reason, restyled, solution, source, update, _base, _i, _len, _ref, _ref1, _ref2, _ref3;
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
    } else if (args[0] != null) {
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
      this.providing = void 0;
    }
    if (name) {
      this.console.end(reason);
    }
    update = this.updating;
    if (update.domains.length) {
      if (old) {
        if (old !== update) {
          old.push(update);
        }
      }
      if (!old || !((_ref2 = update.busy) != null ? _ref2.length : void 0)) {
        update.each(this.resolve, this);
      }
      if ((_ref3 = update.busy) != null ? _ref3.length : void 0) {
        return update;
      }
    }
    onlyRemoving = update.problems.length === 1 && update.domains[0] === null;
    restyled = onlyRemoving || (this.restyled && !old && !update.problems.length);
    if (this.engine === this && providing && (!update.problems[update.index + 1] || restyled)) {
      return this.onSolve(null, restyled);
    }
  };

  Engine.prototype.onSolve = function(solution, restyled) {
    var effects, update, _ref, _ref1, _ref2, _ref3;
    update = this.updating;
    if (solution || (solution = update.solution)) {
      this.fireEvent('apply', solution, update);
      if ((_ref = this.applier) != null) {
        _ref.solve(solution);
      }
    } else if (!update.reflown && !restyled) {
      if (!update.problems.length) {
        this.updating = void 0;
      }
      return;
    }
    if (this.intrinsic) {
      this.intrinsic.changes = {};
      update.apply(this.intrinsic.perform());
      this.intrinsic.changes = void 0;
    }
    this.solved.merge(solution);
    if ((_ref1 = this.pairs) != null) {
      _ref1.onBeforeSolve();
    }
    update.reset();
    effects = update.each(this.resolve, this);
    if ((_ref2 = update.busy) != null ? _ref2.length : void 0) {
      return effects;
    }
    if (effects && Object.keys(effects).length) {
      return this.onSolve(effects);
    }
    if ((!solution || (!solution.push && !Object.keys(solution).length) || update.problems[update.index + 1]) && (update.problems.length !== 1 || update.domains[0] !== null) && !this.engine.restyled) {
      return;
    }
    this.updating.finish();
    if (!update.problems.length && ((_ref3 = this.updated) != null ? _ref3.problems.length : void 0) && !this.engine.restyled) {
      this.restyled = this.updating = void 0;
      return;
    } else {
      this.restyled = this.updating = void 0;
      this.updated = update;
    }
    this.console.info('Solution\t   ', this.updated, solution, this.solved.values);
    this.fireEvent('solve', this.updated.solution, this.updated);
    this.fireEvent('solved', this.updated.solution, this.updated);
    this.inspector.update(this);
    return this.updated.solution;
  };

  Engine.prototype.fireEvent = function(name, data, object) {
    this.triggerEvent(name, data, object);
    if (this.scope) {
      return this.dispatchEvent(this.scope, name, data, object);
    }
  };

  Engine.prototype["yield"] = function(solution) {
    var _ref;
    if (!solution.push) {
      return ((_ref = this.updating) != null ? _ref.each(this.resolve, this, solution) : void 0) || this.onSolve(solution);
    }
    return this.update.apply(this, arguments);
  };

  Engine.prototype.resolve = function(domain, problems, index, update) {
    var problem, result, _i, _len;
    if (domain && !domain.solve && domain.postMessage) {
      update.postMessage(domain, problems);
      update.await(domain.url);
      return domain;
    }
    for (index = _i = 0, _len = problems.length; _i < _len; index = ++_i) {
      problem = problems[index];
      if (problem instanceof Array && problem.length === 1 && problem[0] instanceof Array) {
        problem = problems[index] = problem[0];
      }
    }
    if (!domain) {
      return this.broadcast(problems, index, update);
    }
    this.console.start(problems, domain.displayName);
    result = domain.solve(problems) || void 0;
    if (result && result.postMessage) {
      update.await(result.url);
    } else {
      if ((result != null ? result.length : void 0) === 1) {
        result = result[0];
      }
    }
    this.console.end();
    domain.setup();
    if (domain.priority < 0 && !domain.url) {
      if (this.domains.indexOf(domain) === -1) {
        this.domains.push(domain);
      }
    } else {

    }
    return result;
  };

  Engine.prototype.broadcast = function(problems, index, update) {
    var i, locals, other, others, path, problem, property, remove, removes, result, url, value, worker, working, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4, _results;
    others = [];
    removes = [];
    if (problems[0] === 'remove') {
      removes.push(problems);
    } else {
      for (_i = 0, _len = problems.length; _i < _len; _i++) {
        problem = problems[_i];
        if (problem[0] === 'remove') {
          removes.push(problem);
        } else {
          others.push(problem);
        }
      }
    }
    _ref = [this.assumed, this.solved].concat(this.domains);
    for (i = _j = 0, _len1 = _ref.length; _j < _len1; i = ++_j) {
      other = _ref[i];
      locals = [];
      other.changes = void 0;
      for (_k = 0, _len2 = removes.length; _k < _len2; _k++) {
        remove = removes[_k];
        for (index = _l = 0, _len3 = remove.length; _l < _len3; index = ++_l) {
          path = remove[index];
          if (index === 0) {
            continue;
          }
          if ((_ref1 = other.paths) != null ? _ref1[path] : void 0) {
            locals.push(path);
          } else if ((_ref2 = other.observers) != null ? _ref2[path] : void 0) {
            other.remove(path);
          }
        }
      }
      if (other.changes) {
        _ref3 = other.changes;
        for (property in _ref3) {
          value = _ref3[property];
          (result || (result = {}))[property] = value;
        }
        other.changes = void 0;
      }
      if (locals.length) {
        locals.unshift('remove');
        update.push([locals], other, true);
      }
      if (others.length) {
        update.push(others, other);
      }
    }
    if (typeof problems[0] === 'string') {
      problems = [problems];
    }
    _ref4 = this.workers;
    _results = [];
    for (url in _ref4) {
      worker = _ref4[url];
      working = problems.filter(function(command) {
        var _ref5;
        return command[0] !== 'remove' || ((_ref5 = worker.paths) != null ? _ref5[command[1]] : void 0);
      });
      _results.push(update.push(working, worker));
    }
    return _results;
  };

  Engine.prototype.precompile = function() {
    var _ref;
    this.Domain.compile(this.Domains, this);
    this.update = Engine.prototype.Update.compile(this);
    if ((_ref = this.mutations) != null) {
      _ref.connect(true);
    }
    if (location.search.indexOf('export=') > -1) {
      return this.preexport();
    }
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
    var _base,
      _this = this;
    if (!(typeof url === 'string' && (typeof Worker !== "undefined" && Worker !== null) && self.onmessage !== void 0)) {
      return;
    }
    (_base = this.engine).worker || (_base.worker = this.engine.getWorker(url));
    this.worker.url = url;
    this.worker.addEventListener('message', this.engine.eventHandler);
    this.worker.addEventListener('error', this.engine.eventHandler);
    this.solve = function(commands) {
      var _base1;
      (_base1 = _this.engine).updating || (_base1.updating = new _this.update);
      _this.engine.updating.postMessage(_this.worker, commands);
      return _this.worker;
    };
    return this.worker;
  };

  Engine.prototype.getWorker = function(url) {
    var _base, _base1, _base2;
    return (_base = ((_base1 = this.engine).workers || (_base1.workers = {})))[url] || (_base[url] = (_base2 = (Engine.workers || (Engine.workers = {})))[url] || (_base2[url] = new Worker(url)));
  };

  Engine.prototype.$events = {
    message: function(e) {
      var i, property, value, values, _base, _ref;
      values = (_base = e.target).values || (_base.values = {});
      _ref = e.data;
      for (property in _ref) {
        value = _ref[property];
        if (value != null) {
          values[property] = value;
        } else {
          delete values[property];
        }
      }
      if (this.updating) {
        if (this.updating.busy.length) {
          this.updating.busy.splice(this.updating.busy.indexOf(e.target.url), 1);
          if ((i = this.updating.solutions.indexOf(e.target)) > -1) {
            this.updating.solutions[i] = e.data;
          }
          if (!this.updating.busy.length) {
            return this.updating.each(this.resolve, this, e.data) || this.onSolve(e.data);
          } else {
            return this.updating.apply(e.data);
          }
        }
      }
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

  return Engine;

})(Domain);

if (!self.window && self.onmessage !== void 0) {
  self.addEventListener('message', function(e) {
    var commands, data, engine, property, removes, result, solution, value, values;
    if (!(engine = Engine.messenger)) {
      engine = Engine.messenger = Engine();
      engine.compile(true);
    }
    data = e.data;
    values = void 0;
    commands = [];
    removes = [];
    solution = engine.solve(function() {
      var command, index, _i, _len, _ref;
      if ((values = data[0]) && !values.push) {
        for (index = _i = 0, _len = data.length; _i < _len; index = ++_i) {
          command = data[index];
          if (index) {
            if (command[0] === 'remove') {
              removes.push(command);
            } else {
              if (((_ref = command[0]) != null ? _ref.key : void 0) != null) {
                command[1].parent = command;
              }
              commands.push(command);
            }
          }
        }
      }
      if (removes.length) {
        this.solve(removes);
      }
      if (values) {
        this.assumed.merge(values);
      }
      if (commands.length) {
        return this.solve(commands);
      }
    });
    result = {};
    if (values) {
      for (property in values) {
        value = values[property];
        result[property] = value;
      }
      for (property in solution) {
        value = solution[property];
        result[property] = value;
      }
    }
    return postMessage(result);
  });
}

Engine.Continuation = Engine.prototype.Continuation;

Engine.identity = Engine.prototype.identity = new Engine.prototype.Identity;

Engine.console = Engine.prototype.console = new Engine.prototype.Console;

Engine.Engine = Engine;

Engine.Domain = Engine.prototype.Domain = Domain;

module.exports = this.GSS = Engine;
