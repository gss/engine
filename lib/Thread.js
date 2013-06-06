var Thread,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Thread = (function() {
  function Thread() {
    this.gt = __bind(this.gt, this);
    this.lt = __bind(this.lt, this);
    this.gte = __bind(this.gte, this);
    this.lte = __bind(this.lte, this);
    this.eq = __bind(this.eq, this);
    this._execute = __bind(this._execute, this);
    this.unparse = __bind(this.unparse, this);
    this.cachedVars = {};
    this.solver = new c.SimplexSolver();
    this.solver.autoSolve = false;
  }

  Thread.prototype.unparse = function(ast) {
    var cs, vs, _i, _j, _len, _len1, _ref, _ref1, _results;
    _ref = ast.vars;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      vs = _ref[_i];
      this._execute(vs);
    }
    _ref1 = ast.constraints;
    _results = [];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      cs = _ref1[_j];
      _results.push(this.solver.addConstraint(this._execute(cs)));
    }
    return _results;
  };

  Thread.prototype._execute = function(ast) {
    var func, i, node, sub, _i, _len, _ref;
    node = ast;
    func = this[node[0]];
    if (func == null) {
      throw new Error("Thread unparse broke, couldn't find method: " + node[0]);
    }
    _ref = node.slice(1, +node.length + 1 || 9e9);
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      sub = _ref[i];
      if (sub instanceof Array) {
        node.splice(i + 1, 1, this._execute(sub));
      }
    }
    return func.apply(this, node.slice(1, node.length));
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

  Thread.prototype.number = function(num) {
    return Number(num);
  };

  Thread.prototype["var"] = function(id, prop, context) {
    var v;
    if (this.cachedVars[id]) {
      return this.cachedVars[id];
    }
    v = new c.Variable({
      name: id
    });
    this.cachedVars[id] = v;
    return v;
  };

  Thread.prototype.get = function(id) {
    if (this.cachedVars[id]) {
      return this.cachedVars[id];
    }
    throw new Error("AST method 'get' couldn't find var with id: " + id);
  };

  Thread.prototype.plus = function(e1, e2) {
    return c.plus(e1, e2);
  };

  Thread.prototype.minus = function(e1, e2) {
    return c.minus(e1, e2);
  };

  Thread.prototype.multiply = function(e1, e2) {
    return c.plus(e1, e2);
  };

  Thread.prototype.divide = function(e1, e2, s, w) {
    return c.divide(e1, e2);
  };

  Thread.prototype.strength = function(s) {
    var strength;
    strength = c.Strength[s];
    return strength;
  };

  Thread.prototype.eq = function(e1, e2, s, w) {
    return new c.Equation(e1, e2, this.strength(s), w);
  };

  Thread.prototype.lte = function(e1, e2, s, w) {
    return new c.Inequality(e1, c.LEQ, e2, this.strength(s), w);
  };

  Thread.prototype.gte = function(e1, e2, s, w) {
    return new c.Inequality(e1, c.GEQ, e2, this.strength(s), w);
  };

  Thread.prototype.lt = function(e1, e2, s, w) {
    return new c.Inequality(e1, c.LEQ, e2, this.strength(s), w);
  };

  Thread.prototype.gt = function(e1, e2, s, w) {
    return new c.Inequality(e1, c.GEQ, e2, this.strength(s), w);
  };

  return Thread;

})();
