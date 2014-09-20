var Pairs;

Pairs = (function() {
  function Pairs(engine) {
    this.engine = engine;
    this.lefts = [];
    this.paths = {};
  }

  Pairs.prototype.onLeft = function(operation, continuation, scope) {
    var contd, left, parent;
    console.error('onLeft', arguments);
    left = this.engine.getCanonicalPath(continuation);
    parent = this.getTopmostOperation(operation);
    if (this.engine.indexOfTriplet(this.lefts, parent, left, scope) === -1) {
      this.lefts.push(parent, left, scope);
      contd = this.engine.PAIR;
      return this.engine.PAIR;
    } else {
      (this.dirty || (this.dirty = {}))[left] = true;
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
    var index, op, pairs, parent, pushed, _base, _i, _len, _ref;
    console.error('onRight', arguments);
    right = this.engine.getCanonicalPath(continuation.substring(0, continuation.length - 1));
    parent = this.getTopmostOperation(operation);
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

  Pairs.prototype.remove = function(id, continuation) {
    if (!this.paths[continuation]) {
      return;
    }
    return (this.dirty || (this.dirty = {}))[continuation] = true;
  };

  Pairs.prototype.getSolution = function(operation, continuation, scope, single) {
    var contd, first, i, id, index, last, parent, prev, relative, result;
    last = continuation.lastIndexOf(this.engine.PAIR);
    if (last > 0) {
      parent = operation;
      while (parent = parent.parent) {
        if (parent.def.noop) {
          break;
        }
      }
      first = continuation.indexOf(this.engine.PAIR);
      if (first === 0 && last === continuation.length - 1) {
        return this.onRight(operation, continuation, scope);
      } else if (operation.def.serialized) {
        prev = -1;
        while ((index = continuation.indexOf(this.engine.PAIR, prev + 1)) > -1) {
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
      contd = this.engine.getCanonicalPath(continuation, true);
      if (contd.charAt(0) === this.engine.PAIR) {
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
          return this.engine.identity[id[1]];
        } else {
          return this.engine.queries[continuation];
        }
      }
    }
  };

  Pairs.prototype.TrailingIDRegExp = /(\$[a-z0-9-_]+)[↓↑→]?$/i;

  Pairs.prototype.onBeforeSolve = function() {
    var dirty, index, pair, pairs, property, value, _base, _i, _len;
    dirty = this.dirty;
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
    for (property in dirty) {
      value = dirty[property];
      ((_base = this.engine.updating).paired || (_base.paired = {}))[property] = value;
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

  Pairs.prototype.solve = function(left, right, operation, scope) {
    var I, J, added, cleaned, cleaning, collections, contd, el, element, index, leftNew, leftOld, leftUpdate, length, object, padded, pair, removed, rightNew, rightOld, rightUpdate, value, values, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _o, _p, _q, _r, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _results;
    leftUpdate = (_ref = this.engine.updating.queries) != null ? _ref[left] : void 0;
    rightUpdate = (_ref1 = this.engine.updating.queries) != null ? _ref1[right] : void 0;
    collections = [this.engine.queries.get(left), this.engine.queries.get(right)];
    values = [(leftUpdate != null ? (_ref2 = leftUpdate[0]) != null ? _ref2.nodeType : void 0 : void 0) && leftUpdate[0] || collections[0], leftUpdate ? leftUpdate[1] : collections[0], (rightUpdate != null ? (_ref3 = rightUpdate[0]) != null ? _ref3.nodeType : void 0 : void 0) && rightUpdate[0] || collections[1], rightUpdate ? rightUpdate[1] : collections[1]];
    I = Math.max(this.count(values[0]), this.count(values[1]));
    J = Math.max(this.count(values[2]), this.count(values[3]));
    padded = void 0;
    for (index = _i = 0, _len = values.length; _i < _len; index = ++_i) {
      value = values[index];
      if (!(value != null ? value.push : void 0)) {
        length = index > 1 ? I : J;
        values[index] = (function() {
          _results = [];
          for (var _j = 0; 0 <= length ? _j < length : _j > length; 0 <= length ? _j++ : _j--){ _results.push(_j); }
          return _results;
        }).apply(this).map(function() {
          return value;
        });
        values[index].single = true;
      } else if (value != null ? value.keys : void 0) {
        values[index] = values[index].slice();
      } else {
        values[index] || (values[index] = []);
      }
    }
    leftNew = values[0], leftOld = values[1], rightNew = values[2], rightOld = values[3];
    if (((_ref4 = collections[0]) != null ? _ref4.keys : void 0) && !leftNew.single) {
      for (index = _k = leftNew.length - 1; _k >= 0; index = _k += -1) {
        element = leftNew[index];
        if (!this.match(collections[0], element, scope)) {
          leftNew.splice(index, 1);
        }
      }
    }
    if (((_ref5 = collections[1]) != null ? _ref5.keys : void 0) && !rightNew.single) {
      for (index = _l = rightNew.length - 1; _l >= 0; index = _l += -1) {
        element = rightNew[index];
        if (!this.match(collections[1], element, scope)) {
          rightNew.splice(index, 1);
        }
      }
    }
    removed = [];
    added = [];
    for (index = _m = 0, _len1 = leftOld.length; _m < _len1; index = ++_m) {
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
      for (index = _n = _ref6 = leftOld.length, _ref7 = leftNew.length; _ref6 <= _ref7 ? _n < _ref7 : _n > _ref7; index = _ref6 <= _ref7 ? ++_n : --_n) {
        if (rightNew[index]) {
          added.push([leftNew[index], rightNew[index]]);
        }
      }
    }
    cleaned = [];
    for (_o = 0, _len2 = removed.length; _o < _len2; _o++) {
      pair = removed[_o];
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
    for (_p = 0, _len3 = added.length; _p < _len3; _p++) {
      pair = added[_p];
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
        this.engine.document.solve(operation.parent, contd + this.engine.PAIR, scope, void 0, true);
      }
    }
    for (_q = 0, _len4 = cleaned.length; _q < _len4; _q++) {
      contd = cleaned[_q];
      this.engine.queries.clean(contd);
    }
    cleaning = true;
    for (_r = 0, _len5 = leftNew.length; _r < _len5; _r++) {
      el = leftNew[_r];
      if (el) {
        cleaning = false;
        break;
      }
    }
    if (cleaning) {
      this.clean(left);
    }
    return this.engine.console.row('repair', [[added, removed], [leftNew, rightNew], [leftOld, rightOld]], left + this.engine.PAIR + right);
  };

  Pairs.prototype.clean = function(left) {
    var contd, index, op, operation, others, pairs, prefix, right, rights, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1, _results;
    if (pairs = (_ref = this.paths) != null ? _ref[left] : void 0) {
      rights = [];
      for (index = _i = 0, _len = pairs.length; _i < _len; index = _i += 3) {
        op = pairs[index];
        rights.push(op);
      }
      _ref1 = this.paths;
      for (prefix in _ref1) {
        others = _ref1[prefix];
        if (others !== pairs) {
          for (index = _j = rights.length - 1; _j >= 0; index = _j += -1) {
            right = rights[index];
            if (others.indexOf(right) > -1) {
              rights.splice(index, 1);
            }
          }
        }
      }
      for (_k = 0, _len1 = pairs.length; _k < _len1; _k += 3) {
        operation = pairs[_k];
        if (pairs.indexOf(others[index - 1]) > -1) {
          pairs.splice(index - 1, 3);
        }
      }
      for (_l = 0, _len2 = rights.length; _l < _len2; _l++) {
        right = rights[_l];
        this.engine.queries.unobserve(this.engine.scope._gss_id, this.engine.PAIR, null, right.substring(1));
        delete this.engine.queries[right];
      }
      delete this.paths[left];
    }
    index = 0;
    _results = [];
    while (contd = this.lefts[index + 1]) {
      if (contd === left) {
        _results.push(this.lefts.splice(index, 3));
      } else {
        _results.push(index += 3);
      }
    }
    return _results;
  };

  Pairs.prototype.set = function(path, result) {
    var left, pairs, watchers, _ref, _ref1, _results;
    if (pairs = (_ref = this.paths) != null ? _ref[path] : void 0) {
      return (this.dirty || (this.dirty = {}))[path] = true;
    } else if (path.charAt(0) === this.engine.PAIR) {
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

  return Pairs;

})();

module.exports = Pairs;
