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
    this.stack = [];
    this.buffer = [];
  }

  Console.prototype.methods = ['log', 'warn', 'info', 'error', 'group', 'groupEnd', 'groupCollapsed', 'time', 'timeEnd', 'profile', 'profileEnd'];

  Console.prototype.groups = 0;

  Console.prototype.compile = function(engine) {
    return this.DESCEND = engine.Command.prototype.DESCEND;
  };

  Console.prototype.push = function(a, b, c, type) {
    var index;
    if (this.level > 0.5 || type) {
      if (!this.buffer.length) {
        if (this.level > 1) {
          console.profile();
        }
      }
      index = this.buffer.push(a, b, c, void 0, type || this.row);
      return this.stack.push(index - 5);
    }
  };

  Console.prototype.pop = function(d, type, update) {
    var index;
    if (type == null) {
      type = this.row;
    }
    if (this.level > 0.5 || type !== this.row) {
      index = this.stack.pop();
      this.buffer[index + 3] = d;
      if (type !== this.row) {
        this.buffer[index + 2] = this.getTime(this.buffer[index + 2]);
      }
      if (!this.stack.length) {
        this.flush();
      }
    }
  };

  Console.prototype.flush = function() {
    var index, item, _i, _len, _ref;
    _ref = this.buffer;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = _i += 5) {
      item = _ref[index];
      this.buffer[index + 4].call(this, this.buffer[index], this.buffer[index + 1], this.buffer[index + 2], this.buffer[index + 3]);
    }
    this.buffer = [];
    if (this.level > 1) {
      return console.profileEnd();
    }
  };

  Console.prototype.openGroup = function(name, reason, time, result) {
    var fmt, method;
    fmt = '%c%s%O \t  ';
    if (typeof reason !== 'string') {
      fmt += '%O';
    } else {
      fmt += '%s';
    }
    fmt += ' \t  %c%sms';
    while (name.length < 13) {
      name += ' ';
    }
    if (this.level <= 1.5) {
      method = 'groupCollapsed';
    }
    return this[method || 'group'](fmt, 'font-weight: normal', name, reason, result, 'color: #999; font-weight: normal; font-style: italic;', time);
  };

  Console.prototype.closeGroup = function() {
    return this.groupEnd();
  };

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

  Console.prototype.row = function(a, b, c, d) {
    var breakpoint, index, p1, p2;
    if (this.level < 1) {
      return;
    }
    a = a.name || a;
    if (typeof a !== 'string') {
      return;
    }
    p1 = Array(4 - Math.floor((a.length + 1) / 4)).join('\t');
    if (this.breakpoint && (typeof document !== "undefined" && document !== null)) {
      breakpoint = String(this.stringify([b, c])).trim().replace(/\r?\n+|\r|\s+/g, ' ');
    } else {
      breakpoint = '';
    }
    if (typeof c === 'string') {
      if ((index = c.indexOf(this.DESCEND)) > -1) {
        if (c.indexOf('style[type*="gss"]') > -1) {
          c = c.substring(index);
        }
      }
      c = c.replace(/\r?\n|\r|\s+/g, ' ');
    }
    if (d) {
      if (!(d instanceof Array)) {
        d = [d];
      }
    } else {
      d = [];
    }
    if (typeof document !== "undefined" && document !== null) {
      if (typeof b === 'object') {
        return this.log('%c%s%c%s%c%s%O\t\t%O%c\t\t%s', 'color: #666', a, 'font-size: 0;line-height:0;', breakpoint, '', p1, b, d, 'color: #999', c || "");
      } else {
        p2 = Array(6 - Math.floor(String(b).length / 4)).join('\t');
        return this.log('%c%s%s%s%c%s%s', 'color: #666', a, p1, b, 'color: #999', p2, c || "");
      }
    } else {
      return this.log(a, b, c);
    }
  };

  Console.prototype.start = function(reason, name) {
    return this.push(reason, name, this.getTime(), this.openGroup);
  };

  Console.prototype.end = function(result) {
    this.buffer.push(void 0, void 0, void 0, void 0, this.closeGroup);
    return this.pop(result, this.openGroup, true);
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
