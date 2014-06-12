var Engine, Pipe,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Pipe = (function() {
  function Pipe(input, output) {
    this.input = input;
    this.output = output;
  }

  Pipe.prototype.pipe = function(pipe) {
    return this.output = pipe;
  };

  Pipe.prototype.read = function() {
    if (this.input) {
      if (this.input.write) {
        return this.input.write.apply(this.input, arguments);
      } else {
        return this.input.apply(this, arguments);
      }
    }
  };

  Pipe.prototype.write = function() {
    if (this.output.read) {
      return this.output.read.apply(this.output, arguments);
    } else {
      return this.output.apply(this, arguments);
    }
  };

  return Pipe;

})();

Engine = (function(_super) {
  __extends(Engine, _super);

  Engine.prototype.Expressions = require('./input/Expressions.js');

  Engine.prototype.References = require('./context/References.js');

  function Engine(scope) {
    var engine, id;
    if (scope && scope.nodeType) {
      if (!this.References) {
        while (scope) {
          if (id = Document.prototype.References.get(scope)) {
            if (engine = Engine[id]) {
              return engine;
            }
          }
          if (!scope.parentNode) {
            break;
          }
          scope = scope.parentNode;
        }
        return new Document(scope);
      }
      id = this.References.get(scope, true);
      if (engine = Engine[id]) {
        return engine;
      }
      Engine[id] = this;
      this.scope = scope;
    }
    if (this.References) {
      this.expressions = new this.Expressions(this);
      this.references = new this.References(this);
      return;
    } else {
      return new arguments.callee(scope);
    }
  }

  Engine.prototype.isCollection = function(object) {
    if (typeof object === 'object' && object.length !== void 0) {
      if (!(typeof object[0] === 'string' && !this.context[object[0]])) {
        return true;
      }
    }
  };

  Engine.prototype.clean = function() {
    return this.context.clean.apply(this.context, arguments);
  };

  Engine.prototype.read = function() {
    return this.expressions.evaluate.apply(this.expressions, arguments);
  };

  Engine.prototype.set = function() {
    return this.references.set.apply(this.references, arguments);
  };

  Engine.prototype.add = function() {
    return this.references.add.apply(this.references, arguments);
  };

  Engine.prototype.remove = function() {
    return this.references.remove.apply(this.references, arguments);
  };

  Engine.prototype.handleEvent = function(e) {
    var method;
    method = 'on' + e.type;
    if (__indexOf.call(this, method) >= 0) {
      return this[method](e);
    }
  };

  return Engine;

})(Pipe);

Engine.Pipe = Pipe;

module.exports = Engine;
