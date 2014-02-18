var Thread,
  __slice = [].slice;

Thread = (function() {
  function Thread(o) {
    var defaultStrength;
    if (o == null) {
      o = {};
    }
    defaultStrength = o.defaultStrength || 'required';
    this.defaultStrength = c.Strength[defaultStrength];
    if (!this.defaultStrength) {
      this.defaultStrength = c.Strength['required'];
    }
    this.defaultWeight = o.defaultWeight || 0;
    this.setupIfNeeded();
    this;
  }

  Thread.prototype.needsSetup = true;

  Thread.prototype.setupIfNeeded = function() {
    if (!this.needsSetup) {
      return this;
    }
    this.needsSetup = false;
    this.solver = new c.SimplexSolver();
    this.solver.autoSolve = false;
    this.cachedVars = {};
    this.constraintsByTracker = {};
    this.varIdsByTracker = {};
    this.conditionals = [];
    this.activeClauses = [];
    this.__editVarNames = [];
    return this;
  };

  Thread.prototype.postMessage = function(message) {
    this.execute(message);
    return this;
  };

  Thread.prototype.terminate = function() {
    this.needsSetup = true;
    this.solver = null;
    this.cachedVars = null;
    this.constraintsByTracker = null;
    this.varIdsByTracker = null;
    this.conditionals = null;
    this.activeClauses = null;
    this.__editVarNames = null;
    return this;
  };

  Thread.prototype.output = function() {
    return {
      values: this.getValues(),
      clauses: this.activeClauses
    };
  };

  Thread.prototype.execute = function(message) {
    var command, uuid, _i, _len, _ref;
    this.setupIfNeeded();
    uuid = null;
    if (message.uuid) {
      uuid = message.uuid;
    }
    _ref = message.commands;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      command = _ref[_i];
      this._trackRootIfNeeded(command, uuid);
      this._execute(command, command);
    }
    return this;
  };

  Thread.prototype._execute = function(command, root) {
    var func, i, node, sub, subResult;
    node = command;
    func = this[node[0]];
    if (func == null) {
      throw new Error("Thread.execute broke, couldn't find method: " + node[0]);
    }
    i = node.length - 1;
    while (i > 0) {
      sub = node[i];
      if (sub instanceof Array) {
        subResult = this._execute(sub, root);
        if (subResult === "IGNORE") {
          node.splice(i, 1);
        } else {
          node.splice(i, 1, subResult);
        }
      }
      i--;
    }
    return func.call.apply(func, [this, root].concat(__slice.call(node.slice(1, node.length))));
  };

  Thread.prototype.getValues = function() {
    var id, o;
    this._solve();
    o = {};
    for (id in this.cachedVars) {
      o[id] = this.cachedVars[id].value;
    }
    return o;
  };

  Thread.prototype._solve = function(recurses) {
    var conditional, _i, _len, _ref;
    if (recurses == null) {
      recurses = 0;
    }
    this.solver.solve();
    if (this.conditionals.length > 0 && recurses === 0) {
      _ref = this.conditionals;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        conditional = _ref[_i];
        conditional.update();
      }
      recurses++;
      return this._solve(recurses);
    }
  };

  Thread.prototype['track'] = function(root, tracker) {
    this._trackRootIfNeeded(root, tracker);
    return 'IGNORE';
  };

  Thread.prototype._trackRootIfNeeded = function(root, tracker) {
    if (tracker) {
      root._is_tracked = true;
      if (!root._trackers) {
        root._trackers = [];
      }
      if (root._trackers.indexOf(tracker) === -1) {
        return root._trackers.push(tracker);
      }
    }
  };

  Thread.prototype['remove'] = function(self, trackersss) {
    var args, tracker, trackers, _i, _len, _results;
    args = __slice.call(arguments);
    trackers = __slice.call(args.slice(1, args.length));
    _results = [];
    for (_i = 0, _len = trackers.length; _i < _len; _i++) {
      tracker = trackers[_i];
      _results.push(this._remove(tracker));
    }
    return _results;
  };

  Thread.prototype._remove = function(tracker) {
    this._removeConstraintByTracker(tracker);
    return this._removeVarByTracker(tracker);
  };

  Thread.prototype._removeVarByTracker = function(tracker) {
    var id, _i, _len, _ref;
    delete this.__editVarNames[tracker];
    if (this.varIdsByTracker[tracker]) {
      _ref = this.varIdsByTracker[tracker];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        delete this.cachedVars[id];
      }
      return delete this.varIdsByTracker[tracker];
    }
  };

  Thread.prototype._removeConstraintByTracker = function(tracker, permenant) {
    var constraint, error, movealong, _i, _len, _ref;
    if (permenant == null) {
      permenant = true;
    }
    if (this.constraintsByTracker[tracker]) {
      _ref = this.constraintsByTracker[tracker];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        constraint = _ref[_i];
        try {
          this.solver.removeConstraint(constraint);
        } catch (_error) {
          error = _error;
          movealong = 'please';
        }
      }
      if (permenant) {
        return this.constraintsByTracker[tracker] = null;
      }
    }
  };

  Thread.prototype._addConstraintByTracker = function(tracker) {
    var constraint, _i, _len, _ref, _results;
    if (this.constraintsByTracker[tracker]) {
      _ref = this.constraintsByTracker[tracker];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        constraint = _ref[_i];
        _results.push(this.solver.addConstraint(constraint));
      }
      return _results;
    }
  };

  Thread.prototype['where'] = function(root, label, labelSuffix) {
    root._condition_bound = true;
    this._trackRootIfNeeded(root, label);
    this._trackRootIfNeeded(root, label + labelSuffix);
    return "IGNORE";
  };

  Thread.prototype['cond'] = function(self, ifffff) {
    var args, clause, clauses, that, _i, _len, _ref;
    args = __slice.call(arguments);
    clauses = [];
    _ref = args.slice(1, args.length);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      clause = _ref[_i];
      clauses.push(clause);
    }
    that = this;
    return this.conditionals.push({
      clauses: clauses,
      activeLabel: null,
      update: function() {
        var found, newLabel, oldLabel, _j, _len1;
        found = false;
        oldLabel = this.activeLabel;
        for (_j = 0, _len1 = clauses.length; _j < _len1; _j++) {
          clause = clauses[_j];
          newLabel = clause.test();
          if (newLabel) {
            found = true;
            break;
          }
        }
        if (found) {
          if (oldLabel !== newLabel) {
            if (oldLabel != null) {
              that.activeClauses.splice(that.activeClauses.indexOf(oldLabel), 1);
              that._removeConstraintByTracker(oldLabel, false);
            }
            that._addConstraintByTracker(newLabel);
            that.activeClauses.push(newLabel);
            return this.activeLabel = newLabel;
          }
        } else {
          if (oldLabel != null) {
            that.activeClauses.splice(that.activeClauses.indexOf(oldLabel), 1);
            return that._removeConstraintByTracker(oldLabel, false);
          }
        }
      }
    });
  };

  Thread.prototype['clause'] = function(root, condition, label) {
    return {
      label: label,
      test: function() {
        if (!label) {
          return condition;
        }
        if (!condition) {
          return label;
        }
        if (condition.call(this)) {
          return label;
        } else {
          return null;
        }
      }
    };
  };

  Thread.prototype._valueOf = function(e) {
    var val;
    val = e.value;
    if (val) {
      return val;
    }
    val = Number(e);
    if (val) {
      return val;
    }
  };

  Thread.prototype['?>='] = function(root, e1, e2) {
    var _valueOf;
    _valueOf = this._valueOf;
    return function() {
      return _valueOf(e1) >= _valueOf(e2);
    };
  };

  Thread.prototype['?<='] = function(root, e1, e2) {
    var _valueOf;
    _valueOf = this._valueOf;
    return function() {
      return _valueOf(e1) <= _valueOf(e2);
    };
  };

  Thread.prototype['?=='] = function(root, e1, e2) {
    var _valueOf;
    _valueOf = this._valueOf;
    return function() {
      return _valueOf(e1) === _valueOf(e2);
    };
  };

  Thread.prototype['?>'] = function(root, e1, e2) {
    var _valueOf;
    _valueOf = this._valueOf;
    return function() {
      return _valueOf(e1) > _valueOf(e2);
    };
  };

  Thread.prototype['?<'] = function(root, e1, e2) {
    var _valueOf;
    _valueOf = this._valueOf;
    return function() {
      return _valueOf(e1) < _valueOf(e2);
    };
  };

  Thread.prototype['?!='] = function(root, e1, e2) {
    var _valueOf;
    _valueOf = this._valueOf;
    return function() {
      return _valueOf(e1) !== _valueOf(e2);
    };
  };

  Thread.prototype['&&'] = function(root, c1, c2) {
    return c1 && c2;
  };

  Thread.prototype['||'] = function(root, c1, c2) {
    return c1 || c2;
  };

  Thread.prototype.number = function(root, num) {
    return Number(num);
  };

  Thread.prototype._trackVarId = function(id, tracker) {
    if (!this.varIdsByTracker[tracker]) {
      this.varIdsByTracker[tracker] = [];
    }
    if (this.varIdsByTracker[tracker].indexOf(id) === -1) {
      return this.varIdsByTracker[tracker].push(id);
    }
  };

  Thread.prototype["var"] = function(self, id, tracker) {
    var v;
    if (this.cachedVars[id]) {
      return this.cachedVars[id];
    }
    v = new c.Variable({
      name: id
    });
    if (tracker) {
      this._trackVarId(id, tracker);
      v._tracker = tracker;
      v._is_tracked = true;
    }
    this.cachedVars[id] = v;
    return v;
  };

  Thread.prototype.varexp = function(self, id, expression, tracker) {
    var cv, that;
    cv = this.cachedVars;
    if (cv[id]) {
      return cv[id];
    }
    if (!(expression instanceof c.Expression)) {
      throw new Error("Thread `varexp` requires an instance of c.Expression");
    }
    that = this;
    Object.defineProperty(cv, id, {
      get: function() {
        var clone;
        clone = expression.clone();
        if (tracker) {
          that._trackVarId(id, tracker);
          clone._tracker = tracker;
          clone._is_tracked = true;
        }
        return clone;
      }
    });
    return expression;
  };

  Thread.prototype.get$ = function(root, prop, elId, selector) {
    this._trackRootIfNeeded(root, elId);
    if (selector) {
      this._trackRootIfNeeded(root, selector + elId);
    }
    return this._get$(prop, elId);
  };

  Thread.prototype._get$ = function(prop, elId) {
    var exp, varId;
    varId = elId + ("[" + prop + "]");
    switch (prop) {
      case "right":
        exp = c.plus(this._get$("x", elId), this._get$("width", elId));
        return this.varexp(null, varId, exp, elId);
      case "bottom":
        exp = c.plus(this._get$("y", elId), this._get$("height", elId));
        return this.varexp(null, varId, exp, elId);
      case "center-x":
        exp = c.plus(this._get$("x", elId), c.divide(this._get$("width", elId), 2));
        return this.varexp(null, varId, exp, elId);
      case "center-y":
        exp = c.plus(this._get$("y", elId), c.divide(this._get$("height", elId), 2));
        return this.varexp(null, varId, exp, elId);
      default:
        return this["var"](null, varId, elId);
    }
  };

  Thread.prototype.get = function(root, id, tracker) {
    var v;
    if (tracker) {
      this._trackRootIfNeeded(root, tracker);
    }
    v = this.cachedVars[id];
    if (v) {
      this._trackRootIfNeeded(root, v.tracker);
      return v;
    } else {
      v = this["var"](null, id);
      return v;
    }
    throw new Error("AST method 'get' couldn't find var with id: " + id);
  };

  Thread.prototype.plus = function(root, e1, e2) {
    return c.plus(e1, e2);
  };

  Thread.prototype.minus = function(root, e1, e2) {
    return c.minus(e1, e2);
  };

  Thread.prototype.multiply = function(root, e1, e2) {
    return c.times(e1, e2);
  };

  Thread.prototype.divide = function(root, e1, e2, s, w) {
    return c.divide(e1, e2);
  };

  Thread.prototype._strength = function(s) {
    var strength;
    if (typeof s === 'string') {
      if (s === 'require') {
        s = 'required';
      }
      strength = c.Strength[s];
      if (strength) {
        return strength;
      }
    }
    return this.defaultStrength;
  };

  Thread.prototype._weight = function(w) {
    if (typeof w === 'number') {
      return w;
    }
    return this.defaultWeight;
  };

  Thread.prototype._addConstraint = function(root, constraint) {
    var tracker, _i, _len, _ref;
    if (!root._condition_bound) {
      this.solver.addConstraint(constraint);
    }
    if (root._is_tracked) {
      _ref = root._trackers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tracker = _ref[_i];
        if (!this.constraintsByTracker[tracker]) {
          this.constraintsByTracker[tracker] = [];
        }
        this.constraintsByTracker[tracker].push(constraint);
      }
    }
    return constraint;
  };

  Thread.prototype.eq = function(self, e1, e2, s, w) {
    return this._addConstraint(self, new c.Equation(e1, e2, this._strength(s), this._weight(w)));
  };

  Thread.prototype.lte = function(self, e1, e2, s, w) {
    return this._addConstraint(self, new c.Inequality(e1, c.LEQ, e2, this._strength(s), this._weight(w)));
  };

  Thread.prototype.gte = function(self, e1, e2, s, w) {
    return this._addConstraint(self, new c.Inequality(e1, c.GEQ, e2, this._strength(s), this._weight(w)));
  };

  Thread.prototype.lt = function(self, e1, e2, s, w) {
    return this._addConstraint(self, new c.Inequality(e1, c.LEQ, e2, this._strength(s), this._weight(w)));
  };

  Thread.prototype.gt = function(self, e1, e2, s, w) {
    return this._addConstraint(self, new c.Inequality(e1, c.GEQ, e2, this._strength(s), this._weight(w)));
  };

  Thread.prototype._editvar = function(varr, s, w) {
    if (this.__editVarNames.indexOf(varr.name) === -1) {
      this.__editVarNames.push(varr.name);
      this.solver.addEditVar(varr, this._strength(s), this._weight(w));
    }
    return this;
  };

  Thread.prototype.suggest = function(self, varr, val, s, w) {
    if (s == null) {
      s = 'strong';
    }
    if (typeof varr === 'string') {
      varr = this.get(self, varr);
    }
    this._editvar(varr, s, w);
    this.solver.suggestValue(varr, val);
    return this.solver.resolve();
  };

  Thread.prototype.stay = function(self) {
    var args, v, _i, _len, _ref;
    args = __slice.call(arguments);
    _ref = args.slice(1, args.length);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      v = _ref[_i];
      this.solver.addStay(v);
    }
    return this.solver;
  };

  return Thread;

})();

if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
  module.exports = Thread;
}
