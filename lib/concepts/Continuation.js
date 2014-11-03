var Continuation, property, value, _ref;

Continuation = (function() {
  function Continuation() {}

  Continuation["new"] = function(engine) {
    var Kontinuation, property, value, _ref;
    Kontinuation = function(path, value, suffix) {
      if (suffix == null) {
        suffix = '';
      }
      if (path) {
        path = path.replace(Kontinuation.TrimContinuationRegExp, '');
      }
      if (!path && !value) {
        return '';
      }
      return path + (value && engine.identity["yield"](value) || '') + suffix;
    };
    Kontinuation.engine = engine;
    Kontinuation.get = Kontinuation;
    _ref = this.prototype;
    for (property in _ref) {
      value = _ref[property];
      Kontinuation[property] = value;
    }
    return Kontinuation;
  };

  Continuation.prototype.ASCEND = String.fromCharCode(8593);

  Continuation.prototype.PAIR = String.fromCharCode(8594);

  Continuation.prototype.DESCEND = String.fromCharCode(8595);

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


  Continuation.prototype.getVariants = function(path) {
    return [path, path + this.ASCEND, path + this.PAIR, path + this.DESCEND];
  };

  Continuation.prototype.getCanonicalPath = function(continuation, compact) {
    var bits, last;
    bits = this.get(continuation).split(this.DESCEND);
    last = bits[bits.length - 1];
    last = bits[bits.length - 1] = last.replace(this.CanonicalizeRegExp, '$1');
    if (compact) {
      return last;
    }
    return bits.join(this.DESCEND);
  };

  Continuation.prototype.CanonicalizeRegExp = new RegExp("" + "([^" + Continuation.prototype.PAIR + "])" + "\\$[^" + Continuation.prototype.ASCEND + "]+" + "(?:" + Continuation.prototype.ASCEND + "|$)", "g");

  Continuation.prototype.getCanonicalSelector = function(selector) {
    selector = selector.trim();
    selector = selector.replace(this.CanonicalizeSelectorRegExp, ' ').replace(/\s+/g, this.DESCEND).replace(this.engine.Operation.CleanupSelectorRegExp, '');
    return selector;
  };

  Continuation.prototype.CanonicalizeSelectorRegExp = new RegExp("" + "[$][a-z0-9]+[" + Continuation.prototype.DESCEND + "]\s*", "gi");

  Continuation.prototype.getScopePath = function(scope, continuation) {
    var bits, id, index, last, path, prev;
    if (!continuation) {
      return '';
    }
    bits = continuation.split(this.DESCEND);
    if (scope && this.engine.scope !== scope) {
      id = this.engine.identity["yield"](scope);
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

  Continuation.prototype.concat = function(continuation, command, scope) {
    var path;
    if (continuation != null) {
      if (operation.def.serialized && !operation.def.hidden) {
        if (operation.marked && operation.arity === 2) {
          path = continuation + operation.path;
        } else {
          path = continuation + (operation.key || operation.path);
        }
      } else {
        path = continuation;
      }
    } else {
      path = operation.path;
    }
    return path;
  };

  Continuation.prototype.TrimContinuationRegExp = new RegExp("[" + Continuation.prototype.ASCEND + Continuation.prototype.DESCEND + Continuation.prototype.PAIR + "]$");

  return Continuation;

})();

_ref = Continuation.prototype;
for (property in _ref) {
  value = _ref[property];
  Continuation[property] = value;
}

module.exports = Continuation;
