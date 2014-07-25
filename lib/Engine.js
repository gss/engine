var Buffer, Engine, EventTrigger, include,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

include = function() {
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

EventTrigger = require('./concepts/EventTrigger');

Buffer = require('./concepts/Buffer');

Engine = (function(_super) {
  __extends(Engine, _super);

  Engine.prototype.Expressions = require('./input/Expressions');

  Engine.prototype.Values = require('./input/Values');

  Engine.prototype.Commands = require('./commands/Conventions');

  Engine.prototype.Property = require('./concepts/Property');

  Engine.prototype.Command = require('./concepts/Command');

  Engine.prototype.Helper = require('./concepts/Helper');

  Engine.prototype.Console = require('./concepts/Console');

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
      this.values = this.vars = new this.Values(this);
      this.events = {};
      this.input = this.expressions;
      this.engine = this;
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
    return Engine.__super__.push.apply(this, arguments);
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

  Engine.include = include;

  return Engine;

})(include(EventTrigger, Buffer));

this.GSS = Engine;

module.exports = Engine;
