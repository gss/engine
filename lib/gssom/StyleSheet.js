var Rule, StyleSheet,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Rule = GSS.Rule;

StyleSheet = (function(_super) {
  __extends(StyleSheet, _super);

  StyleSheet.prototype.isScoped = false;

  /*    
  el:  Node
  engine:     Engine
  rules:      []
  isScoped:   Boolean
  */


  function StyleSheet(o) {
    var key, tagName, val;
    if (o == null) {
      o = {};
    }
    StyleSheet.__super__.constructor.apply(this, arguments);
    for (key in o) {
      val = o[key];
      this[key] = val;
    }
    if (!this.engine) {
      throw new Error("StyleSheet needs engine");
    }
    this.engine.addStyleSheet(this);
    GSS.styleSheets.push(this);
    this.isRemote = false;
    this.remoteSourceText = null;
    if (this.el) {
      tagName = this.el.tagName;
      if (tagName === "LINK") {
        this.isRemote = true;
      }
    }
    this.rules = [];
    if (o.rules) {
      this.addRules(o.rules);
    }
    this.loadIfNeeded();
    return this;
  }

  StyleSheet.prototype.addRules = function(rules) {
    var r, rule, _i, _len, _results;
    this.setNeedsInstall(true);
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

  StyleSheet.prototype.isLoading = false;

  StyleSheet.prototype.needsLoad = true;

  StyleSheet.prototype.reload = function() {
    this.destroyRules();
    return this._load();
  };

  StyleSheet.prototype.loadIfNeeded = function() {
    if (this.needsLoad) {
      this.needsLoad = false;
      this._load();
    }
    return this;
  };

  StyleSheet.prototype._load = function() {
    if (this.isRemote) {
      return this._loadRemote();
    } else if (this.el) {
      return this._loadInline();
    }
  };

  StyleSheet.prototype._loadInline = function() {
    return this.addRules(GSS.get.readAST(this.el));
  };

  StyleSheet.prototype._loadRemote = function() {
    var req, url,
      _this = this;
    if (this.remoteSourceText) {
      return this.addRules(GSS.compile(this.remoteSourceText));
    }
    url = this.el.getAttribute('href');
    if (!url) {
      return null;
    }
    req = new XMLHttpRequest;
    req.onreadystatechange = function() {
      if (req.readyState !== 4) {
        return;
      }
      if (req.status !== 200) {
        return;
      }
      _this.remoteSourceText = req.responseText.trim();
      _this.addRules(GSS.compile(_this.remoteSourceText));
      _this.isLoading = false;
      return _this.trigger('loaded');
    };
    this.isLoading = true;
    req.open('GET', url, true);
    return req.send(null);
  };

  StyleSheet.prototype.needsInstall = false;

  StyleSheet.prototype.setNeedsInstall = function(bool) {
    if (bool) {
      this.engine.setNeedsUpdate(true);
      return this.needsInstall = true;
    } else {
      return this.needsInstall = false;
    }
  };

  StyleSheet.prototype.install = function() {
    if (this.needsInstall) {
      this.setNeedsInstall(false);
      return this._install();
    }
  };

  StyleSheet.prototype.reinstall = function() {
    return this._install();
  };

  StyleSheet.prototype._install = function() {
    var rule, _i, _len, _ref, _results;
    _ref = this.rules;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      _results.push(rule.install());
    }
    return _results;
  };

  StyleSheet.prototype.reset = function() {
    var rule, _i, _len, _ref, _results;
    this.setNeedsInstall(true);
    _ref = this.rules;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      _results.push(rule.reset());
    }
    return _results;
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
    if (this.el && !document.body.contains(this.el) && !document.head.contains(this.el)) {
      return true;
    }
    return false;
  };

  StyleSheet.prototype.needsDumpCSS = false;

  StyleSheet.prototype.setNeedsDumpCSS = function(bool) {
    if (bool) {
      this.engine.setNeedsDumpCSS(true);
      return this.needsDumpCSS = true;
    } else {
      return this.needsDumpCSS = false;
    }
  };

  StyleSheet.prototype.dumpCSSIfNeeded = function() {
    if (this.needsDumpCSS) {
      return this.dumpCSS();
    }
  };

  StyleSheet.prototype.dumpCSS = function() {
    var css, rule, ruleCSS, _i, _len, _ref;
    css = "";
    _ref = this.rules;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      ruleCSS = rule.dumpCSS();
      if (ruleCSS) {
        css = css + ruleCSS;
      }
    }
    return css;
  };

  return StyleSheet;

})(GSS.EventTrigger);

StyleSheet.fromNode = function(node) {
  var engine, sheet;
  if (node.gssStyleSheet) {
    return node.gssStyleSheet;
  }
  engine = GSS({
    scope: GSS.get.scopeForStyleNode(node)
  });
  sheet = new GSS.StyleSheet({
    el: node,
    engine: engine,
    engineId: engine.id
  });
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

  Collection.prototype.find = function() {
    var node, nodes, sheet, _i, _len;
    nodes = document.querySelectorAll('[type="text/gss"], [type="text/gss-ast"]');
    for (_i = 0, _len = nodes.length; _i < _len; _i++) {
      node = nodes[_i];
      sheet = GSS.StyleSheet.fromNode(node);
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
