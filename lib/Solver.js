var Engine,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Engine = require('./Engine');

Engine.Solver = (function(_super) {
  __extends(Solver, _super);

  Solver.prototype.Solutions = require('./output/Solutions');

  Solver.prototype.Commands = Engine.include(Engine.prototype.Commands, require('./commands/Constraints'));

  Solver.prototype.Properties = require('./properties/Equasions');

  function Solver(input, output, url) {
    var context;
    this.input = input;
    this.output = output;
    if (context = Solver.__super__.constructor.call(this)) {
      return context;
    }
    if (!this.useWorker(url)) {
      this.solutions = new this.Solutions(this, this.output);
      this.expressions.output = this.solutions;
    }
  }

  Solver.prototype.remove = function(id) {
    return this.solutions.remove(id);
  };

  Solver.prototype.onmessage = function(e) {
    return this.push(e.data);
  };

  Solver.prototype.onerror = function(e) {
    throw new Error("" + e.message + " (" + e.filename + ":" + e.lineno + ")");
  };

  Solver.prototype.useWorker = function(url) {
    var _this = this;
    if (!(typeof url === 'string' && self.onmessage !== void 0)) {
      return;
    }
    this.worker = new this.getWorker(url);
    this.worker.addEventListener('message', this.onmessage.bind(this));
    this.worker.addEventListener('error', this.onerror.bind(this));
    this.pull = this.run = function() {
      return _this.worker.postMessage.apply(_this.worker, arguments);
    };
    return this.worker;
  };

  Solver.prototype.getWorker = function(url) {
    return new Worker(url);
  };

  Solver.prototype.getPath = function(scope, property) {
    if (!(scope && property)) {
      return scope || property;
    }
    return (scope || '') + '[' + (property || '') + ']';
  };

  return Solver;

})(Engine);

Engine.Thread = (function(_super) {
  __extends(Thread, _super);

  function Thread() {
    var context;
    if ((context = Thread.__super__.constructor.call(this)) && context !== this) {
      return context;
    }
    this.solutions.push = function(data) {
      return self.postMessage(data);
    };
  }

  Thread.handleEvent = function(e) {
    this.instance || (this.instance = new Engine.Thread);
    return this.instance.pull(e.data);
  };

  return Thread;

})(Engine.Solver);

if (!self.window && self.onmessage !== void 0) {
  self.addEventListener('message', function(e) {
    return Engine.Thread.handleEvent(e);
  });
}

module.exports = Engine.Solver;
