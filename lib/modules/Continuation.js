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
      return path + (value && engine.identity(value) || '') + suffix;
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
  
    <!-- Example continuation key -->
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

  Continuation.prototype.CanonicalizeRegExp = new RegExp("" + "([^" + Continuation.prototype.PAIR + ",])" + "\\$[^" + Continuation.prototype.ASCEND + "]+" + "(?:" + Continuation.prototype.ASCEND + "|$)", "g");

  Continuation.prototype.TrimContinuationRegExp = new RegExp("[" + Continuation.prototype.ASCEND + Continuation.prototype.DESCEND + Continuation.prototype.PAIR + "]$");

  return Continuation;

})();

_ref = Continuation.prototype;
for (property in _ref) {
  value = _ref[property];
  Continuation[property] = value;
}

module.exports = Continuation;
