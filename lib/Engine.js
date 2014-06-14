var Engine,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Engine = (function() {
  Engine.prototype.Expressions = require('./input/Expressions.js');

  Engine.prototype.References = require('./input/References.js');

  function Engine(scope) {
    var engine, id;
    if (scope && scope.nodeType) {
      if (!this.Expressions) {
        while (scope) {
          if (id = Engine.identify(scope)) {
            if (engine = Engine[id]) {
              return engine;
            }
          }
          if (!scope.parentNode) {
            break;
          }
          scope = scope.parentNode;
        }
        return new (Engine.Document || Engine)(scope);
      }
      id = Engine.prototype.References.acquire(scope);
      if (engine = Engine[id]) {
        return engine;
      }
      Engine[id] = this;
      this.scope = scope;
    }
    if (this.Expressions) {
      this.context = new this.Context(this);
      this.expressions = new this.Expressions(this);
      this.references = new this.References(this);
      this.events = {};
      return;
    } else {
      return new arguments.callee(scope);
    }
  }

  Engine.prototype.read = function() {
    return this.expressions.read.apply(this.expressions, arguments);
  };

  Engine.prototype.write = function() {
    return this.output.read.apply(this.output, arguments);
  };

  Engine.prototype.isCollection = function(object) {
    if (typeof object === 'object' && object.length !== void 0) {
      if (!(typeof object[0] === 'string' && !this.context[object[0]])) {
        return true;
      }
    }
  };

  Engine.prototype.once = function(type, fn) {
    fn.once = true;
    return this.addEventListener(type, fn);
  };

  Engine.prototype.addEventListener = function(type, fn) {
    var _base;
    return ((_base = this.events)[type] || (_base[type] = [])).push(fn);
  };

  Engine.prototype.removeEventListener = function(type, fn) {
    var group, index;
    if (group = this.events && this.events[type]) {
      if (index = group.indexOf(fn) > -1) {
        return group.splice(index, 1);
      }
    }
  };

  Engine.prototype.triggerEvent = function(type, a, b, c) {
    var fn, group, index, method;
    if (group = this.events[type]) {
      index = 0;
      while (fn = group[index]) {
        fn.call(this, a, b, c);
        if (fn.once) {
          group.splice(index, 1);
        } else {
          index++;
        }
      }
    }
    method = 'on' + type;
    if (__indexOf.call(this, method) >= 0) {
      return this[method](a, b, c);
    }
  };

  Engine.prototype.handleEvent = function(e) {
    return this.triggerEvent(e.type, e);
  };

  Engine.include = function() {
    var Context, fn, mixin, name, _i, _len, _ref;
    Context = function(engine) {
      this.engine = engine;
    };
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      mixin = arguments[_i];
      _ref = mixin.prototype;
      for (name in _ref) {
        fn = _ref[name];
        Context.prototype[name] = fn;
      }
    }
    return Context;
  };

  Engine.identify = Engine.prototype.References.identify;

  return Engine;

})();

self.GSS = Engine;

module.exports = Engine;
