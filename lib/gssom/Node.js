var Node;

Node = (function() {
  function Node() {}

  Node.prototype.addRules = function(rules) {
    var r, rule, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = rules.length; _i < _len; _i++) {
      r = rules[_i];
      r.parent = this;
      r.styleSheet = this.styleSheet;
      r.engine = this.engine;
      rule = new GSS.Rule(r);
      _results.push(this.rules.push(rule));
    }
    return _results;
  };

  Node.prototype.needsUpdate = true;

  Node.prototype.setNeedsUpdate = function(bool) {
    if (bool) {
      this.styleSheet.setNeedsUpdate(true);
      return this.needsUpdate = true;
    } else {
      return this.needsUpdate = false;
    }
  };

  Node.prototype.updateIfNeeded = function() {
    var rule, _i, _len, _ref, _results;
    if (this.needsUpdate) {
      this.update();
      this.needsUpdate = false;
    }
    _ref = this.rules;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      _results.push(rule.updateIfNeeded());
    }
    return _results;
  };

  return Node;

})();

module.exports = Node;
