var Engine,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Engine = require('./Engine');

Engine.Thread = (function(_super) {
  __extends(Thread, _super);

  Thread.prototype.Spaces = {
    Linear: require('./constraints/Linear'),
    Finite: require('./constraints/Finite')
  };

  function Thread(input, output, url) {
    var context;
    this.input = input;
    this.output = output;
    if (context = Thread.__super__.constructor.call(this)) {
      return context;
    }
    if (!this.useWorker(url)) {
      this.linear = new this.Linear(this);
      this.finite = new this.Finite(this);
    }
  }

  Thread.prototype.events = {
    message: function(e) {
      return this.provide(e.data);
    },
    error: function(e) {
      throw new Error("" + e.message + " (" + e.filename + ":" + e.lineno + ")");
    }
  };

  Thread.prototype.useWorker = function(url) {
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

  Thread.prototype.getWorker = function(url) {
    return new Worker(url);
  };

  Thread.prototype.getPath = function(scope, property) {
    if (!(scope && property)) {
      return scope || property;
    }
    return (scope || '') + '[' + (property || '') + ']';
  };

  return Thread;

})(Engine);

Engine.Worker = (function(_super) {
  __extends(Worker, _super);

  function Worker() {
    var context;
    if ((context = Worker.__super__.constructor.call(this)) && context !== this) {
      return context;
    }
    this.provide = function(data) {
      return self.postMessage(data);
    };
  }

  Worker.handleEvent = function(e) {
    this.instance || (this.instance = new Engine.Thread);
    return this.instance.solve(e.data);
  };

  return Worker;

})(Engine.Thread);

if (!self.window && self.onmessage !== void 0) {
  self.addEventListener('message', function(e) {
    return Engine.Worker.handleEvent(e);
  });
}

module.exports = Engine.Thread;
