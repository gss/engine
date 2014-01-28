var Node, Rule, rule_cid,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Node = GSS.Node;

rule_cid = 0;

Rule = (function(_super) {
  __extends(Rule, _super);

  Rule.prototype.isRule = true;

  function Rule(o) {
    var key, val;
    rule_cid++;
    this.cid = rule_cid;
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

  Rule.prototype._selectorContext = null;

  Rule.prototype.install = function() {
    if (this.commands) {
      return this.engine.run(this);
    }
  };

  Rule.prototype.uninstall = function() {};

  Rule.prototype.update = function() {
    return this.Type.update.call(this);
  };

  Rule.prototype.update___ = function() {
    if (this.commands) {
      this.engine.run(this);
    }
    return this.Type.update.call(this);
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
    var $, $$, parent, rule, selectorContext, _context, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
    selectorContext = [];
    rule = this;
    while (rule.parent) {
      parent = rule.parent;
      if (parent != null ? parent.selectors : void 0) {
        if (selectorContext.length === 0) {
          _ref = parent.selectors;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            $ = _ref[_i];
            selectorContext.push($);
          }
        } else {
          _context = [];
          _ref1 = parent.selectors;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            $ = _ref1[_j];
            for (_k = 0, _len2 = selectorContext.length; _k < _len2; _k++) {
              $$ = selectorContext[_k];
              _context.push($ + " " + $$);
            }
          }
          selectorContext = _context;
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
    return "cond:" + this.cid;
  };

  Rule.prototype.injectChildrenCondtionals = function(conditional) {
    var rule, _i, _len, _ref, _results;
    _ref = this.rules;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      rule.boundConditionals.push(conditional);
      rule.isCondtionalBound = true;
      _results.push(rule.injectChildrenCondtionals());
    }
    return _results;
  };

  return Rule;

})(Node);

Rule.types = {
  directive: {
    update: function() {
      if (this.name === 'else' || this.name === 'elseif') {
        this.injectChildrenCondtionals(this);
        return this;
      } else if (this.name === 'if') {
        this.commands = [this.gatherCondCommand()];
        this.injectChildrenCondtionals(this);
        return this.install();
      } else {
        return this.install();
      }
    }
  },
  constraint: {
    update: function() {
      return this.install();
    }
  },
  style: {
    update: function() {}
  },
  ruleset: {
    update: function() {}
  }
};

module.exports = Rule;
