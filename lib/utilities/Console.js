var Console, method, _i, _len, _ref;

Console = (function() {
  function Console(level) {
    var _ref, _ref1, _ref2;
    this.level = level;
    if (this.level == null) {
      this.level = (_ref = self.GSS_LOG) != null ? _ref : parseFloat((typeof self !== "undefined" && self !== null ? (_ref1 = self.location) != null ? (_ref2 = _ref1.search.match(/log=([\d.]+)/)) != null ? _ref2[1] : void 0 : void 0 : void 0) || 0);
    }
    if (!Console.bind) {
      this.level = 0;
    }
  }

  Console.prototype.methods = ['log', 'warn', 'info', 'error', 'group', 'groupEnd', 'groupCollapsed', 'time', 'timeEnd', 'profile', 'profileEnd'];

  Console.prototype.groups = 0;

  Console.prototype.compile = function(engine) {};

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
    } else if (obj.displayName) {
      return obj.displayName;
    } else {
      return JSON.stringify(obj);
    }
  };

  Console.prototype.debug = function(exp) {
    return document.location = document.location.toString().replace(/[&?]breakpoint=[^&]+|$/, ((document.location.search.indexOf('?') > -1) && '&' || '?') + 'breakpoint=' + exp.trim().replace(/\r?\n+|\r|\s+/g, ' '));
  };

  Console.prototype.breakpoint = decodeURIComponent(((typeof document !== "undefined" && document !== null ? document.location.search.match(/breakpoint=([^&]+)/, '') : void 0) || ['', ''])[1]);

  Console.prototype.row = function(a, b, c) {
    var breakpoint, p1, p2;
    if (this.level < 1) {
      return;
    }
    a = a.name || a;
    if (typeof a !== 'string') {
      return;
    }
    p1 = Array(5 - Math.floor(a.length / 4)).join('\t');
    if (this.breakpoint && (typeof document !== "undefined" && document !== null)) {
      breakpoint = String(this.stringify([b, c])).trim().replace(/\r?\n+|\r|\s+/g, ' ');
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
    this.startTime = this.getTime();
    this.started || (this.started = []);
    if (this.started.indexOf(name) > -1) {
      started = true;
    }
    this.started.push(name);
    if (started) {
      return;
    }
    if (this.level < 1) {
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
    this.endTime = this.getTime();
    if (this.level < 1) {
      return;
    }
    return this.groupEnd();
  };

  Console.prototype.getTime = function(other, time) {
    time || (time = (typeof performance !== "undefined" && performance !== null ? typeof performance.now === "function" ? performance.now() : void 0 : void 0) || (typeof Date.now === "function" ? Date.now() : void 0) || +(new Date));
    if (time && !other) {
      return time;
    }
    return Math.floor((time - other) * 100) / 100;
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
        if (!Console.prototype.groups) {
          return;
        }
        Console.prototype.groups--;
      }
      if (this.level || method === 'error') {
        return typeof console !== "undefined" && console !== null ? typeof console[method] === "function" ? console[method].apply(console, arguments) : void 0 : void 0;
      }
    };
  })(method);
}

module.exports = Console;
