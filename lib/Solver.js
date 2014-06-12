var Engine, Solver, Thread, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Engine = require('./Engine.js');

Solver = (function(_super) {
  __extends(Solver, _super);

  Solver.prototype.Constraints = require('./output/constraints.js');

  function Solver(input, output, url) {
    this.input = input;
    this.output = output;
    Solver.__super__.constructor.call(this);
    if (typeof url === 'url' && __indexOf.call(self, "onmessage") >= 0) {
      this.worker = new this.Worker(url);
      this.read = this.worker.postMessage.bind(this.worker);
    } else {
      this.constraints = new this.Constraints(this);
      this.context = this.constraints;
      this.expressions.pipe(this.constraints);
    }
  }

  Solver.prototype.onmessage = function(e) {
    return this.write(e.data);
  };

  Solver.prototype.onerror = function(e) {
    throw new Error("" + e.message + " (" + e.filename + ":" + e.lineno + ")");
  };

  Solver.prototype.Worker = function(url) {
    var worker;
    worker = new Worker(url);
    worker.addEventListener(this);
    return worker;
  };

  return Solver;

})(Engine);

Thread = (function(_super) {
  __extends(Thread, _super);

  function Thread() {
    _ref = Thread.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Thread.prototype.write = function(data) {
    return self.postMessage(data);
  };

  Thread.handleEvent = function(e) {
    this.instance || (this.instance = new this(e.data.config));
    return this.instance.read(e);
  };

  return Thread;

})(Solver);

if (self.window && self.window.document === void 0 && __indexOf.call(self, "onmessage") >= 0) {
  self.addEventListener('message', Thread);
}

Engine.Solver = Solver;

module.exports = Solver;
