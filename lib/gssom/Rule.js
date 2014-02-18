var Rule, _rule_cid;

_rule_cid = 0;

Rule = (function() {
  Rule.prototype.isRule = true;

  function Rule(o) {
    var key, val;
    _rule_cid++;
    this.cid = _rule_cid;
    for (key in o) {
      val = o[key];
      this[key] = val;
    }
    this.boundConditionals = [];
    if (this.name === 'else' || this.name === 'elseif' || this.name === "if") {
      this.isConditional = true;
    }
    /*
    @rules
    @commands
    @selectors
    @type
    @parent
    @styleSheet
    @isApplied
    */

    this.rules = [];
    if (o.rules) {
      this.addRules(o.rules);
    }
    this.Type = Rule.types[this.type] || (function() {
      throw new Error("Rule type, " + type + ", not found");
    })();
    this;
  }

  Rule.prototype.addRules = function(rules) {
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

  Rule.prototype._selectorContext = null;

  Rule.prototype.needsInstall = true;

  Rule.prototype.install = function() {
    var rule, _i, _len, _ref;
    if (this.needsInstall) {
      this.needsInstall = false;
      this.Type.install.call(this);
    }
    _ref = this.rules;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      rule.install();
    }
    return this;
  };

  Rule.prototype.uninstall = function() {};

  Rule.prototype.reset = function() {
    var rule, _i, _len, _ref, _results;
    this.needsInstall = true;
    this.boundConditionals = [];
    _ref = this.rules;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      _results.push(rule.reset());
    }
    return _results;
  };

  Rule.prototype.executeCommands = function() {
    if (this.commands) {
      return this.engine.run(this);
    }
  };

  Rule.prototype.nextSibling = function() {
    var i;
    i = this.parent.rules.indexOf(this);
    return this.parent.rules[i + 1];
  };

  Rule.prototype.prevSibling = function() {
    var i;
    i = this.parent.rules.indexOf(this);
    return this.parent.rules[i - 1];
  };

  Rule.prototype.getSelectorContext = function() {
    if (!this._selectorContext) {
      this._selectorContext = this._computeSelectorContext();
    }
    return this._selectorContext;
  };

  Rule.prototype._computeSelectorContext = function() {
    var $, $$, parent, rule, selectorContext, _context, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    selectorContext = [];
    rule = this;
    while (rule.parent) {
      parent = rule.parent;
      if (!parent.isConditional) {
        if ((parent != null ? (_ref = parent.selectors) != null ? _ref.length : void 0 : void 0) > 0) {
          if (selectorContext.length === 0) {
            _ref1 = parent.selectors;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              $ = _ref1[_i];
              selectorContext.push($);
            }
          } else {
            _context = [];
            _ref2 = parent.selectors;
            for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
              $ = _ref2[_j];
              for (_k = 0, _len2 = selectorContext.length; _k < _len2; _k++) {
                $$ = selectorContext[_k];
                _context.push($ + " " + $$);
              }
            }
            selectorContext = _context;
          }
        }
      }
      rule = parent;
    }
    this.selectorContext = selectorContext;
    return selectorContext;
  };

  Rule.prototype.getContextQuery = function() {
    if (!this.query) {
      return this.setupContextQuery();
    }
    return this.query;
  };

  Rule.prototype.setupContextQuery = function() {
    var effectiveSelector, engine;
    effectiveSelector = this.getSelectorContext().join(", ");
    engine = this.engine;
    return this.query = engine.registerDomQuery({
      selector: effectiveSelector,
      isMulti: true,
      isLive: false,
      createNodeList: function() {
        return engine.queryScope.querySelectorAll(effectiveSelector);
      }
    });
  };

  Rule.prototype.gatherCondCommand = function() {
    var command, next, nextIsConditional;
    command = ["cond"];
    next = this;
    nextIsConditional = true;
    while (nextIsConditional) {
      command.push(next.getClauseCommand());
      next = next.nextSibling();
      nextIsConditional = next != null ? next.isConditional : void 0;
    }
    return command;
  };

  Rule.prototype.getClauseCommand = function() {
    return ["clause", this.clause, this.getClauseTracker()];
  };

  Rule.prototype.getClauseTracker = function() {
    return "gss-cond-" + this.cid;
  };

  Rule.prototype.injectChildrenCondtionals = function(conditional) {
    var command, rule, _i, _j, _len, _len1, _ref, _ref1, _results;
    _ref = this.rules;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      rule.boundConditionals.push(conditional);
      if (rule.commands) {
        _ref1 = rule.commands;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          command = _ref1[_j];
          command.push(["where", conditional.getClauseTracker()]);
        }
      }
      rule.isCondtionalBound = true;
      _results.push(rule.injectChildrenCondtionals(conditional));
    }
    return _results;
  };

  Rule.prototype.setNeedsDumpCSS = function(bool) {
    if (bool) {
      return this.styleSheet.setNeedsDumpCSS(true);
    }
  };

  Rule.prototype.dumpCSS = function() {
    var css, rule, ruleCSS, _i, _len, _ref, _ref1;
    css = (_ref = this.Type.dumpCSS) != null ? _ref.call(this) : void 0;
    _ref1 = this.rules;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      rule = _ref1[_i];
      ruleCSS = rule.dumpCSS();
      if (ruleCSS) {
        css = css + ruleCSS;
      }
    }
    return css;
  };

  return Rule;

})();

Rule.types = {
  directive: {
    install: function() {
      if (this.name === 'else' || this.name === 'elseif') {
        this.injectChildrenCondtionals(this);
        return this;
      } else if (this.name === 'if') {
        this.commands = [this.gatherCondCommand()];
        this.injectChildrenCondtionals(this);
        return this.executeCommands();
      } else {
        return this.executeCommands();
      }
    }
  },
  constraint: {
    install: function() {
      return this.executeCommands();
    }
  },
  style: {
    install: function() {
      return this.setNeedsDumpCSS(true);
    },
    dumpCSS: function() {}
  },
  ruleset: {
    install: function() {},
    dumpCSS: function() {
      var css, effectiveSelector, foundStyle, rule, _i, _len, _ref;
      foundStyle = false;
      css = "";
      effectiveSelector = null;
      _ref = this.rules;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rule = _ref[_i];
        if (rule.type === "style") {
          if (!foundStyle) {
            effectiveSelector = rule.getSelectorContext().join(", ");
            foundStyle = true;
          }
          css = css + rule.key + ":" + rule.val + ";";
        }
      }
      if (foundStyle) {
        css = effectiveSelector + "{" + css + "}";
      }
      return css;
    }
  }
};

module.exports = Rule;
