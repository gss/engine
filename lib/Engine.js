var Engine;

Engine = (function() {
  Engine.prototype.Expressions = require('./input/Expressions.js');

  function Engine(scope) {
    var Document, engine, id;
    if (scope && scope.nodeType) {
      if (this.Expressions) {
        id = Engine.identify(scope);
        if (Document = Engine.Document) {
          if (!(this instanceof Document)) {
            return new Document(scope);
          }
        }
        Engine[id] = this;
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
    if (this.Expressions) {
      this.context = new this.Context(this);
      this.expressions = new this.Expressions(this);
      this.events = {};
      this.values = {};
      return;
    }
    return new (Engine.Document || Engine)(scope);
  }

  Engine.prototype.add = function() {
    return this.expressions.pull.apply(this.expressions, arguments);
  };

  Engine.prototype.pull = function() {
    return this.expressions.pull.apply(this.expressions, arguments);
  };

  Engine.prototype.push = function() {
    return this.output.pull.apply(this.output, arguments);
  };

  Engine.prototype.isCollection = function(object) {
    if (object && object.length !== void 0 && !object.substring && !object.nodeType) {
      switch (typeof object[0]) {
        case "object":
          return true;
        case "undefined":
          return object.length === 0;
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

  Engine.prototype.handleEvent = function(e) {
    return this.triggerEvent(e.type, e);
  };

  Engine.prototype.merge = function(object) {
    var prop, value, _results;
    _results = [];
    for (prop in object) {
      value = object[prop];
      if (value != null) {
        _results.push(this.values[prop] = value);
      } else {
        _results.push(delete this.values[prop]);
      }
    }
    return _results;
  };

  Engine.prototype.destroy = function() {
    return Engine[this.scope._gss_id] = void 0;
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

  Engine.prototype.getPath = function(path, value) {
    if (typeof value === 'string') {
      return value;
    }
    return path + this.identify(value);
  };

  Engine.get = function(path) {
    return Engine.prototype[path];
  };

  Engine.prototype.get = function(path) {
    return this[path];
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
      Engine.prototype[id] = object;
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

  return Engine;

})();

window.GSS = Engine;

module.exports = Engine;
