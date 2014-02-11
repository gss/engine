var Rule, StyleSheet;

Rule = GSS.Rule;

StyleSheet = (function() {
  StyleSheet.prototype.isScoped = false;

  /*    
  el:  Node
  engine:     Engine
  rules:      []
  isScoped:   Boolean
  */


  function StyleSheet(o) {
    var key, val;
    if (o == null) {
      o = {};
    }
    for (key in o) {
      val = o[key];
      this[key] = val;
    }
    if (!this.engine) {
      throw new Error("StyleSheet needs engine");
    }
    this.engine.styleSheets.push(this);
    GSS.styleSheets.push(this);
    this.rules = [];
    if (o.rules) {
      this.addRules(o.rules);
    }
    return this;
  }

  StyleSheet.prototype.addRules = function(rules) {
    var r, rule, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = rules.length; _i < _len; _i++) {
      r = rules[_i];
      r.parent = this;
      r.styleSheet = this;
      r.engine = this.engine;
      rule = new GSS.Rule(r);
      _results.push(this.rules.push(rule));
    }
    return _results;
  };

  StyleSheet.prototype.needsInstall = true;

  StyleSheet.prototype.install = function() {
    var rule, _i, _len, _ref;
    if (this.needsInstall) {
      this.needsInstall = false;
      _ref = this.rules;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rule = _ref[_i];
        rule.install();
      }
    }
    return this;
  };

  StyleSheet.prototype.reset = function() {
    var rule, _i, _len, _ref, _results;
    this.needsInstall = true;
    _ref = this.rules;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      _results.push(rule.reset());
    }
    return _results;
  };

  StyleSheet.prototype.loadRulesFromNode = function() {
    var rules;
    this.rules = [];
    rules = GSS.get.readAST(this.el);
    return this.addRules(rules);
  };

  StyleSheet.prototype.destroyRules = function() {
    var rule, _i, _len, _ref;
    _ref = this.rules;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      rule.destroy();
    }
    return this.rules = [];
  };

  StyleSheet.prototype.destroy = function() {
    var i;
    i = this.engine.styleSheets.indexOf(this);
    this.engine.styleSheets.splice(i, 1);
    i = GSS.styleSheets.indexOf(this);
    return GSS.styleSheets.splice(i, 1);
  };

  StyleSheet.prototype.isRemoved = function() {
    if (this.el && !document.contains(this.el)) {
      return true;
    }
    return false;
  };

  return StyleSheet;

})();

StyleSheet.fromNode = function(node) {
  var engine, sheet;
  if (node.gssStyleSheet) {
    return node.gssStyleSheet;
  }
  if (!GSS.get.isStyleNode(node)) {
    return null;
  }
  engine = GSS({
    scope: GSS.get.scopeForStyleNode(node)
  });
  sheet = new GSS.StyleSheet({
    el: node,
    engine: engine,
    engineId: engine.id
  });
  sheet.loadRulesFromNode();
  node.gssStyleSheet = sheet;
  return sheet;
};

StyleSheet.Collection = (function() {
  function Collection() {
    var collection, key, val;
    collection = [];
    for (key in this) {
      val = this[key];
      collection[key] = val;
    }
    return collection;
  }

  Collection.prototype.install = function() {
    var sheet, _i, _len;
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      sheet = this[_i];
      sheet.install();
    }
    return this;
  };

  Collection.prototype.findAndInstall = function() {
    var node, nodes, sheet, _i, _len;
    nodes = document.querySelectorAll("style");
    for (_i = 0, _len = nodes.length; _i < _len; _i++) {
      node = nodes[_i];
      sheet = GSS.StyleSheet.fromNode(node);
      if (sheet != null) {
        sheet.install();
      }
    }
    return this;
  };

  Collection.prototype.findAllRemoved = function() {
    var removed, sheet, _i, _len;
    removed = [];
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      sheet = this[_i];
      if (sheet.isRemoved()) {
        removed.push(sheet);
      }
    }
    return removed;
  };

  return Collection;

})();

GSS.StyleSheet = StyleSheet;

GSS.styleSheets = new GSS.StyleSheet.Collection();

module.exports = StyleSheet;
