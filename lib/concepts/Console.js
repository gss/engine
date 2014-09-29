var Console, Native, method, _i, _len, _ref;

Native = require('../methods/Native');

Console = (function() {
  function Console(level) {
    var _ref, _ref1;
    this.level = level;
    if (this.level == null) {
      this.level = parseFloat((typeof self !== "undefined" && self !== null ? (_ref = self.location) != null ? (_ref1 = _ref.search.match(/log=\d/)) != null ? _ref1[0] : void 0 : void 0 : void 0) || 1);
    }
    if (!Console.bind) {
      this.level = 0;
    }
  }

  Console.prototype.methods = ['log', 'warn', 'info', 'error', 'group', 'groupEnd', 'groupCollapsed', 'time', 'timeEnd', 'profile', 'profileEnd'];

  Console.prototype.groups = 0;

  Console.prototype.stringify = function(obj) {
    if (!obj) {
      return '';
    }
    if (obj.push) {
      return obj.map(this.stringify, this);
    } else if (obj.nodeType) {
      return obj._gss_id;
    } else if (obj.toString !== Object.prototype.toString) {
      return obj.toString();
    } else {
      return JSON.stringify(obj);
    }
  };

  Console.prototype.debug = function(exp) {
    return document.location = document.location.toString().replace(/[&?]breakpoint=[^&]+|$/, ((document.location.search.indexOf('?') > -1) && '&' || '?') + 'breakpoint=' + exp.trim());
  };

  Console.prototype.breakpoint = decodeURIComponent(((typeof document !== "undefined" && document !== null ? document.location.search.match(/breakpoint=([^&]+)/, '') : void 0) || ['', ''])[1]);

  Console.prototype.row = function(a, b, c) {
    var breakpoint, p1, p2;
    if (!this.level) {
      return;
    }
    a = a.name || a;
    p1 = Array(5 - Math.floor(a.length / 4)).join('\t');
    if (typeof document !== "undefined" && document !== null) {
      breakpoint = String(this.stringify([b, c])).replace(/\r?\n+|\r|\s+/g, ' ');
      if (this.breakpoint === a + breakpoint) {
        debugger;
      }
    } else {
      breakpoint = '';
    }
    if (typeof c === 'string') {
      c = c.replace(/\r?\n|\r|\s+/g, ' ');
    }
    if (typeof document !== "undefined" && document !== null) {
      if (typeof b === 'object') {
        return this.log('%c%s%c%s%c%s%O%c\t\t\t%s', 'color: #666', a, 'font-size: 0;line-height:0;', breakpoint, '', p1, b, 'color: #999', c || "");
      } else {
        p2 = Array(6 - Math.floor(String(b).length / 4)).join('\t');
        return this.log('%c%s%s%s%c%s%s', 'color: #666', a, p1, b, 'color: #999', p2, c || "");
      }
    } else {
      return this.log(a, b, c);
    }
  };

  Console.prototype.start = function(reason, name) {
    var fmt, method, started;
    this.startTime = Native.prototype.time();
    this.started || (this.started = []);
    if (this.started.indexOf(name) > -1) {
      started = true;
    }
    this.started.push(name);
    if (started) {
      return;
    }
    fmt = '%c%s';
    fmt += Array(5 - Math.floor(String(name).length / 4)).join('\t');
    fmt += "%c";
    if (typeof reason !== 'string') {
      fmt += '%O';
    } else {
      fmt += '%s';
      method = 'groupCollapsed';
    }
    this[method || 'group'](fmt, 'font-weight: normal', name, 'color: #666; font-weight: normal', reason);
    return true;
  };

  Console.prototype.end = function(reason) {
    var popped, _ref;
    popped = (_ref = this.started) != null ? _ref.pop() : void 0;
    if (!popped || this.started.indexOf(popped) > -1) {
      return;
    }
    this.groupEnd();
    return this.endTime = Native.prototype.time();
  };

  return Console;

})();

_ref = Console.prototype.methods;
for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  method = _ref[_i];
  Console.prototype[method] = (function(method) {
    return function() {
      if (method === 'group' || method === 'groupCollapsed') {
        Console.prototype.groups++;
      } else if (method === 'groupEnd') {
        Console.prototype.groups--;
      }
      if (this.level || method === 'error') {
        return typeof console !== "undefined" && console !== null ? typeof console[method] === "function" ? console[method].apply(console, arguments) : void 0 : void 0;
      }
    };
  })(method);
}

module.exports = Console;
