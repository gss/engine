var Thread,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

Thread = (function() {
  function Thread() {
    this.remove = __bind(this.remove, this);
    this.stay = __bind(this.stay, this);
    this.suggest = __bind(this.suggest, this);
    this._editvar = __bind(this._editvar, this);
    this.gt = __bind(this.gt, this);
    this.lt = __bind(this.lt, this);
    this.gte = __bind(this.gte, this);
    this.lte = __bind(this.lte, this);
    this.eq = __bind(this.eq, this);
    this._addConstraint = __bind(this._addConstraint, this);
    this._execute = __bind(this._execute, this);
    this.unparse = __bind(this.unparse, this);
    this.cachedVars = {};
    this.solver = new c.SimplexSolver();
    this.solver.autoSolve = false;
    this.constraintsByTracker = {};
    this.varIdsByTracker = {};
    this;
  }

  Thread.prototype.unparse = function(ast) {
    var command, _i, _len, _ref, _results;
    _ref = ast.commands;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      command = _ref[_i];
      _results.push(this._execute(command, command));
    }
    return _results;
  };

  Thread.prototype._execute = function(command, root) {
    var func, i, node, sub, _i, _len, _ref;
    node = command;
    func = this[node[0]];
    if (func == null) {
      throw new Error("Thread unparse broke, couldn't find method: " + node[0]);
    }
    _ref = node.slice(1, +node.length + 1 || 9e9);
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      sub = _ref[i];
      if (sub instanceof Array) {
        node.splice(i + 1, 1, this._execute(sub, root));
      }
    }
    return func.call.apply(func, [this, root].concat(__slice.call(node.slice(1, node.length))));
  };

  Thread.prototype._getValues = function() {
    var id, o;
    this.solver.resolve();
    o = {};
    for (id in this.cachedVars) {
      o[id] = this.cachedVars[id].value;
    }
    return o;
  };

  Thread.prototype.number = function(root, num) {
    return Number(num);
  };

  Thread.prototype._trackVarId = function(varr, vid, tracker) {
    if (!this.varIdsByTracker[tracker]) {
      this.varIdsByTracker[tracker] = [];
    }
    if (this.varIdsByTracker[tracker].indexOf(vid) === -1) {
      return this.varIdsByTracker[tracker].push(vid);
    }
  };

  Thread.prototype["var"] = function(self, id, prop, tracker) {
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
    var cv;
    cv = this.cachedVars;
    if (cv[id]) {
      return cv[id];
    }
    if (!(expression instanceof c.Expression)) {
      throw new Error("Thread `varexp` requires an instance of c.Expression");
    }
    Object.defineProperty(cv, id, {
      get: function() {
        var clone;
        clone = expression.clone();
        if (tracker) {
          this._trackVarId(id, tracker);
          clone._tracker = tracker;
          clone._is_tracked = true;
        }
        return clone;
      }
    });
    return expression;
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

  Thread.prototype.get = function(root, id, tracker) {
    var v;
    v = this.cachedVars[id];
    if (v) {
      this._trackRootIfNeeded(root, tracker);
      this._trackRootIfNeeded(root, v.tracker);
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
    return c.plus(e1, e2);
  };

  Thread.prototype.divide = function(root, e1, e2, s, w) {
    return c.divide(e1, e2);
  };

  Thread.prototype._strength = function(s) {
    var strength;
    strength = c.Strength[s];
    return strength;
  };

  Thread.prototype._addConstraint = function(root, constraint) {
    var tracker, _i, _len, _ref;
    this.solver.addConstraint(constraint);
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
    return this._addConstraint(self, new c.Equation(e1, e2, this._strength(s), w));
  };

  Thread.prototype.lte = function(self, e1, e2, s, w) {
    return this._addConstraint(self, new c.Inequality(e1, c.LEQ, e2, this._strength(s), w));
  };

  Thread.prototype.gte = function(self, e1, e2, s, w) {
    return this._addConstraint(self, new c.Inequality(e1, c.GEQ, e2, this._strength(s), w));
  };

  Thread.prototype.lt = function(self, e1, e2, s, w) {
    return this._addConstraint(self, new c.Inequality(e1, c.LEQ, e2, this._strength(s), w));
  };

  Thread.prototype.gt = function(self, e1, e2, s, w) {
    return this._addConstraint(self, new c.Inequality(e1, c.GEQ, e2, this._strength(s), w));
  };

  Thread.prototype._editvar = function(varr, strength) {
    return this.solver.addEditVar(varr);
  };

  Thread.prototype.suggest = function(self, varr, val, strength) {
    this._editvar(varr, strength);
    return this.solver.suggestValue(varr, val);
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

  Thread.prototype.remove = function(self, tracker) {
    var constraint, id, _i, _j, _len, _len1, _ref, _ref1, _results;
    if (this.constraintsByTracker[tracker]) {
      _ref = this.constraintsByTracker[tracker];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        constraint = _ref[_i];
        this.solver.removeConstraint(constraint);
      }
      delete this.constraintsByTracker[tracker];
    }
    if (this.varIdsByTracker[tracker]) {
      _ref1 = this.varIdsByTracker[tracker];
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        id = _ref1[_j];
        _results.push(delete this.cachedVars[id]);
      }
      return _results;
    }
  };

  return Thread;

})();
