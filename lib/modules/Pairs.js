var Pairs;

Pairs = (function() {
  function Pairs(engine) {
    this.engine = engine;
    this.lefts = [];
    this.paths = {};
  }

  Pairs.prototype.onLeft = function(operation, continuation, scope) {
    var left, parent;
    left = this.engine.getCanonicalPath(continuation);
    parent = this.getTopmostOperation(operation);
    if (this.engine.indexOfTriplet(this.lefts, parent, left, scope) === -1) {
      this.lefts.push(parent, left, scope);
      return this.engine.RIGHT;
    } else {
      return false;
    }
  };

  Pairs.prototype.getTopmostOperation = function(operation) {
    while (!operation.def.noop) {
      operation = operation.parent;
    }
    return operation;
  };

  Pairs.prototype.onRight = function(operation, continuation, scope, left, right) {
    var index, pairs, parent, pushed, _base;
    right = this.engine.getCanonicalPath(continuation.substring(0, continuation.length - 1));
    parent = this.getTopmostOperation(operation);
    if ((index = this.lefts.indexOf(parent)) > -1) {
      left = this.lefts[index + 1];
      this.watch(operation, continuation, scope, left, right);
    }
    if (!left) {
      return;
    }
    console.error('right', 'roruro', [left, right], parent, this.lefts.slice());
    left = this.engine.getCanonicalPath(left);
    pairs = (_base = this.paths)[left] || (_base[left] = []);
    if (pairs.indexOf(right) === -1) {
      pushed = pairs.push(right, operation, scope);
    }
    if (this.repairing === void 0) {
      (this.dirty || (this.dirty = {}))[left] = true;
    }
    return false;
  };

  Pairs.prototype.onLeftRemoved = function() {};

  Pairs.prototype.onRightRemoved = function() {};

  Pairs.prototype.remove = function(id, continuation) {
    if (!this.paths[continuation]) {
      return;
    }
    (this.dirty || (this.dirty = {}))[continuation] = true;
    return console.info('removing', id, continuation);
  };

  Pairs.prototype.getSolution = function(operation, continuation, scope, single) {
    var contd, id, index, parent, prev, result;
    console.log('get sol', continuation, single);
    if (continuation === "style$2↓.a$a1↑") {
      debugger;
    }
    if (continuation.charAt(continuation.length - 1) === this.engine.RIGHT) {
      if (continuation.length === 1) {
        return;
      }
      parent = operation;
      while (parent = parent.parent) {
        if (parent.def.noop) {
          break;
        }
      }
      if (continuation.charAt(0) === this.engine.RIGHT) {
        return this.onRight(operation, continuation, scope);
      } else if (operation.def.serialized) {
        prev = -1;
        while ((index = continuation.indexOf(this.engine.RIGHT, prev + 1)) > -1) {
          if (result = this.getSolution(operation, continuation.substring(prev || 0, index), scope, true)) {
            return result;
          }
          prev = index;
        }
        return this.onLeft(operation, continuation, scope);
      }
    } else if (continuation.lastIndexOf(this.engine.RIGHT) <= 0) {
      contd = this.engine.getCanonicalPath(continuation, true);
      if (contd.charAt(0) === this.engine.RIGHT) {
        contd = contd.substring(1);
      }
      if (contd === operation.path) {
        console.info('match', continuation, continuation.match(this.TrailingIDRegExp));
        if (id = continuation.match(this.TrailingIDRegExp)) {
          return this.engine.identity[id[1]];
        } else {
          return this.engine.queries[continuation];
        }
      } else {
        console.info('no match', [contd, operation.path]);
      }
    }
  };

  Pairs.prototype.TrailingIDRegExp = /(\$[a-z0-9-_]+)[↓↑→]?$/i;

  Pairs.prototype.onBeforeSolve = function() {
    var dirty, index, pair, pairs, property, value, _i, _len;
    dirty = this.dirty;
    console.error('dirty', dirty);
    delete this.dirty;
    this.repairing = true;
    if (dirty) {
      for (property in dirty) {
        value = dirty[property];
        if (pairs = this.paths[property]) {
          for (index = _i = 0, _len = pairs.length; _i < _len; index = _i += 3) {
            pair = pairs[index];
            this.solve(property, pair, pairs[index + 1], pairs[index + 2]);
          }
        }
      }
    }
    return delete this.repairing;
  };

  Pairs.prototype.solve = function(left, right, operation, scope) {
    var added, cleaned, contd, index, leftNew, leftOld, leftUpdate, object, padded, pair, removed, rightNew, rightOld, rightUpdate, sorted, value, values, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _n, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    leftUpdate = (_ref = this.engine.workflow.queries) != null ? _ref[left] : void 0;
    rightUpdate = (_ref1 = this.engine.workflow.queries) != null ? _ref1[right] : void 0;
    values = [(_ref2 = leftUpdate != null ? leftUpdate[0] : void 0) != null ? _ref2 : this.engine.queries.get(left), leftUpdate ? leftUpdate[1] : this.engine.queries.get(left), (_ref3 = rightUpdate != null ? rightUpdate[0] : void 0) != null ? _ref3 : this.engine.queries.get(right), rightUpdate ? rightUpdate[1] : this.engine.queries.get(right)];
    sorted = values.slice().sort(function(a, b) {
      var _ref4, _ref5;
      return ((_ref4 = (b != null ? b.push : void 0) && b.length) != null ? _ref4 : -1) - ((_ref5 = (a != null ? a.push : void 0) && a.length) != null ? _ref5 : -1);
    });
    sorted[0] || (sorted[0] = []);
    console.info(leftUpdate, rightUpdate);
    console.error(left, right, sorted.slice());
    padded = void 0;
    for (index = _i = 0, _len = values.length; _i < _len; index = ++_i) {
      value = values[index];
      if (!(value != null ? value.push : void 0)) {
        values[index] = sorted[0].map && (sorted[0].map(function() {
          return value;
        })) || [value];
        values[index].single = true;
      } else {
        values[index] || (values[index] = []);
      }
    }
    leftNew = values[0], leftOld = values[1], rightNew = values[2], rightOld = values[3];
    console.error(left, right, this.engine.clone(values));
    removed = [];
    added = [];
    for (index = _j = 0, _len1 = leftOld.length; _j < _len1; index = ++_j) {
      object = leftOld[index];
      if (leftNew[index] !== object || rightOld[index] !== rightNew[index]) {
        if (rightOld && rightOld[index]) {
          removed.push([object, rightOld[index]]);
        }
        if (leftNew[index] && rightNew[index]) {
          added.push([leftNew[index], rightNew[index]]);
        }
      }
    }
    if (leftOld.length < leftNew.length) {
      for (index = _k = _ref4 = leftOld.length, _ref5 = leftNew.length; _ref4 <= _ref5 ? _k < _ref5 : _k > _ref5; index = _ref4 <= _ref5 ? ++_k : --_k) {
        if (rightNew[index]) {
          added.push([leftNew[index], rightNew[index]]);
        }
      }
    }
    cleaned = [];
    for (_l = 0, _len2 = removed.length; _l < _len2; _l++) {
      pair = removed[_l];
      contd = left;
      if (!leftOld.single) {
        contd += this.engine.identity.provide(pair[0]);
      }
      contd += right;
      if (!rightOld.single) {
        contd += this.engine.identity.provide(pair[1]);
      }
      cleaned.push(contd);
    }
    for (_m = 0, _len3 = added.length; _m < _len3; _m++) {
      pair = added[_m];
      contd = left;
      if (!leftNew.single) {
        contd += this.engine.identity.provide(pair[0]);
      }
      contd += right;
      if (!rightNew.single) {
        contd += this.engine.identity.provide(pair[1]);
      }
      if ((index = cleaned.indexOf(contd)) > -1) {
        cleaned.splice(index, 1);
      } else {
        this.engine.document.solve(operation.parent, contd + this.engine.RIGHT, scope, operation.index, pair[1]);
      }
    }
    for (_n = 0, _len4 = cleaned.length; _n < _len4; _n++) {
      contd = cleaned[_n];
      this.engine.queries.clean(contd);
    }
    return this.engine.console.row('repair', [[added, removed], [leftNew, rightNew], [leftOld, rightOld]], left, right);
  };

  Pairs.prototype.set = function(path, result) {
    var left, pairs, watchers, _ref, _ref1, _results;
    if (pairs = (_ref = this.paths) != null ? _ref[path] : void 0) {
      return (this.dirty || (this.dirty = {}))[path] = true;
    } else if (path.charAt(0) === this.engine.RIGHT) {
      path = this.engine.getCanonicalPath(path);
      _ref1 = this.paths;
      _results = [];
      for (left in _ref1) {
        watchers = _ref1[left];
        if (watchers.indexOf(path) > -1) {
          _results.push((this.dirty || (this.dirty = {}))[left] = true);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  };

  Pairs.prototype.watch = function(operation, continuation, scope, left, right) {
    var watchers, _base;
    watchers = (_base = this.paths)[left] || (_base[left] = []);
    if (this.engine.indexOfTriplet(watchers, right, operation, scope) === -1) {
      return watchers.push(right, operation, scope);
    }
  };

  Pairs.prototype.unwatch = function(operation, continuation, scope, left, right) {
    var index, watchers, _base;
    watchers = (_base = this.paths)[left] || (_base[left] = []);
    if ((index = this.engine.indexOfTriplet(watchers, right, operation, scope)) !== -1) {
      return watchers.splice(index, 3);
    }
  };

  Pairs.prototype.clean = function(path) {
    console.error('pos clewan', path);
    return this.set(path);
  };

  return Pairs;

})();

module.exports = Pairs;
