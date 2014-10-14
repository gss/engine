var Pairs;

Pairs = (function() {
  function Pairs(engine) {
    this.engine = engine;
    this.lefts = [];
    this.paths = {};
  }

  Pairs.prototype.onLeft = function(operation, continuation, scope) {
    var contd, left, parent;
    left = this.engine.Continuation.getCanonicalPath(continuation);
    parent = this.engine.Operation.getRoot(operation);
    if (this.engine.indexOfTriplet(this.lefts, parent, left, scope) === -1) {
      this.lefts.push(parent, left, scope);
      contd = this.engine.Continuation.PAIR;
      return this.engine.Continuation.PAIR;
    } else {
      (this.dirty || (this.dirty = {}))[left] = true;
      return false;
    }
  };

  Pairs.prototype.onRight = function(operation, continuation, scope, left, right) {
    var index, op, pairs, parent, pushed, _base, _i, _len, _ref;
    right = this.engine.Continuation.getCanonicalPath(continuation.substring(0, continuation.length - 1));
    parent = this.engine.Operation.getRoot(operation);
    _ref = this.lefts;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = _i += 3) {
      op = _ref[index];
      if (op === parent && this.lefts[index + 2] === scope) {
        left = this.lefts[index + 1];
        this.watch(operation, continuation, scope, left, right);
      }
    }
    if (!left) {
      return;
    }
    left = this.engine.Continuation.getCanonicalPath(left);
    pairs = (_base = this.paths)[left] || (_base[left] = []);
    if (pairs.indexOf(right) === -1) {
      pushed = pairs.push(right, operation, scope);
    }
    if (this.repairing === void 0) {
      (this.dirty || (this.dirty = {}))[left] = true;
    }
    return false;
  };

  Pairs.prototype.remove = function(id, continuation) {
    if (!this.paths[continuation]) {
      return;
    }
    return (this.dirty || (this.dirty = {}))[continuation] = true;
  };

  Pairs.prototype.getSolution = function(operation, continuation, scope, single) {
    var contd, first, i, id, index, last, parent, prev, relative, result;
    last = continuation.lastIndexOf(this.engine.Continuation.PAIR);
    if (last > 0) {
      parent = operation;
      while (parent = parent.parent) {
        if (parent.def.noop) {
          break;
        }
      }
      first = continuation.indexOf(this.engine.Continuation.PAIR);
      if (first === 0 && last === continuation.length - 1 && (this.onRight(operation, continuation, scope) != null)) {
        return false;
      } else if (operation.def.serialized) {
        prev = -1;
        while ((index = continuation.indexOf(this.engine.Continuation.PAIR, prev + 1)) > -1) {
          if (result = this.getSolution(operation, continuation.substring(prev || 0, index), scope, true)) {
            return result;
          }
          prev = index;
        }
        if (first === continuation.length - 1) {
          return this.onLeft(operation, continuation, scope);
        }
      }
    } else {
      if (continuation.length === 1) {
        return;
      }
      contd = this.engine.Continuation.getCanonicalPath(continuation, true);
      if (contd.charAt(0) === this.engine.Continuation.PAIR) {
        contd = contd.substring(1);
      }
      if (operation.path.substring(0, 6) === '::this') {
        if ((i = contd.lastIndexOf('::this')) > -1) {
          relative = contd.substring(i);
        } else {
          relative = '::this' + contd;
        }
      }
      if (contd === operation.path || relative === operation.path) {
        if (id = continuation.match(this.TrailingIDRegExp)) {
          if (id[1].indexOf('"') > -1) {
            return id[1];
          }
          return this.engine.identity[id[1]];
        } else {
          return this.engine.queries[continuation];
        }
      }
    }
  };

  Pairs.prototype.TrailingIDRegExp = /(\$[a-z0-9-_"]+)[↓↑→]?$/i;

  Pairs.prototype.onBeforeSolve = function() {
    var dirty, index, pair, pairs, property, value, _i, _len, _ref;
    dirty = this.dirty;
    delete this.dirty;
    this.repairing = true;
    if (dirty) {
      for (property in dirty) {
        value = dirty[property];
        if (pairs = (_ref = this.paths[property]) != null ? _ref.slice() : void 0) {
          for (index = _i = 0, _len = pairs.length; _i < _len; index = _i += 3) {
            pair = pairs[index];
            this.solve(property, pair, pairs[index + 1], pairs[index + 2]);
          }
        }
      }
    }
    return delete this.repairing;
  };

  Pairs.prototype.match = function(collection, node, scope) {
    var dups, index;
    if ((index = collection.indexOf(node)) > -1) {
      if (collection.scopes[index] === scope) {
        return true;
      }
      index = -1;
      if (dups = collection.duplicates) {
        while ((index = dups.indexOf(node, index + 1)) > -1) {
          if (collection.scopes[index + collection.length] === scope) {
            return true;
          }
        }
      }
    }
  };

  Pairs.prototype.count = function(value) {
    if (value != null ? value.push : void 0) {
      return value.length;
    } else {
      return (value != null) && 1 || 0;
    }
  };

  Pairs.prototype.pad = function(value, length) {
    var i, result, _i;
    if (value && !value.push) {
      result = [];
      for (i = _i = 0; 0 <= length ? _i < length : _i > length; i = 0 <= length ? ++_i : --_i) {
        result.push(value);
      }
      result.single = true;
      return result;
    } else if (value != null ? value.splice : void 0) {
      return value.slice();
    } else {
      return value || [];
    }
  };

  Pairs.prototype.solve = function(left, right, operation, scope) {
    var I, J, a, added, b, cleaned, cleaning, contd, el, index, leftNew, leftOld, object, pair, removed, rightNew, rightOld, sid, solved, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _n, _ref, _ref1;
    a = this.engine.queries.get(left);
    b = this.engine.queries.get(right);
    sid = this.engine.identity.provide(scope);
    leftOld = this.engine.updating.collections.hasOwnProperty(left) ? this.engine.queries.filterByScope(this.engine.updating.collections[left], scope) : this.engine.queries.filterByScope(a, scope);
    rightOld = this.engine.updating.collections.hasOwnProperty(right) ? this.engine.queries.filterByScope(this.engine.updating.collections[right], scope) : this.engine.queries.filterByScope(b, scope);
    leftNew = this.engine.queries.filterByScope(a, scope, operation);
    rightNew = this.engine.queries.filterByScope(b, scope, operation, true);
    I = Math.max(this.count(leftNew), this.count(rightNew));
    J = Math.max(this.count(leftOld), this.count(rightOld));
    leftNew = this.pad(leftNew, I);
    leftOld = this.pad(leftOld, J);
    rightNew = this.pad(rightNew, I);
    rightOld = this.pad(rightOld, J);
    removed = [];
    added = [];
    for (index = _i = 0, _len = leftOld.length; _i < _len; index = ++_i) {
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
      for (index = _j = _ref = leftOld.length, _ref1 = leftNew.length; _ref <= _ref1 ? _j < _ref1 : _j > _ref1; index = _ref <= _ref1 ? ++_j : --_j) {
        if (rightNew[index]) {
          added.push([leftNew[index], rightNew[index]]);
        }
      }
    }
    cleaned = [];
    for (_k = 0, _len1 = removed.length; _k < _len1; _k++) {
      pair = removed[_k];
      if (!pair[0] || !pair[1]) {
        continue;
      }
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
    solved = [];
    for (_l = 0, _len2 = added.length; _l < _len2; _l++) {
      pair = added[_l];
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
        this.engine.document.solve(operation.parent, contd + this.engine.Continuation.PAIR, scope, void 0, true);
      }
    }
    for (_m = 0, _len3 = cleaned.length; _m < _len3; _m++) {
      contd = cleaned[_m];
      this.engine.queries.clean(contd);
    }
    cleaning = true;
    for (_n = 0, _len4 = leftNew.length; _n < _len4; _n++) {
      el = leftNew[_n];
      if (el) {
        cleaning = false;
        break;
      }
    }
    if (cleaning) {
      this.clean(left, scope, operation);
    }
    return this.engine.console.row('repair', [[added, removed], [leftNew, rightNew], [leftOld, rightOld]], this.engine.identity.provide(scope) + left + right);
  };

  Pairs.prototype.clean = function(left, scope, operation) {
    var cleaning, contd, i, index, j, op, other, others, pairs, prefix, right, rights, top, _i, _j, _k, _l, _len, _len1, _len2, _m, _ref, _ref1;
    if (pairs = (_ref = this.paths) != null ? _ref[left] : void 0) {
      rights = [];
      top = this.engine.Operation.getRoot(operation);
      for (index = _i = 0, _len = pairs.length; _i < _len; index = _i += 3) {
        op = pairs[index];
        if (pairs[index + 2] === scope && this.engine.Operation.getRoot(pairs[index + 1]) === top) {
          rights.push(index);
        }
      }
      cleaning = rights.slice();
      top = this.engine.Operation.getRoot(operation);
      _ref1 = this.paths;
      for (prefix in _ref1) {
        others = _ref1[prefix];
        for (i = _j = 0, _len1 = others.length; _j < _len1; i = _j += 3) {
          other = others[i];
          for (j = _k = cleaning.length - 1; _k >= 0; j = _k += -1) {
            index = cleaning[j];
            if (other === pairs[index] && (others !== pairs || scope !== others[i + 2])) {
              cleaning.splice(j, 1);
            }
          }
        }
      }
      for (_l = 0, _len2 = cleaning.length; _l < _len2; _l++) {
        index = cleaning[_l];
        delete this.engine.queries[right];
      }
      for (_m = rights.length - 1; _m >= 0; _m += -1) {
        index = rights[_m];
        right = pairs[index];
        this.engine.queries.unobserve(scope._gss_id, this.engine.Continuation.PAIR, null, right.substring(1), void 0, scope, top);
        pairs.splice(index, 3);
      }
      if (!pairs.length) {
        delete this.paths[left];
      }
    }
    index = 0;
    while (contd = this.lefts[index + 1]) {
      if (contd === left && this.lefts[index + 2] === scope) {
        this.lefts.splice(index, 3);
      } else {
        index += 3;
      }
    }
    return this;
  };

  Pairs.prototype.set = function(path, result) {
    var left, pairs, watchers, _ref, _ref1, _results;
    if (pairs = (_ref = this.paths) != null ? _ref[path] : void 0) {
      return (this.dirty || (this.dirty = {}))[path] = true;
    } else if (path.charAt(0) === this.engine.Continuation.PAIR) {
      path = this.engine.Continuation.getCanonicalPath(path);
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

  return Pairs;

})();

module.exports = Pairs;
