var Conventions;

Conventions = (function() {
  function Conventions() {}

  Conventions.prototype.ASCEND = String.fromCharCode(8593);

  Conventions.prototype.PAIR = String.fromCharCode(8594);

  Conventions.prototype.DESCEND = String.fromCharCode(8595);

  /* 
    <!-- Example of document -->
    <style id="my-stylesheet">
      (h1 !+ img)[width] == #header[width]
    </style>
    <header id="header">
      <img>
      <h1 id="h1"></h1>
    </header>
  
    <!-- Generated constraint key -->
    style$my-stylesheet   # my stylesheet
               ↓ h1$h1    # found heading
               ↑ !+img    # preceeded by image
               → #header  # bound to header element
  */


  Conventions.prototype.getContinuation = function(path, value, suffix) {
    if (suffix == null) {
      suffix = '';
    }
    if (path) {
      path = path.replace(this.TrimContinuationRegExp, '');
    }
    if (!path && !value) {
      return '';
    }
    return path + (value && this.identity.provide(value) || '') + suffix;
  };

  Conventions.prototype.TrimContinuationRegExp = new RegExp("[" + Conventions.prototype.ASCEND + Conventions.prototype.DESCEND + Conventions.prototype.PAIR + "]$");

  Conventions.prototype.getPossibleContinuations = function(path) {
    return [path, path + this.ASCEND, path + this.PAIR, path + this.DESCEND];
  };

  Conventions.prototype.isCollection = function(object) {
    if (object && object.length !== void 0 && !object.substring && !object.nodeType) {
      if (object.isCollection) {
        return true;
      }
      switch (typeof object[0]) {
        case "object":
          return object[0].nodeType;
        case "undefined":
          return object.length === 0;
      }
    }
  };

  Conventions.prototype.getCanonicalPath = function(continuation, compact) {
    var bits, last;
    bits = this.getContinuation(continuation).split(this.DESCEND);
    last = bits[bits.length - 1];
    last = bits[bits.length - 1] = last.replace(this.CanonicalizeRegExp, '$1');
    if (compact) {
      return last;
    }
    return bits.join(this.DESCEND);
  };

  Conventions.prototype.CanonicalizeRegExp = new RegExp("" + "([^" + Conventions.prototype.PAIR + "])" + "\\$[^" + Conventions.prototype.ASCEND + "]+" + "(?:" + Conventions.prototype.ASCEND + "|$)", "g");

  Conventions.prototype.getCanonicalSelector = function(selector) {
    selector = selector.trim();
    selector = selector.replace(this.CanonicalizeSelectorRegExp, ' ').replace(/\s+/g, this.engine.DESCEND).replace(this.CleanupSelectorRegExp, '');
    return selector;
  };

  Conventions.prototype.CanonicalizeSelectorRegExp = new RegExp("" + "[$][a-z0-9]+[" + Conventions.prototype.DESCEND + "]\s*", "gi");

  Conventions.prototype.getScopePath = function(scope, continuation) {
    var bits, id, index, last, path, prev;
    if (!continuation) {
      return '';
    }
    bits = continuation.split(this.DESCEND);
    if (scope && this.scope !== scope) {
      id = this.identity.provide(scope);
      prev = bits[bits.length - 2];
      if (prev && prev.substring(prev.length - id.length) !== id) {
        last = bits[bits.length - 1];
        if ((index = last.indexOf(id + this.ASCEND)) > -1) {
          bits.splice(bits.length - 1, 0, last.substring(0, index + id.length));
        }
      }
    }
    bits[bits.length - 1] = "";
    path = bits.join(this.DESCEND);
    if (continuation.charAt(0) === this.PAIR) {
      path = this.PAIR + path;
    }
    return path;
  };

  Conventions.prototype.getAscendingContinuation = function(continuation, item) {
    return this.engine.getContinuation(continuation, item, this.engine.ASCEND);
  };

  Conventions.prototype.getDescendingContinuation = function(operation, continuation, ascender) {
    var mark;
    if (ascender != null) {
      mark = operation.def.rule && ascender === 1 && this.engine.DESCEND || this.engine.PAIR;
      if (mark) {
        return this.engine.getContinuation(continuation, null, mark);
      } else {
        return continuation;
      }
    }
  };

  Conventions.prototype.getContext = function(args, operation, scope, node) {
    var index, _ref;
    index = args[0].def && 4 || 0;
    if (args.length !== index && ((_ref = args[index]) != null ? _ref.nodeType : void 0)) {
      return args[index];
    }
    if (!operation.bound) {
      if (operation.def.serialized && operation[1].def && (args[index] != null)) {
        return args[index];
      }
      return this.scope;
    }
    return scope;
  };

  Conventions.prototype.getIntrinsicProperty = function(path) {
    var index, last, property;
    index = path.indexOf('intrinsic-');
    if (index > -1) {
      if ((last = path.indexOf(']', index)) === -1) {
        last = void 0;
      }
      return property = path.substring(index + 10, last);
    }
  };

  Conventions.prototype.isPrimitive = function(object) {
    if (typeof object === 'object') {
      return object.valueOf !== Object.prototype.valueOf;
    }
    return true;
  };

  Conventions.prototype.getWorkerURL = (function() {
    var scripts, src, _ref;
    if (typeof document !== "undefined" && document !== null) {
      scripts = document.getElementsByTagName('script');
      src = scripts[scripts.length - 1].src;
      if (((_ref = location.search) != null ? _ref.indexOf('log=0') : void 0) > -1) {
        src += ((src.indexOf('?') > -1) && '&' || '?') + 'log=0';
      }
    }
    return function(url) {
      return typeof url === 'string' && url || src;
    };
  })();

  return Conventions;

})();

this.require || (this.require = function(string) {
  var bits;
  if (string === 'cassowary') {
    return c;
  }
  bits = string.replace('', '').split('/');
  return this[bits[bits.length - 1]];
});

this.module || (this.module = {});

module.exports = Conventions;
