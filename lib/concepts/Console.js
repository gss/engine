var Console, method, _i, _len, _ref;

Console = (function() {
  function Console(level) {
    this.level = level;
  }

  Console.prototype.methods = ['log', 'warn', 'info', 'error', 'group', 'groupEnd', 'groupCollapsed', 'time', 'timeEnd', 'profile', 'profileEnd'];

  Console.prototype.groups = 0;

  Console.prototype.row = function(a, b, c) {
    var p1, p2;
    a = a.name || a;
    p1 = Array(5 - Math.floor(a.length / 4)).join('\t');
    if (typeof b === 'object') {
      return this.log('%c%s%s%O%c\t\t\t%s', 'color: #666', a, p1, b, 'color: #999', c || "");
    } else {
      p2 = Array(6 - Math.floor(String(b).length / 4)).join('\t');
      return this.log('%c%s%s%s%c%s%s', 'color: #666', a, p1, b, 'color: #999', p2, c || "");
    }
  };

  Console.time = function(other, time) {
    time || (time = (typeof performance !== "undefined" && performance !== null ? performance.now() : void 0) || (typeof Date.now === "function" ? Date.now() : void 0) || +(new Date));
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
        Console.prototype.groups--;
      }
      if (typeof document !== "undefined" && document !== null) {
        return typeof console !== "undefined" && console !== null ? typeof console[method] === "function" ? console[method].apply(console, arguments) : void 0 : void 0;
      }
    };
  })(method);
}

module.exports = Console;
