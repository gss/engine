/* Base class: Engine

Engine is a base class for scripting environment.
It initializes and orchestrates all moving parts.

It operates with workers and domains. Workers are
separate engines running in web worker thread. 
Domains are either independent constraint graphs or
pseudo-solvers like intrinsic measurements.
*/

var Engine,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Engine = (function() {
  Engine.prototype.Command = require('./Command');

  Engine.prototype.Domain = require('./Domain');

  Engine.prototype.Update = require('./Update');

  Engine.prototype.Query = require('./Query');

  Engine.prototype.Console = require('./utilities/Console');

  Engine.prototype.Inspector = require('./utilities/Inspector');

  Engine.prototype.Exporter = require('./utilities/Exporter');

  Engine.prototype.Domains = {
    Document: require('./domains/Document'),
    Abstract: require('./domains/Abstract'),
    Intrinsic: require('./domains/Intrinsic'),
    Numeric: require('./domains/Numeric'),
    Linear: require('./domains/Linear'),
    Finite: require('./domains/Finite'),
    Boolean: require('./domains/Boolean')
  };

  function Engine() {
    var argument, assumed, engine, id, index, property, scope, url, value, _i, _len;
    for (index = _i = 0, _len = arguments.length; _i < _len; index = ++_i) {
      argument = arguments[index];
      if (!argument) {
        continue;
      }
      switch (typeof argument) {
        case 'object':
          if (argument.nodeType) {
            if (this.Command) {
              this.scope = scope = this.getScopeElement(argument);
              Engine[Engine.identify(argument)] = this;
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
    if (url != null) {
      this.url = url;
    }
    this.listeners = {};
    this.observers = {};
    this.queries = {};
    this.lefts = [];
    this.pairs = {};
    this.eventHandler = this.handleEvent.bind(this);
    this.addListeners(this.$events);
    this.addListeners(this.events);
    this.variables = {};
    this.domains = [];
    this.engine = this;
    this.inspector = new this.Inspector(this);
    this.precompile();
    this.assumed = new this.Numeric;
    this.assumed.displayName = 'Assumed';
    this.assumed["static"] = true;
    this.assumed.setup();
    this.solved = new this.Boolean;
    this.solved.displayName = 'Solved';
    this.solved.priority = -200;
    this.solved.setup();
    this.values = this.solved.values;
    for (property in assumed) {
      value = assumed[property];
      this.assumed.values[property] = this.values[property] = value;
    }
    this.domain = this.linear;
    this.strategy = typeof window === "undefined" || window === null ? 'evaluate' : this.scope ? 'document' : 'abstract';
    return this;
  }

  Engine.prototype.evaluate = function(expressions) {
    return this.update(expressions);
  };

  Engine.prototype.solve = function() {
    var args, old, result, strategy, transacting, _base;
    if (!this.transacting) {
      this.transacting = transacting = true;
    }
    args = this.transact.apply(this, arguments);
    if (!(old = this.updating)) {
      this.engine.updating = new this.update;
      if ((_base = this.updating).start == null) {
        _base.start = this.engine.console.time();
      }
    }
    if (typeof args[0] === 'function') {
      result = args.shift().apply(this, args);
    } else if (args[0] != null) {
      strategy = this[this.strategy];
      if (strategy.solve) {
        result = strategy.solve.apply(strategy, args) || {};
      } else {
        result = strategy.apply(this, args);
      }
    }
    if (transacting) {
      this.transacting = void 0;
      return this.commit(result);
    }
  };

  Engine.prototype.transact = function() {
    var arg, args, index, name, problematic, reason, source, _i, _len;
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
      this.compile();
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
    if (name = source || this.displayName) {
      this.console.start(reason || args[0], name);
    }
    return args;
  };

  Engine.prototype.commit = function(solution, update) {
    var _ref, _ref1;
    if (update == null) {
      update = this.updating;
    }
    if (update.blocking) {
      return;
    }
    if (solution) {
      if (Object.keys(solution).length) {
        if (update.solution !== solution) {
          update.apply(solution);
        }
        this.solved.merge(solution);
      }
    }
    while (!(update.isDone() && !update.restyled && !update.solved)) {
      while (!update.isDocumentDone()) {
        this.triggerEvent('precommit', update);
        this.Query.prototype.commit(this);
        this.Query.prototype.repair(this);
        this.Query.prototype.branch(this);
        this.triggerEvent('commit', update);
      }
      if (update.blocking) {
        return;
      }
      if (update.domains.length) {
        if (!((_ref = update.busy) != null ? _ref.length : void 0)) {
          update.each(this.resolve, this);
        }
        if ((_ref1 = update.busy) != null ? _ref1.length : void 0) {
          return update;
        }
      }
      if (update.solution) {
        this.triggerEvent('apply', update.solution, update);
        this.triggerEvent('write', update.solution, update);
        this.solved.merge(update.solution);
      }
      if (update.solved || update.isDone()) {
        update.solved = update.restyled = void 0;
        this.triggerEvent('validate', update.solution, update);
      }
    }
    if (!update.hadSideEffects(solution)) {
      this.updating = void 0;
      return update;
    }
    update.finish();
    this.updated = update;
    this.updating = void 0;
    this.console.groupEnd();
    this.console.info('Solution\t   ', this.updated, update.solution, this.solved.values);
    this.fireEvent('solve', update.solution, this.updated);
    this.fireEvent('solved', update.solution, this.updated);
    return update.solution;
  };

  Engine.prototype.validate = function(update) {
    return true;
  };

  Engine.prototype["yield"] = function(solution) {
    var _ref;
    if (!solution.push) {
      return ((_ref = this.updating) != null ? _ref.each(this.resolve, this.engine, solution) : void 0) || this.onSolve(solution);
    }
    return this.update.apply(this.engine, arguments);
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
      return this.broadcast(problems, update);
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
    return result;
  };

  Engine.prototype.broadcast = function(problems, update, insert) {
    var broadcasted, i, index, locals, other, others, path, problem, property, remove, removes, result, url, value, worker, working, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4;
    if (update == null) {
      update = this.updating;
    }
    others = [];
    removes = [];
    if (insert) {
      if (update.domains[update.index + 1] !== null) {
        update.domains.splice(update.index, 0, null);
        update.problems.splice(update.index, 0, problems);
      } else {
        broadcasted = update.problems[update.index + 1];
        broadcasted.push.apply(broadcasted, problems);
      }
    }
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
          } else if ((_ref2 = other.watched) != null ? _ref2[path] : void 0) {
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
        locals.index = -1;
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
    for (url in _ref4) {
      worker = _ref4[url];
      working = problems.filter(function(command) {
        var _ref5;
        return command[0] !== 'remove' || ((_ref5 = worker.paths) != null ? _ref5[command[1]] : void 0);
      });
      update.push(working, worker, true);
    }
  };

  Engine.prototype.precompile = function() {
    this.Domain.compile(this.Domains, this);
    this.update = Engine.prototype.Update.compile(this);
    if (location.search.indexOf('export=') > -1) {
      return this.preexport();
    }
  };

  Engine.prototype.compile = function() {
    var domain, name;
    for (name in this.Domains) {
      if (domain = this[name.toLowerCase()]) {
        domain.compile();
      }
    }
    this.assumed.compile();
    this.solved.compile();
    this.console.compile(this);
    this.running = true;
    return this.triggerEvent('compile', this);
  };

  Engine.prototype.fireEvent = function(name, data, object) {
    this.triggerEvent(name, data, object);
    if (this.scope) {
      return this.dispatchEvent(this.scope, name, data, object);
    }
  };

  Engine.prototype.DONE = 'solve';

  Engine.prototype.$events = {
    remove: function(path) {
      return this.updating.remove(path);
    },
    "switch": function(path, operation) {},
    destroy: function(e) {
      if (this.scope) {
        Engine[this.scope._gss_id] = void 0;
      }
      if (this.worker) {
        this.worker.removeEventListener('message', this.eventHandler);
        return this.worker.removeEventListener('error', this.eventHandler);
      }
    },
    message: function(e) {
      var property, value, values, _base, _ref;
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
          return this.commit(e.data);
        }
      }
    },
    error: function(e) {
      throw new Error("" + e.message + " (" + e.filename + ":" + e.lineno + ")");
    }
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
    this.solve = function(commands) {
      var _base1;
      (_base1 = _this.engine).updating || (_base1.updating = new _this.update);
      _this.engine.updating.postMessage(_this.worker, commands);
      return _this.worker;
    };
    return this.worker;
  };

  Engine.prototype.getWorker = function(url) {
    var worker, _base, _base1, _base2;
    worker = (_base = ((_base1 = this.engine).workers || (_base1.workers = {})))[url] || (_base[url] = (_base2 = (Engine.workers || (Engine.workers = {})))[url] || (_base2[url] = new Worker(url)));
    worker.url || (worker.url = url);
    worker.addEventListener('message', this.engine.eventHandler);
    worker.addEventListener('error', this.engine.eventHandler);
    return worker;
  };

  Engine.prototype.getVariableDomain = function(operation, Default) {
    var domain, i, index, intrinsic, op, path, prefix, property, _ref, _ref1, _ref2, _ref3, _ref4;
    if (operation.domain) {
      return operation.domain;
    }
    path = operation[1];
    if ((i = path.indexOf('[')) > -1) {
      property = path.substring(i + 1, path.length - 1);
    }
    if (this.assumed.values.hasOwnProperty(path)) {
      return this.assumed;
    } else if (property && (intrinsic = (_ref = this.intrinsic) != null ? _ref.properties : void 0)) {
      if ((intrinsic[path] != null) || (intrinsic[property] && !intrinsic[property].matcher)) {
        return this.intrinsic;
      }
    }
    if (Default) {
      return Default;
    }
    if (property && (index = property.indexOf('-')) > -1) {
      prefix = property.substring(0, index);
      if ((domain = this[prefix])) {
        if (domain instanceof this.Domain) {
          return domain;
        }
      }
    }
    if (op = (_ref1 = this.variables[path]) != null ? (_ref2 = _ref1.constraints) != null ? (_ref3 = _ref2[0]) != null ? (_ref4 = _ref3.operations[0]) != null ? _ref4.domain : void 0 : void 0 : void 0 : void 0) {
      return op;
    }
    if (this.domain.url) {
      return this.domain;
    } else {
      return this.domain.maybe();
    }
  };

  Engine.prototype.getScopeElement = function(node) {
    switch (node.tagName) {
      case 'HTML':
      case 'BODY':
      case 'HEAD':
        return document;
      case 'STYLE':
        if (node.scoped) {
          return this.getScopeElement(node.parentNode);
        }
    }
    return node;
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

  Engine.prototype.destroy = function() {
    this.triggerEvent('destroy');
    if (this.scope) {
      this.dispatchEvent(this.scope, 'destroy');
    }
    if (this.events) {
      return this.removeListeners(this.events);
    }
  };

  Engine.prototype.addListeners = function(listeners) {
    var callback, name, _results;
    _results = [];
    for (name in listeners) {
      callback = listeners[name];
      _results.push(this.addEventListener(name, callback));
    }
    return _results;
  };

  Engine.prototype.removeListeners = function(listeners) {
    var callback, name, _results;
    _results = [];
    for (name in listeners) {
      callback = listeners[name];
      _results.push(this.removeEventListener(name, callback));
    }
    return _results;
  };

  Engine.prototype.once = function(type, fn) {
    fn.once = true;
    return this.addEventListener(type, fn);
  };

  Engine.prototype.addEventListener = function(type, fn) {
    var _base;
    return ((_base = this.listeners)[type] || (_base[type] = [])).push(fn);
  };

  Engine.prototype.removeEventListener = function(type, fn) {
    var group, index;
    if (group = this.listeners[type]) {
      if ((index = group.indexOf(fn)) > -1) {
        return group.splice(index, 1);
      }
    }
  };

  Engine.prototype.triggerEvent = function(type, a, b, c) {
    var fn, group, index, j, method, _ref;
    if (group = (_ref = this.listeners) != null ? _ref[type] : void 0) {
      index = 0;
      j = group.length;
      while (index < j) {
        fn = group[index];
        if (fn.once) {
          group.splice(index--, 1);
          j--;
        }
        fn.call(this, a, b, c);
        index++;
      }
    }
    if (this[method = 'on' + type]) {
      return this[method](a, b, c);
    }
  };

  Engine.prototype.dispatchEvent = function(element, type, data, bubbles, cancelable) {
    var detail, prop, value;
    if (!this.scope) {
      return;
    }
    detail = {
      engine: this
    };
    for (prop in data) {
      value = data[prop];
      detail[prop] = value;
    }
    return element.dispatchEvent(new CustomEvent(type, {
      detail: detail,
      bubbles: bubbles,
      cancelable: cancelable
    }));
  };

  Engine.prototype.handleEvent = function(e) {
    return this.triggerEvent(e.type, e);
  };

  Engine.prototype.then = function(callback) {
    return this.once(this.DONE, callback);
  };

  return Engine;

})();

Engine.prototype.Identity = (function() {
  function Identity() {
    this.set = __bind(this.set, this);
  }

  Identity.uid = 0;

  Identity.prototype.set = function(object, generate) {
    var id, uid;
    if (!object) {
      return '';
    }
    if (typeof object === 'string') {
      if (object.charAt(0) !== '$' && object.charAt(0) !== ':') {
        return '$' + object;
      }
      return object;
    }
    if (!(id = object._gss_id)) {
      if (object === document) {
        id = "::document";
      } else if (object === window) {
        id = "::window";
      }
      if (generate !== false) {
        if (uid = object._gss_uid) {
          object._gss_id = uid;
        }
        object._gss_id = id || (id = "$" + (object.id || object._gss_id || ++Identity.uid));
        this[id] = object;
      }
    }
    return id;
  };

  Identity.prototype.get = function(id) {
    return this[id];
  };

  Identity.prototype.solve = function(id) {
    return this[id];
  };

  Identity.prototype.unset = function(object) {
    return delete this[object._gss_id];
  };

  Identity.prototype.find = function(object) {
    return this.set(object, false);
  };

  return Identity;

})();

if (!self.window && self.onmessage !== void 0) {
  self.addEventListener('message', function(e) {
    var commands, data, engine, property, removes, result, solution, value, values;
    if (!(engine = Engine.messenger)) {
      engine = Engine.messenger = Engine();
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
        if (this.updating.domains[0] === null) {
          this.broadcast(this.updating.problems[0]);
          this.updating.index++;
        }
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
    if (!engine.domains.length) {
      engine.variables = {};
      engine.linear.operations = void 0;
    }
    return postMessage(result);
  });
}

Engine.Engine = Engine;

Engine.identity = Engine.prototype.identity = new Engine.prototype.Identity;

Engine.identify = Engine.prototype.identify = Engine.identity.set;

Engine.console = Engine.prototype.console = new Engine.prototype.Console;

Engine.clone = Engine.prototype.clone = function(object) {
  if (object && object.map) {
    return object.map(this.clone, this);
  }
  return object;
};

module.exports = this.GSS = Engine;
