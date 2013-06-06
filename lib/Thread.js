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
    this.execute = __bind(this.execute, this);
    this.cachedVars = {};
    this.solver = new c.SimplexSolver();
  }

  Thread.prototype.execute = function(ast) {
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
      _results.push(this.solver.addContraint(this._execute(cs)));
    }
    return _results;
  };

  Thread.prototype._execute = function(ast) {
    var func, i, node, sub, _i, _j, _len, _len1, _ref;
    for (_i = 0, _len = ast.length; _i < _len; _i++) {
      node = ast[_i];
      func = this[node[0]];
      _ref = node.slice(1, node.length);
      for (i = _j = 0, _len1 = _ref.length; _j < _len1; i = ++_j) {
        sub = _ref[i];
        if (sub instanceof Array) {
          node[i] = this._execute(sub);
        }
      }
      return func.apply(this, node.slice(1, a.length));
    }
  };

  Thread.prototype._getValues = function() {
    var id, o;
    o = {};
    for (id in this.cachedVars) {
      o[id] = this.cachedVars[id].value;
    }
    return o;
  };

  Thread.prototype["var"] = function(id, prop, context) {
    var v;
    if (cachedVars[id]) {
      return cachedVars[id];
    }
    v = new c.Variable({
      name: id
    });
    cachedVars[id] = v;
    return v;
  };

  Thread.prototype.get = function(id) {
    if (cachedVars[id]) {
      return cachedVars[id];
    }
    throw new Error("AST method 'get' couldn't find var with id: " + id);
  };

  Thread.prototype.plus = function(e1, e2) {
    return c.plus(e2, e2);
  };

  Thread.prototype.minus = function(e1, e2) {
    return c.minus(e2, e2);
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
