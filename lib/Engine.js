/* Base class: Engine

Engine is a base class for scripting environments.
It initializes and orchestrates all moving parts.

It includes interpreter that operates in defined constraint domains.
Each domain has its own command set, that extends engine defaults.
*/

var Domain, Engine, Events, Native,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Events = require('./concepts/Events');

Domain = require('./concepts/Domain');

Native = require('./methods/Native');

Domain.Events || (Domain.Events = Native.prototype.mixin(Domain, Events));

Engine = (function(_super) {
  __extends(Engine, _super);

  Engine.prototype.Identity = require('./modules/Identity');

  Engine.prototype.Expressions = require('./modules/Expressions');

  Engine.prototype.Method = require('./concepts/Method');

  Engine.prototype.Property = require('./concepts/Property');

  Engine.prototype.Console = require('./concepts/Console');

  Engine.prototype.Properties = require('./properties/Axioms');

  Engine.prototype.Methods = Native.prototype.mixin(new Native, require('./methods/Conventions'), require('./methods/Algebra'));

  Engine.prototype.Domains = {
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
          if (this.Expressions) {
            this.url = url;
          } else {
            url = url;
          }
      }
    }
    if (!this.Expressions) {
      return new Engine(scope, url);
    }
    Engine.__super__.constructor.call(this);
    this.engine = this;
    this.domain = this;
    this.properties = new this.Properties(this);
    this.methods = new this.Methods(this);
    this.precompile();
    this.expressions = new this.Expressions(this);
    this.assumed = new this.Domain(this, assumed, 'Assumed');
    this.solved = new this.Numeric(this);
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

  Engine.prototype.strategy = 'expressions';

  Engine.prototype.solve = function() {
    var args, index, provided, reason, solution, source, _ref, _ref1;
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
    if ((_ref = args[0]) != null ? _ref.push : void 0) {
      this.console.start(reason || args[0], source || this.displayName || 'Intrinsic');
    }
    if (typeof args[0] === 'function') {
      solution = args.shift().apply(this, args);
    } else {
      this.providing = null;
      if (!(solution = Domain.prototype.solve.apply(this, args))) {
        if (provided = this.providing) {
          this.providing = void 0;
          solution = this.provide(provided);
        }
      }
      this.providing = void 0;
    }
    if ((_ref1 = args[0]) != null ? _ref1.push : void 0) {
      this.console.end(reason);
    }
    if (!solution) {
      return;
    }
    if (this.applier && !this.applier.solve(solution)) {
      return;
    }
    this.console.info('Solution\t   ', solution);
    this.triggerEvent('solve', solution);
    if (this.scope) {
      this.dispatchEvent(this.scope, 'solve', solution);
    }
    return solution;
  };

  Engine.prototype.provide = function(solution, recursive) {
    var arg, d, domain, domains, host, index, merged, provided, result, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m;
    if (this.providing !== void 0) {
      (this.providing || (this.providing = [])).push(solution);
      return;
    }
    domains = void 0;
    switch (typeof solution) {
      case 'object':
        if (solution.push) {
          for (_i = 0, _len = solution.length; _i < _len; _i++) {
            arg = solution[_i];
            if (arg != null ? arg.push : void 0) {
              provided = this.engine.provide(arg, true);
              if (domains) {
                for (_j = 0, _len1 = provided.length; _j < _len1; _j++) {
                  domain = provided[_j];
                  if (domain !== this && domains.indexOf(domain) === -1) {
                    merged = void 0;
                    if (isFinite(domain.priority)) {
                      for (_k = 0, _len2 = domains.length; _k < _len2; _k++) {
                        d = domains[_k];
                        if (merged = d.merge(domain)) {
                          domain = merged;
                          break;
                        }
                      }
                    }
                    if (!merged) {
                      domains.unshift(domain);
                    }
                  }
                }
              } else {
                domains = provided;
              }
            }
          }
          host = solution[0] === 'get' && this.Domain(solution) || solution.domain;
          if (host && host !== this && (!domains || domains.indexOf(host) === -1)) {
            domains || (domains = []);
            for (index = _l = 0, _len3 = domains.length; _l < _len3; index = ++_l) {
              domain = domains[index];
              if (domain.priority <= host.priority) {
                break;
              }
            }
            domains.splice(index, 0, host);
          }
        }
    }
    if (domains) {
      if (!recursive) {
        console.error(domains);
        result = solution;
        for (_m = 0, _len4 = domains.length; _m < _len4; _m++) {
          domain = domains[_m];
          this.console.start(result, domain.displayName);
          this.providing = null;
          result = domain.solve(result) || this.providing;
          this.providing = void 0;
          this.console.end();
        }
        return result;
      }
      return domains;
    } else if (recursive) {
      return [this.intrinsic];
    }
    return solution;
  };

  Engine.prototype.useWorker = function(url) {
    var _this = this;
    if (!(typeof url === 'string' && self.onmessage !== void 0)) {
      return;
    }
    this.worker = new this.getWorker(url);
    this.worker.addEventListener('message', this.onmessage.bind(this));
    this.worker.addEventListener('error', this.onerror.bind(this));
    this.solve = function() {
      return _this.worker.postMessage.apply(_this.worker, arguments);
    };
    return this.worker;
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
    return Engine().solve(e.data);
  });
}

module.exports = this.GSS = Engine;
