(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Console;

Console = require('../src/utilities/Console');

if (typeof GSS !== "undefined" && GSS !== null ? GSS.Engine : void 0) {
  GSS.Engine.prototype.Console = Console;
}



},{"../src/utilities/Console":2}],2:[function(require,module,exports){
var Console, method, _i, _len, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Console = (function() {
  function Console(_at_level) {
    var _ref, _ref1, _ref2;
    this.level = _at_level;
    this.onError = __bind(this.onError, this);
    if (this.level == null) {
      this.level = (_ref = typeof self !== "undefined" && self !== null ? self.GSS_LOG : void 0) != null ? _ref : parseFloat((typeof self !== "undefined" && self !== null ? (_ref1 = self.location) != null ? (_ref2 = _ref1.search.match(/log=([\d.]+)/)) != null ? _ref2[1] : void 0 : void 0 : void 0) || 0);
    }
    if (!Console.bind) {
      this.level = 0;
    }
    this.stack = [];
    this.buffer = [];
    if (typeof self !== "undefined" && self !== null) {
      self.addEventListener('error', this.onError, true);
    }
  }

  Console.prototype.methods = ['log', 'warn', 'info', 'error', 'group', 'groupEnd', 'groupCollapsed', 'time', 'timeEnd', 'profile', 'profileEnd'];

  Console.prototype.groups = 0;

  Console.prototype.onError = function(e) {
    var _results;
    _results = [];
    while (this.pop(e)) {
      _results.push(true);
    }
    return _results;
  };

  Console.prototype.push = function(a, b, c, type) {
    var index;
    if (this.level >= 0.5 || type) {
      if (!this.buffer.length) {
        if (this.level > 1) {
          if (typeof console !== "undefined" && console !== null) {
            console.profile();
          }
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
    if ((this.level >= 0.5 || type !== this.row) && this.stack.length) {
      index = this.stack.pop();
      this.buffer[index + 3] = d;
      if (type !== this.row) {
        this.buffer[index + 2] = this.getTime(this.buffer[index + 2]);
      }
      if (!this.stack.length) {
        this.flush();
      }
      return true;
    }
    return false;
  };

  Console.prototype.flush = function() {
    var index, item, _i, _len, _ref;
    if (this.level > 1) {
      if (typeof console !== "undefined" && console !== null) {
        console.profileEnd();
      }
    }
    _ref = this.buffer;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = _i += 5) {
      item = _ref[index];
      this.buffer[index + 4].call(this, this.buffer[index], this.buffer[index + 1], this.buffer[index + 2], this.buffer[index + 3]);
    }
    return this.buffer = [];
  };

  Console.prototype.pad = function(object, length) {
    if (length == null) {
      length = 17;
    }
    if (object.length > length) {
      return object.substring(0, length - 1) + '…';
    } else {
      return object + Array(length - object.length).join(' ');
    }
  };

  Console.prototype.openGroup = function(name, reason, time, result) {
    var fmt, method;
    if (reason == null) {
      reason = '';
    }
    if (result == null) {
      result = '';
    }
    if (this.level < 0.5) {
      return;
    }
    fmt = '%c%s';
    switch (typeof reason) {
      case 'string':
        fmt += '%s';
        reason = this.pad(reason, 16);
        break;
      case 'object':
        fmt += '%O\t';
        if (reason.length == null) {
          fmt += '\t';
        }
    }
    switch (typeof result) {
      case 'string':
        fmt += '%s';
        result = this.pad(result, 17);
        break;
      case 'object':
        fmt += '%O\t';
        if (!(result.length > 9)) {
          fmt += '\t';
        }
    }
    fmt += ' %c%sms';
    name = this.pad(name, 13);
    if (this.level <= 1.5) {
      method = 'groupCollapsed';
    }
    return this[method || 'group'](fmt, 'font-weight: normal', name, reason, result, 'color: #999; font-weight: normal; font-style: italic;', time);
  };

  Console.prototype.closeGroup = function() {
    if (this.level >= 0.5) {
      return this.groupEnd();
    }
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
    var fmt, index, p1, _ref;
    if (b == null) {
      b = '';
    }
    if (c == null) {
      c = '';
    }
    if (d == null) {
      d = '';
    }
    if (this.level < 1) {
      return;
    }
    a = a.name || a;
    if (typeof a !== 'string') {
      return;
    }
    p1 = Array(4 - Math.floor((a.length + 1) / 4)).join('\t');
    if ((index = c.indexOf((_ref = self.GSS) != null ? _ref.Engine.prototype.Command.prototype.DESCEND : void 0)) > -1) {
      if (c.indexOf('style[type*="gss"]') > -1) {
        c = c.substring(index + 1);
      }
    }
    c = c.replace(/\r?\n|\r|\s+/g, ' ');
    fmt = '%c%s';
    switch (typeof b) {
      case 'string':
        fmt += '%s';
        b = this.pad(b, 14);
        break;
      case 'object':
        fmt += '%O\t';
        if (!b.push) {
          b = [b];
        }
    }
    switch (typeof d) {
      case 'string':
      case 'boolean':
      case 'number':
        fmt += '  %s ';
        d = this.pad(String(d), 17);
        break;
      case 'object':
        fmt += '  %O\t   ';
        if (d.item) {
          d = Array.prototype.slice.call(d);
        } else if (d.length == null) {
          d = [d];
        }
    }
    if (typeof document !== "undefined" && document !== null) {
      return this.log(fmt + '%c%s', 'color: #666', this.pad(a, 11), b, d, 'color: #999', c);
    } else {
      return this.log(a, b, c);
    }
  };

  Console.prototype.start = function(reason, name) {
    if (this.level) {
      return this.push(reason, name, this.getTime(), this.openGroup);
    }
  };

  Console.prototype.end = function(result) {
    if (this.level) {
      this.buffer.push(void 0, void 0, void 0, void 0, this.closeGroup);
      return this.pop(result, this.openGroup, true);
    }
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
        if (this.level > 0.5 || method === 'warn') {
          return typeof console !== "undefined" && console !== null ? typeof console[method] === "function" ? console[method].apply(console, arguments) : void 0 : void 0;
        }
      }
    };
  })(method);
}

module.exports = Console;



},{}]},{},[1]);
