var Engine;

this.require || (this.require = function(string) {
  var bits;
  bits = string.replace('.js', '').split('/');
  if (string === 'cassowary') {
    return c;
  }
  return this[bits[bits.length - 1]];
});

Engine = (function() {
  Engine.prototype.Expressions = require('./input/Expressions.js');

  function Engine(scope, url) {
    var Document, engine, id;
    if (scope && scope.nodeType) {
      if (this.Expressions) {
        if (Document = Engine.Document) {
          if (!(this instanceof Document)) {
            return new Document(scope, url);
          }
        }
        Engine[Engine.identify(scope)] = this;
        this.scope = scope;
        this.all = scope.getElementsByTagName('*');
      } else {
        while (scope) {
          if (id = Engine.recognize(scope)) {
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
    }
    if (!scope || typeof scope === 'string') {
      if (Engine.Solver && !(this instanceof Engine.Solver)) {
        return new Engine.Solver(void 0, void 0, scope);
      }
    }
    if (this.Expressions) {
      if (this.Properties) {
        this.properties = new this.Properties(this);
      }
      if (this.Commands) {
        this.commands = new this.Commands(this);
      }
      this.expressions = new this.Expressions(this);
      this.events = {};
      this.values = {};
      return;
    }
    return new (Engine.Document || Engine)(scope, url);
  }

  Engine.prototype.run = function() {
    return this.expressions.pull.apply(this.expressions, arguments);
  };

  Engine.prototype.pull = function() {
    return this.expressions.pull.apply(this.expressions, arguments);
  };

  Engine.prototype["do"] = function() {
    return this.expressions["do"].apply(this.expressions, arguments);
  };

  Engine.prototype.defer = function() {
    var _base;
    if (this.deferred == null) {
      (_base = this.expressions).buffer || (_base.buffer = null);
      this.deferred = setImmediate(this.expressions.flush.bind(this.expressions));
    }
    return this.run.apply(this, arguments);
  };

  Engine.prototype.push = function(data) {
    var id, _i, _len, _ref;
    if (this.removed) {
      _ref = this.removed;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        delete this.engine.elements[id];
      }
      this.removed = void 0;
    }
    this.merge(data);
    this.triggerEvent('solved', data);
    if (this.scope) {
      this.dispatchEvent(this.scope, 'solved', data);
    }
    if (this.output) {
      return this.output.pull.apply(this.output, arguments);
    }
  };

  Engine.prototype.isCollection = function(object) {
    if (object && object.length !== void 0 && !object.substring && !object.nodeType) {
      switch (typeof object[0]) {
        case "object":
          return !object[0].push;
        case "undefined":
          return object.length === 0;
      }
    }
  };

  Engine.prototype.merge = function(object) {
    var old, prop, value;
    for (prop in object) {
      value = object[prop];
      old = this.values[prop];
      if (old === value) {
        continue;
      }
      if (this._onChange) {
        this._onChange(prop, value, old);
      }
      if (value != null) {
        this.values[prop] = value;
      } else {
        delete this.values[prop];
      }
    }
    return this;
  };

  Engine.prototype.destroy = function() {
    if (this.scope) {
      return Engine[this.scope._gss_id] = void 0;
    }
  };

  Engine.prototype.getContinuation = function(path, value) {
    if (typeof value === 'string') {
      return value;
    }
    return path + Engine.identify(value);
  };

  Engine.get = function(id) {
    return Engine.prototype.elements[id];
  };

  Engine.prototype.get = function(id) {
    return this.elements[id];
  };

  Engine.identify = function(object, generate) {
    var id;
    if (!(id = object._gss_id)) {
      if (object === document) {
        object = window;
      }
      if (generate !== false) {
        object._gss_id = id = "$" + (object.id || ++Engine.uid);
      }
      Engine.prototype.elements[id] = object;
    }
    return id;
  };

  Engine.recognize = function(object) {
    return Engine.identify(object, false);
  };

  Engine.prototype.identify = function(object) {
    return Engine.identify(object);
  };

  Engine.prototype.recognize = function(object) {
    return Engine.identify(object, false);
  };

  Engine.uid = 0;

  Engine.prototype.elements = {};

  Engine.prototype.engines = {};

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
      if ((index = group.indexOf(fn)) > -1) {
        return group.splice(index, 1);
      }
    }
  };

  Engine.prototype.triggerEvent = function(type, a, b, c) {
    var fn, group, index, method, _i;
    if (group = this.events[type]) {
      for (index = _i = group.length - 1; _i >= 0; index = _i += -1) {
        fn = group[index];
        if (fn.once) {
          group.splice(index, 1);
        }
        fn.call(this, a, b, c);
      }
    }
    if (this[method = 'on' + type]) {
      return this[method](a, b, c);
    }
  };

  Engine.prototype.dispatchEvent = function(element, type, detail, bubbles, cancelable) {
    if (!this.scope) {
      return;
    }
    (detail || (detail = {})).engine = this;
    return element.dispatchEvent(new CustomEvent(type, {
      detail: detail,
      bubbles: bubbles,
      cancelable: cancelable
    }));
  };

  Engine.clone = function(object) {
    if (object && object.map) {
      return object.map(this.clone, this);
    }
    return object;
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

  Engine.prototype.handleEvent = function(e) {
    return this.triggerEvent(e.type, e);
  };

  Engine.prototype.start = function() {
    var command, property, _ref;
    if (this.running) {
      return;
    }
    _ref = this.commands;
    for (property in _ref) {
      command = _ref[property];
      if (property !== 'engine') {
        command.reference = '_' + property;
        this[command.reference] = Engine.Command(command, command.reference);
      }
    }
    return this.running = true;
  };

  Engine.Command = function(command, reference) {
    var helper, property, value;
    if (typeof command !== 'function') {
      helper = Engine.Helper(command);
      for (property in command) {
        value = command[property];
        helper[property] = value;
      }
      command = helper;
    }
    command.reference = reference;
    return command;
  };

  Engine.Helper = function(command, scoped) {
    var func;
    if (typeof command === 'function') {
      func = command;
    }
    return function(scope) {
      var args, context, fn, length, method;
      args = Array.prototype.slice.call(arguments, 0);
      length = arguments.length;
      if (scoped || command.serialized) {
        if (!(scope && scope.nodeType)) {
          scope = this.scope || document;
          if (typeof command[args.length] === 'string') {
            context = scope;
          } else {
            args.unshift(scope);
          }
        } else {
          if (typeof command[args.length - 1] === 'string') {
            context = scope = args.shift();
          }
        }
      }
      if (!(fn = func)) {
        if (typeof (method = command[args.length]) === 'function') {
          fn = method;
        } else {
          if (!(method && (fn = scope[method]))) {
            if (fn = this.commands[method]) {
              context = this;
            } else {
              fn = command.command;
            }
          }
        }
      }
      return fn.apply(context || this, args);
    };
  };

  return Engine;

})();

this.GSS = Engine;

module.exports = Engine;
