// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

(function(global) {
  if (typeof global.console != "undefined") {
    return;
  }

  var toString = function(item) {
    var t = (typeof item);
    if (t == "undefined") {
      return "undefined";
    } else if (t == "string") {
      return item;
    } else if (t == "number") {
      return item + "";
    } else if (item instanceof Array) {
      return item + "";
    }
    return item + "";
  }

  // A minimal console
  var log = function(hint, args){
    var r = "";
    var al = args.length;
    r += ((hint ? hint + ":" : "") + (args[0] ? toString(args[0]) : ""));
    for(var i = 1; i < al; i++){
      r += (" " + toString(args[i]));
    }
    print(r);
  };

  var makeLogger = function(hint) {
    return function() {
      log(hint, Array.prototype.slice.call(arguments, 0));
    };
  }

  // Intentionally define console in the global namespace
  global.console = {
    log:        makeLogger(""),
    error:      makeLogger("ERROR"),
    warn:       makeLogger("WARN"),
    trace:      makeLogger("TRACE"),
    time:       function() {},
    timeEnd:    function() {},
    profile:    function() {},
    profileEnd: function() {},
  };

})(this);