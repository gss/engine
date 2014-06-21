var Engine, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Engine = require('./Engine.js');

Engine.Solver = (function(_super) {
  __extends(Solver, _super);

  Solver.prototype.Solutions = require('./output/Solutions.js');

  Solver.prototype.Context = Engine.include(require('./context/Properties.js'), require('./context/Constraints.js'));

  function Solver(input, output, url) {
    this.input = input;
    this.output = output;
    Solver.__super__.constructor.call(this);
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
    if (!(typeof url === 'string' && __indexOf.call(self, "onmessage") >= 0)) {
      return;
    }
    this.worker = new this.getWorker(url);
    this.worker.addEventListener(this);
    this.pull = this.worker.postMessage.bind(this.worker);
    return this.worker;
  };

  Solver.prototype.getWorker = function(url) {
    return new Worker(url);
  };

  return Solver;

})(Engine);

Engine.Thread = (function(_super) {
  __extends(Thread, _super);

  function Thread() {
    _ref = Thread.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Thread.prototype.push = function(data) {
    return self.postMessage(data);
  };

  Thread.handleEvent = function(e) {
    this.instance || (this.instance = new Engine.Thread);
    return this.instance.pull(e.data);
  };

  return Thread;

})(Engine.Solver);

if (self.window && self.window.document === void 0 && __indexOf.call(self, "onmessage") >= 0) {
  self.addEventListener('message', Thread);
}

module.exports = Engine.Solver;
