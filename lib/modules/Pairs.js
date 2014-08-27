var Pairs;

Pairs = (function() {
  function Pairs(engine) {
    this.engine = engine;
    this.lefts = [];
    this.paths = {};
  }

  Pairs.prototype.onLeft = function(operation, continuation, scope) {
    var left;
    left = this.engine.getCanonicalPath(continuation);
    if (this.engine.indexOfTriplet(this.lefts, parent, left, scope) === -1) {
      this.lefts.push(parent, left, scope);
    }
    console.error('left', parent, left);
    return this.engine.RIGHT;
  };

  Pairs.prototype.onRight = function(operation, continuation, scope, left, right) {
    var index, pairs, pushed, _base;
    right = continuation.substring(1, continuation.length - 1);
    if ((index = this.lefts.indexOf(parent)) > -1) {
      left = this.lefts[index + 1];
      this.lefts.splice(index, 3);
      this.pair(operation, continuation, scope, left, right);
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
  };

  Pairs.prototype.getSolution = function(operation, continuation, scope) {
    var parent;
    console.log('get sol', continuation);
    if (continuation.charAt(continuation.length - 1) === this.engine.RIGHT) {
      parent = operation;
      while (parent = parent.parent) {
        if (parent.def.noop) {
          break;
        }
      }
      if (continuation.charAt(0) === this.engine.RIGHT) {
        return this.onRight(operation, continuation, scope);
      } else if (operation.def.serialized) {
        return this.onLeft(operation, continuation, scope);
      }
    }
  };

  Pairs.prototype.solve = function() {
    var dirty, index, pair, pairs, property, value, _i, _len;
    dirty = this.dirty;
    this.repairing = true;
    if (dirty) {
      for (property in dirty) {
        value = dirty[property];
        if (pairs = this.paths[property]) {
          for (index = _i = 0, _len = pairs.length; _i < _len; index = _i += 3) {
            pair = pairs[index];
            this.repair(property, pair, pairs[index + 1], pairs[index + 2], pairs[index + 3]);
          }
        }
      }
    }
    return delete this.repairing;
  };

  Pairs.prototype.repair = function(path, key, operation, scope, collected) {
    var added, contd, index, leftNew, leftOld, leftUpdate, object, pair, prefix, removed, rightNew, rightOld, rightPath, rightUpdate, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3;
    if (window.zzzz) {
      debugger;
    }
    leftUpdate = (_ref = this.engine.workflow.queries) != null ? _ref[path] : void 0;
    leftNew = ((leftUpdate != null ? leftUpdate[0] : void 0) !== void 0 ? leftUpdate[0] : this.get(path)) || [];
    if (leftNew.old !== void 0) {
      leftOld = leftNew.old || [];
    } else {
      leftOld = (leftUpdate ? leftUpdate[1] : this.get(path)) || [];
    }
    rightPath = this.engine.getScopePath(path) + key;
    rightUpdate = (_ref1 = this.engine.workflow.queries) != null ? _ref1[rightPath] : void 0;
    rightNew = rightUpdate && rightUpdate[0] || this.get(rightPath);
    if (!rightNew && collected) {
      rightNew = this.get(path + this.engine.identity.provide(leftNew[0] || leftOld[0]) + '→' + key);
    }
    rightNew || (rightNew = []);
    if (rightNew.old !== void 0) {
      rightOld = rightNew.old;
    } else if ((rightUpdate != null ? rightUpdate[1] : void 0) !== void 0) {
      rightOld = rightUpdate[1];
    } else if (!rightUpdate) {
      rightOld = this.get(rightPath);
      if (rightOld === void 0) {
        rightOld = rightNew;
      }
    }
    rightOld || (rightOld = []);
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
      for (index = _j = _ref2 = leftOld.length, _ref3 = leftNew.length; _ref2 <= _ref3 ? _j < _ref3 : _j > _ref3; index = _ref2 <= _ref3 ? ++_j : --_j) {
        if (rightNew[index]) {
          added.push([leftNew[index], rightNew[index]]);
        }
      }
    }
    for (_k = 0, _len1 = removed.length; _k < _len1; _k++) {
      pair = removed[_k];
      prefix = this.engine.getContinuation(path, pair[0], '→');
      this.remove(scope, prefix, null, null, null, true);
      this.clean(prefix + key, null, null, null, null, true);
    }
    for (_l = 0, _len2 = added.length; _l < _len2; _l++) {
      pair = added[_l];
      prefix = this.engine.getContinuation(path, pair[0], '→');
      contd = prefix + operation.path.substring(0, operation.path.length - operation.key.length);
      if (operation.path !== operation.key) {
        this.engine.document.solve(operation.parent, prefix + operation.path, scope, this.engine.UP, operation.index, pair[1]);
      } else {
        this.engine.document.solve(operation, contd, scope, this.engine.UP, true, true);
      }
    }
    return this.engine.console.row('repair', [[added, removed], [leftNew, rightNew], [leftOld, rightOld]], path);
  };

  Pairs.prototype.set = function(path, result) {
    var pairs, _ref;
    if (pairs = (_ref = this.paths) != null ? _ref[path] : void 0) {
      return (this.dirty || (this.dirty = {}))[path] = true;
    }
  };

  Pairs.prototype.unpair = function(continuation, node) {
    var collection, index, match, oppath, pair, pairs, path, schedule, _i, _len, _ref;
    if (!(match = this.isPaired(null, continuation))) {
      return;
    }
    path = this.engine.getCanonicalPath(match[1]);
    collection = this.get(path);
    if (!(pairs = (_ref = this.paths) != null ? _ref[path] : void 0)) {
      return;
    }
    console.log('unpair', continuation);
    debugger;
    oppath = this.engine.getCanonicalPath(continuation, true);
    for (index = _i = 0, _len = pairs.length; _i < _len; index = _i += 3) {
      pair = pairs[index];
      if (oppath !== pair) {
        continue;
      }
      schedule = (this.dirty || (this.dirty = {}))[path] = true;
    }
  };

  Pairs.prototype.watch = function() {};

  Pairs.prototype.unwatch = function() {};

  Pairs.prototype.clean = function(path) {
    if (this[path]) {
      return delete this[path];
    }
  };

  return Pairs;

})();

module.exports = Pairs;
