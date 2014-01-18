var Node, Rule, StyleSheet,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Rule = GSS.Rule;

Node = GSS.Node;

StyleSheet = (function(_super) {
  __extends(StyleSheet, _super);

  StyleSheet.prototype.isScoped = false;

  /*    
  ownerNode:  Node
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
    if (o.isScoped != null) {
      this.isScoped = o.isScoped;
    }
    this.styleSheet = this;
    this.rules = [];
    if (o.rules) {
      this.addRules(o.rules);
    }
  }

  StyleSheet.prototype.update = function() {};

  return StyleSheet;

})(Node);

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

  Collection.prototype.update = function() {
    var sheet, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      sheet = this[_i];
      _results.push(sheet.updateIfNeeded());
    }
    return _results;
  };

  Collection.prototype.queryAll = function() {
    var node, nodes, _i, _len, _results;
    nodes = document.querySelectorAll("style");
    _results = [];
    for (_i = 0, _len = nodes.length; _i < _len; _i++) {
      node = nodes[_i];
      _results.push(this.addStyleNode(node));
    }
    return _results;
  };

  Collection.prototype.addStyleNode = function(node) {
    var engine, rules, styleSheet;
    if (node.gssStyleSheet) {
      return null;
    }
    if (!GSS.get.isStyleNode(node)) {
      return null;
    }
    engine = GSS({
      scope: scope
    });
    rules = this.getter.readAST(node);
    styleSheet = this.add({
      ownerNode: node,
      engine: engine,
      engineId: engine.id,
      rules: rules
    });
    node.gssStyleSheet = styleSheet;
    return styleSheet;
  };

  Collection.prototype.add = function(o) {
    var styleSheet;
    styleSheet = new GSS.StyleSheet(o);
    this.push(styleSheet);
    return styleSheet;
  };

  Collection.prototype.remove = function() {};

  return Collection;

})();

module.exports = StyleSheet;
