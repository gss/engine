var Engine, EventTrigger,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

this.require || (this.require = function(string) {
  var bits;
  if (string === 'cassowary') {
    return c;
  }
  bits = string.replace('.js', '').split('/');
  return this[bits[bits.length - 1]];
});

EventTrigger = require('./concepts/EventTrigger');

Engine = (function(_super) {
  __extends(Engine, _super);

  Engine.prototype.Expressions = require('./input/Expressions.js');

  Engine.prototype.Values = require('./input/Values.js');

  Engine.prototype.Commands = require('./commands/Conventions.js');

  Engine.prototype.Property = require('./concepts/Property.js');

  Engine.prototype.Command = require('./concepts/Command.js');

  Engine.prototype.Helper = require('./concepts/Helper.js');

  Engine.prototype.Console = require('./concepts/Console.js');

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
      this.values = new this.Values(this);
      this.events = {};
      return;
    }
    return new (Engine.Document || Engine)(scope, url);
  }

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
    this.values.merge(data);
    this.triggerEvent('solved', data);
    if (this.scope) {
      this.dispatchEvent(this.scope, 'solved', data);
    }
    if (this.output) {
      return this.output.pull.apply(this.output, arguments);
    }
  };

  Engine.prototype.run = function() {
    return this.expressions.pull.apply(this.expressions, arguments);
  };

  Engine.prototype.pull = function() {
    return this.expressions.pull.apply(this.expressions, arguments);
  };

  Engine.prototype.defer = function() {
    var _base;
    if (this.deferred == null) {
      (_base = this.expressions).buffer || (_base.buffer = null);
      this.deferred = (window.setImmediate || window.setTimeout)(this.expressions.flush.bind(this.expressions), 0);
    }
    return this.run.apply(this, arguments);
  };

  Engine.prototype.destroy = function() {
    if (this.scope) {
      return Engine[this.scope._gss_id] = void 0;
    }
  };

  Engine.identify = function(object, generate) {
    var id;
    if (!(id = object._gss_id)) {
      if (object === document) {
        id = "::document";
      } else if (object === window) {
        id = "::window";
      }
      if (generate !== false) {
        object._gss_id = id || (id = "$" + (object.id || ++Engine.uid));
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

  Engine.prototype.start = function() {
    if (this.running) {
      return;
    }
    if (this.constructor.prototype.running === void 0) {
      this.constructor.prototype.running = null;
      this.constructor.prototype.compile();
    }
    this.compile();
    return this.running = true;
  };

  Engine.prototype.compile = function() {
    var command, commands, key, prop, properties, property, subkey, _name, _name1;
    commands = this.commands || this.Commands.prototype;
    commands.engine || (commands.engine = this);
    for (key in commands) {
      command = commands[key];
      if (command === this || !commands.hasOwnProperty(key)) {
        continue;
      }
      if (key.charAt(0) !== '_') {
        subkey = '_' + key;
        command = this.Command(command, subkey);
        if (this[subkey] == null) {
          this[subkey] = command;
        }
      }
      if (this[key] == null) {
        this[key] = command;
      }
    }
    properties = this.properties || this.Properties.prototype;
    properties.engine || (properties.engine = this);
    for (key in properties) {
      property = properties[key];
      if (property === this || !properties.hasOwnProperty(key)) {
        continue;
      }
      prop = this.Property(property, key, properties);
      if (this[_name = '_' + key] == null) {
        this[_name] = prop;
      }
    }
    for (key in properties) {
      property = properties[key];
      if (this[_name1 = '_' + key] == null) {
        this[_name1] = property;
      }
    }
    return this;
  };

  Engine.prototype.console = Engine.console = new Engine.prototype.Console;

  Engine.prototype.time = Engine.time = Engine.prototype.Console.time;

  Engine.prototype.clone = Engine.clone = function(object) {
    if (object && object.map) {
      return object.map(this.clone, this);
    }
    return object;
  };

  return Engine;

})(EventTrigger);

this.GSS = Engine;

module.exports = Engine;
