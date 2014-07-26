var Buffer;

Buffer = (function() {
  function Buffer() {}

  Buffer.prototype.push = function() {
    var output;
    if (output = this.output) {
      return output.pull.apply(output, arguments);
    }
  };

  Buffer.prototype.pull = function() {
    var captured, input, pulled;
    if (this.puller || (input = this.input)) {
      captured = this.capture(arguments[0]);
      if (input.pull) {
        pulled = input.pull.apply(input, arguments);
      } else {
        pulled = this[input].apply(this, arguments);
      }
      if (captured) {
        this.release();
      }
      return pulled;
    }
  };

  Buffer.prototype.flush = function() {
    var input;
    if (input = this.input) {
      return input.flush.apply(input, arguments);
    }
  };

  Buffer.prototype.run = function() {
    return this.pull.apply(this, arguments);
  };

  Buffer.prototype.release = function() {
    var _ref;
    if ((_ref = this.capturer) != null) {
      _ref.onRelease();
    }
    this.endTime = this.engine.time();
    this.flush();
    return this.endTime;
  };

  Buffer.prototype.capture = function(reason) {
    var fmt, method, name, result, _ref;
    if (this.buffer === void 0) {
      if (this instanceof GSS) {
        debugger;
      }
      if ((_ref = this.capturer) != null) {
        _ref.onCapture();
      }
      this.buffer = null;
      this.engine.start();
      fmt = '%c%s%c';
      if (typeof reason !== 'string') {
        if (reason != null ? reason.slice : void 0) {
          reason = this.engine.clone(reason);
        }
        fmt += '\t\t%O';
      } else {
        fmt += '\t%s';
      }
      if (this.engine.onDOMContentLoaded) {
        name = 'GSS.Document';
      } else {
        name = 'GSS.Solver';
        method = 'groupCollapsed';
      }
      this.engine.console[method || 'group'](fmt, 'font-weight: normal', name, 'color: #666; font-weight: normal', reason);
      this.startTime = this.engine.time();
    }
    if (arguments.length > 1) {
      result = this.pull.apply(this, Array.prototype.slice.call(arguments, 1));
      if (name) {
        this.release();
      }
      return result;
    }
    return !!name;
  };

  Buffer.prototype.defer = function(reason) {
    var _this = this;
    if (this.capture.apply(this, arguments)) {
      return this.deferred != null ? this.deferred : this.deferred = this.setImmediate(function() {
        _this.deferred = void 0;
        return _this.flush();
      }, 0);
    }
  };

  Buffer.prototype.setImmediate = typeof setImmediate !== "undefined" && setImmediate !== null ? setImmediate : setTimeout;

  return Buffer;

})();

module.exports = Buffer;
