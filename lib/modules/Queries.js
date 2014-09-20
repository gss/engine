/* Input: DOM Queries

 - Listens for changes in DOM,
 - Invalidates cached DOM Queries
   by bruteforcing combinators on reachable elements

 Input:  MutationEvent, processes observed mutations
 Output: Expressions, revaluates expressions

 State:  - `@[path]`: elements and collections by selector path
         - `@watchers[id]`: dom queries by element id
*/

var Queries;

Queries = (function() {
  function Queries(engine) {
    this.engine = engine;
    this.watchers = {};
    this.qualified = [];
  }

  Queries.prototype.onBeforeSolve = function() {
    var collection, contd, i, index, item, old, watcher, _i, _ref, _ref1, _ref2;
    index = 0;
    while (this.qualified[index]) {
      watcher = this.qualified.splice(0, 3);
      this.engine.document.solve(watcher[0], watcher[1], watcher[2]);
    }
    index = 0;
    if (this.ascending) {
      while (this.ascending[index]) {
        contd = this.ascending[index + 1];
        collection = this[contd];
        if (old = (_ref = this.engine.updating) != null ? (_ref1 = _ref.queries) != null ? (_ref2 = _ref1[contd]) != null ? _ref2[1] : void 0 : void 0 : void 0) {
          collection = collection.slice();
          for (i = _i = collection.length - 1; _i >= 0; i = _i += -1) {
            item = collection[i];
            if (old.indexOf(item) > -1) {
              collection.splice(i, 1);
            }
          }
        }
        if (collection != null ? collection.length : void 0) {
          this.engine.document.expressions.ascend(this.ascending[index], contd, collection, this.ascending[index + 2]);
        }
        index += 3;
      }
      this.ascending = void 0;
    }
    return this;
  };

  Queries.prototype.addMatch = function(node, continuation) {
    var index;
    if (!node.nodeType) {
      return;
    }
    if ((index = continuation.indexOf(this.engine.DESCEND)) > -1) {
      continuation = continuation.substring(index + 1);
    }
    continuation = continuation.replace(/\s+/, this.engine.DESCEND);
    return node.setAttribute('matches', (node.getAttribute('matches') || '') + ' ' + continuation.replace(/\s+/, this.engine.DESCEND));
  };

  Queries.prototype.removeMatch = function(node, continuation) {
    var index, matches, path;
    if (node.nodeType !== 1) {
      return;
    }
    if (matches = node.getAttribute('matches')) {
      if ((index = continuation.indexOf(this.engine.DESCEND)) > -1) {
        continuation = continuation.substring(index + 1);
      }
      path = ' ' + continuation.replace(/\s+/, this.engine.DESCEND);
      if (matches.indexOf(path) > -1) {
        return node.setAttribute('matches', matches.replace(path, ''));
      }
    }
  };

  Queries.prototype.add = function(node, continuation, operation, scope, key, contd) {
    var collection, copy, el, index, keys, paths, scopes, update, _base, _base1, _i, _len;
    collection = this[continuation] || (this[continuation] = []);
    if (!collection.push) {
      return;
    }
    collection.isCollection = true;
    update = (_base = ((_base1 = this.engine.updating).queries || (_base1.queries = {})))[continuation] || (_base[continuation] = []);
    if (update[1] === void 0) {
      update[1] = (copy = collection != null ? typeof collection.slice === "function" ? collection.slice() : void 0 : void 0) || null;
    }
    keys = collection.keys || (collection.keys = []);
    paths = collection.paths || (collection.paths = []);
    scopes = collection.scopes || (collection.scopes = []);
    if ((index = collection.indexOf(node)) === -1) {
      for (index = _i = 0, _len = collection.length; _i < _len; index = ++_i) {
        el = collection[index];
        if (!this.comparePosition(el, node, keys[index], key)) {
          break;
        }
      }
      collection.splice(index, 0, node);
      keys.splice(index, 0, key);
      paths.splice(index, 0, contd);
      scopes.splice(index, 0, scope);
      this.chain(collection[index - 1], node, continuation);
      this.chain(node, collection[index + 1], continuation);
      if (operation.parent.name === 'rule') {
        this.addMatch(node, continuation);
      }
      return true;
    } else {
      (collection.duplicates || (collection.duplicates = [])).push(node);
      keys.push(key);
      paths.push(contd);
      scopes.push(scope);
      return;
    }
    return collection;
  };

  Queries.prototype.get = function(operation, continuation, old) {
    var result;
    if (typeof operation === 'string') {
      result = this[operation];
      return result;
    }
  };

  Queries.prototype.unobserve = function(id, continuation, quick, path) {
    var contd, index, matched, parent, refs, subscope, watcher, watchers;
    if (continuation !== true) {
      refs = this.engine.getPossibleContinuations(continuation);
    }
    index = 0;
    if (!(watchers = typeof id === 'object' && id || this.watchers[id])) {
      return;
    }
    while (watcher = watchers[index]) {
      contd = watchers[index + 1];
      if (refs && refs.indexOf(contd) === -1) {
        index += 3;
        continue;
      }
      if (path) {
        parent = watcher;
        matched = false;
        while (parent) {
          if (parent.path === path) {
            matched = true;
          }
          parent = parent.parent;
        }
        if (!matched) {
          index += 3;
          continue;
        }
      }
      subscope = watchers[index + 2];
      watchers.splice(index, 3);
      if (!quick) {
        this.clean(watcher, contd, watcher, subscope, true);
      }
    }
    if (!watchers.length && watchers === this.watchers[id]) {
      return delete this.watchers[id];
    }
  };

  Queries.prototype.removeFromCollection = function(node, continuation, operation, scope, needle, contd) {
    var collection, dup, duplicate, duplicates, index, keys, length, paths, scopes, _base, _base1, _base2, _i, _len;
    if (!(collection = this.get(continuation))) {
      return;
    }
    length = collection.length;
    keys = collection.keys;
    paths = collection.paths;
    scopes = collection.scopes;
    duplicate = null;
    if ((duplicates = collection.duplicates)) {
      for (index = _i = 0, _len = duplicates.length; _i < _len; index = ++_i) {
        dup = duplicates[index];
        if (dup === node) {
          if ((keys[length + index] === needle && scopes[length + index] === scope) && contd === paths[length + index]) {
            duplicates.splice(index, 1);
            keys.splice(length + index, 1);
            paths.splice(length + index, 1);
            scopes.splice(length + index, 1);
            return false;
          } else {
            if (duplicate == null) {
              duplicate = index;
            }
          }
        }
      }
    }
    if (operation && length && needle) {
      (_base = ((_base1 = ((_base2 = this.engine.updating).queries || (_base2.queries = {})))[continuation] || (_base1[continuation] = [])))[1] || (_base[1] = collection.slice());
      if ((index = collection.indexOf(node)) > -1) {
        if (keys) {
          if (!(keys[index] === needle && scopes[index] === scope)) {
            return false;
          }
          if (duplicate != null) {
            duplicates.splice(duplicate, 1);
            paths[index] = paths[duplicate + length];
            paths.splice(duplicate + length, 1);
            keys[index] = keys[duplicate + length];
            keys.splice(duplicate + length, 1);
            scopes[index] = scopes[duplicate + length];
            scopes.splice(duplicate + length, 1);
            return false;
          }
        }
        collection.splice(index, 1);
        this.removeMatch(node, continuation);
        if (keys) {
          keys.splice(index, 1);
          paths.splice(index, 1);
          scopes.splice(index, 1);
        }
        this.chain(collection[index - 1], node, continuation);
        this.chain(node, collection[index], continuation);
        return true;
      }
    }
  };

  Queries.prototype.remove = function(id, continuation, operation, scope, needle, recursion, contd) {
    var collection, node, parent, ref, removed, _base, _base1, _base2, _ref;
    if (needle == null) {
      needle = operation;
    }
    if (contd == null) {
      contd = continuation;
    }
    if (typeof id === 'object') {
      node = id;
      id = this.engine.identity.provide(id);
    } else {
      node = this.engine.identity[id];
    }
    if (continuation) {
      if (parent = operation != null ? operation.parent : void 0) {
        if ((_ref = parent.def.release) != null) {
          _ref.call(this.engine, node, operation, continuation, scope);
        }
      }
      collection = this.get(continuation);
      if (collection && this.engine.isCollection(collection)) {
        (_base = ((_base1 = ((_base2 = this.engine.updating).queries || (_base2.queries = {})))[continuation] || (_base1[continuation] = [])))[1] || (_base[1] = collection.slice());
      }
      removed = this.removeFromCollection(node, continuation, operation, scope, needle, contd);
      this.engine.pairs.remove(id, continuation);
      collection = this.get(continuation);
      ref = continuation + (((collection != null ? collection.length : void 0) != null) && id || '');
      this.unobserve(id, ref);
      if (recursion !== continuation) {
        this.updateCollections(operation, continuation, scope, recursion, node, continuation, continuation);
        if (this.engine.isCollection(collection) && removed !== false) {
          this.clean(continuation + id);
        }
      }
    } else if (node) {
      this.unobserve(id, true);
    }
    return removed;
  };

  Queries.prototype.clean = function(path, continuation, operation, scope, bind) {
    var contd, result, _ref, _ref1, _ref2;
    if (path.def) {
      path = (continuation || '') + (path.uid || '') + (path.key || '');
    }
    if (bind) {
      continuation = path;
    }
    result = this.get(path);
    if ((result = this.get(path, void 0, true)) !== void 0) {
      this.each('remove', result, path, operation, scope, void 0, void 0, continuation);
    }
    if (scope && operation.def.cleaning) {
      this.remove(this.engine.identity.find(scope), path, operation, scope, operation);
    }
    this.engine.solved.remove(path);
    if ((_ref = this.engine.stylesheets) != null) {
      _ref.remove(path);
    }
    if ((_ref1 = this.engine.stylesheets) != null) {
      _ref1.remove(path);
    }
    this.set(path, void 0);
    if (this.qualified) {
      this.unobserve(this.qualified, path, true);
    }
    this.unobserve(this.engine.scope._gss_id, path);
    if (!result || !this.engine.isCollection(result)) {
      if (path.charAt(0) !== this.engine.PAIR) {
        contd = this.engine.getContinuation(path);
        if ((_ref2 = this.engine.updating) != null) {
          _ref2.remove(contd);
        }
        this.engine.provide(['remove', contd]);
      }
    }
    return true;
  };

  Queries.prototype.fetch = function(node, args, operation, continuation, scope) {
    var query, _ref, _ref1;
    node || (node = this.engine.getContext(args, operation, scope, node));
    if ((_ref = this.engine.updating) != null ? _ref.queries : void 0) {
      query = this.engine.getQueryPath(operation, node);
      return (_ref1 = this.engine.updating.queries[query]) != null ? _ref1[0] : void 0;
    }
  };

  Queries.prototype.chain = function(left, right, continuation) {
    if (left) {
      this.match(left, '$pseudo', 'last', void 0, continuation);
      this.match(left, '$pseudo', 'next', void 0, continuation);
    }
    if (right) {
      this.match(right, '$pseudo', 'previous', void 0, continuation);
      return this.match(right, '$pseudo', 'first', void 0, continuation);
    }
  };

  Queries.prototype.updateCollections = function(operation, path, scope, added, removed, recursion, contd) {
    var add, oppath, remove, _i, _j, _len, _len1;
    oppath = this.engine.getCanonicalPath(path);
    if (path === oppath || this.engine.PAIR + oppath === path) {
      if (operation) {
        if (operation.bound && (operation.path !== operation.key)) {
          if (added) {
            if (this.engine.isCollection(added)) {
              for (_i = 0, _len = added.length; _i < _len; _i++) {
                add = added[_i];
                this.addMatch(add, path);
              }
            } else {
              this.addMatch(added, path);
            }
          }
        }
      }
      if (removed) {
        if (this.engine.isCollection(removed)) {
          for (_j = 0, _len1 = removed.length; _j < _len1; _j++) {
            remove = removed[_j];
            this.removeMatch(remove, path);
          }
        } else {
          this.removeMatch(removed, path);
        }
      }
    } else if (recursion !== oppath) {
      this.updateCollection(operation, oppath, scope, added, removed, oppath, contd);
    }
    return this.updateCollection(operation, path, scope, added, removed, recursion, contd);
  };

  Queries.prototype.updateCollection = function(operation, path, scope, added, removed, recursion, contd) {
    var collection, i, index, node, sorted, updated, _i, _len, _ref, _ref1,
      _this = this;
    if (removed) {
      this.each('remove', removed, path, operation, scope, operation, recursion, contd);
    }
    if (((_ref = (collection = this[path])) != null ? _ref.keys : void 0) && added === collection) {
      return;
    }
    if (added) {
      this.each('add', added, path, operation, scope, operation, contd);
    }
    if ((_ref1 = (collection = this[path])) != null ? _ref1.keys : void 0) {
      sorted = collection.slice().sort(function(a, b) {
        var i, j;
        i = collection.indexOf(a);
        j = collection.indexOf(b);
        return _this.comparePosition(a, b, collection.keys[i], collection.keys[j]) && -1 || 1;
      });
      updated = void 0;
      for (index = _i = 0, _len = sorted.length; _i < _len; index = ++_i) {
        node = sorted[index];
        if (node !== collection[index]) {
          if (!updated) {
            this[path] = updated = collection.slice();
            updated.keys = collection.keys.slice();
            updated.paths = collection.paths.slice();
            updated.scopes = collection.scopes.slice();
            updated[index] = node;
          }
          i = collection.indexOf(node);
          updated[index] = node;
          updated.keys[index] = collection.keys[i];
          updated.paths[index] = collection.paths[i];
          updated.scopes[index] = collection.scopes[i];
          this.chain(sorted[index - 1], node, path);
          this.chain(node, sorted[index + 1], path);
        }
      }
      if (updated) {
        collection.splice();
        collection.push.apply(collection, updated);
        collection.keys = updated.keys;
        collection.paths = updated.keys;
        return collection.scopes = updated.keys;
      }
    }
  };

  Queries.prototype.each = function(method, result, continuation, operation, scope, needle, recursion) {
    var child, copy, returned, _i, _len;
    if (result == null) {
      result = void 0;
    }
    if (this.engine.isCollection(result)) {
      copy = result.slice();
      returned = void 0;
      for (_i = 0, _len = copy.length; _i < _len; _i++) {
        child = copy[_i];
        if (this[method](child, continuation, operation, scope, needle, recursion)) {
          returned = true;
        }
      }
      return returned;
    } else if (typeof result === 'object') {
      return this[method](result, continuation, operation, scope, needle, recursion);
    }
  };

  Queries.prototype.update = function(node, args, result, operation, continuation, scope) {
    var added, child, group, id, index, isCollection, old, path, pathed, queried, query, removed, watchers, _base, _base1, _base2, _base3, _base4, _i, _j, _len, _len1, _ref;
    if (result == null) {
      result = void 0;
    }
    node || (node = this.engine.getContext(args, operation, scope, node));
    path = this.engine.getQueryPath(operation, continuation);
    old = this.get(path);
    (_base = this.engine.updating).queries || (_base.queries = {});
    if (pathed = this.engine.updating.queries[path]) {
      old = pathed[1];
    }
    if (query = !operation.def.relative && this.engine.getQueryPath(operation, node, scope)) {
      if (queried = this.engine.updating.queries[query]) {
        if (old == null) {
          old = queried[1];
        }
        if (result == null) {
          result = queried[0];
        }
      }
    }
    if ((old == null) && (result && result.length === 0) && continuation) {
      old = this.get(this.engine.getCanonicalPath(path));
    }
    isCollection = this.engine.isCollection(result);
    if (old) {
      if (this.engine.isCollection(old)) {
        removed = void 0;
        for (index = _i = 0, _len = old.length; _i < _len; index = ++_i) {
          child = old[index];
          if (!old.scopes || ((_ref = old.scopes) != null ? _ref[index] : void 0) === scope) {
            if (!result || Array.prototype.indexOf.call(result, child) === -1) {
              (removed || (removed = [])).push(child);
            }
          }
        }
      } else if (result !== old) {
        if (!result) {
          removed = old;
        }
        this.clean(path, void 0, operation, scope);
      } else if (continuation.charAt(0) === this.engine.PAIR) {
        if (id = this.engine.identity.provide(node)) {
          watchers = (_base1 = this.watchers)[id] || (_base1[id] = []);
          if (this.engine.indexOfTriplet(watchers, operation, continuation, scope) === -1) {
            watchers.push(operation, continuation, scope);
          }
        }
        return old;
      } else {
        return;
      }
    }
    if (isCollection) {
      this[path] || (this[path] = []);
      added = void 0;
      for (_j = 0, _len1 = result.length; _j < _len1; _j++) {
        child = result[_j];
        if (!old || Array.prototype.indexOf.call(old, child) === -1) {
          (added || (added = [])).push(child);
          added.isCollection = true;
        }
      }
      if (result && result.item) {
        result = Array.prototype.slice.call(result, 0);
      }
    } else {
      added = result;
      removed = old;
    }
    if (!(added != null ? added.keys : void 0)) {
      this.updateCollections(operation, path, scope, added, removed, void 0, continuation);
    }
    if (id = this.engine.identity.provide(node)) {
      watchers = (_base2 = this.watchers)[id] || (_base2[id] = []);
      if (this.engine.indexOfTriplet(watchers, operation, continuation, scope) === -1) {
        watchers.push(operation, continuation, scope);
      }
    }
    if (query) {
      group = (_base3 = this.engine.updating.queries)[query] || (_base3[query] = []);
    }
    group = (_base4 = this.engine.updating.queries)[path] || (_base4[path] = group || []);
    group[0] || (group[0] = result);
    group[1] || (group[1] = old);
    if (result === old) {
      return;
    }
    if (!(result != null ? result.push : void 0)) {
      this.set(path, result);
    }
    return added;
  };

  Queries.prototype.set = function(path, result) {
    var old, _base, _base1, _base2, _ref, _ref1;
    old = this[path];
    if (result == null) {
      (_base = ((_base1 = ((_base2 = this.engine.updating).queries || (_base2.queries = {})))[path] || (_base1[path] = [])))[1] || (_base[1] = (_ref = old && old.slice && old.slice() || old) != null ? _ref : null);
    }
    if (result) {
      this[path] = result;
    } else {
      delete this[path];
    }
    if ((_ref1 = this.engine.pairs) != null) {
      _ref1.set(path, result);
    }
  };

  Queries.prototype.match = function(node, group, qualifier, changed, continuation) {
    var change, contd, groupped, id, index, operation, path, scope, watchers, _i, _j, _len, _len1;
    if (!(id = this.engine.identity.provide(node))) {
      return;
    }
    if (!(watchers = this.watchers[id])) {
      return;
    }
    if (continuation) {
      path = this.engine.getCanonicalPath(continuation);
    }
    for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 3) {
      operation = watchers[index];
      if (groupped = operation[group]) {
        contd = watchers[index + 1];
        if (path && path !== this.engine.getCanonicalPath(contd)) {
          continue;
        }
        scope = watchers[index + 2];
        if (qualifier) {
          this.qualify(operation, contd, scope, groupped, qualifier);
        } else if (changed.nodeType) {
          this.qualify(operation, contd, scope, groupped, changed.tagName, '*');
        } else if (typeof changed === 'string') {
          this.qualify(operation, contd, scope, groupped, changed, '*');
        } else {
          for (_j = 0, _len1 = changed.length; _j < _len1; _j++) {
            change = changed[_j];
            if (typeof change === 'string') {
              this.qualify(operation, contd, scope, groupped, change, '*');
            } else {
              this.qualify(operation, contd, scope, groupped, change.tagName, '*');
            }
          }
        }
      }
    }
    return this;
  };

  Queries.prototype.qualify = function(operation, continuation, scope, groupped, qualifier, fallback) {
    var index, indexed, length, qualified, _i, _len, _ref;
    if ((indexed = groupped[qualifier]) || (fallback && groupped[fallback])) {
      if (this.engine.indexOfTriplet(this.qualified, operation, continuation, scope) === -1) {
        length = (continuation || '').length;
        _ref = this.qualified;
        for (index = _i = 0, _len = _ref.length; _i < _len; index = _i += 3) {
          qualified = _ref[index];
          if ((this.qualified[index + 1] || '').length > length) {
            break;
          }
        }
        this.qualified.splice(index, 0, operation, continuation, scope);
      }
    }
    return this;
  };

  Queries.prototype.comparePosition = function(a, b, op1, op2) {
    var index, left, next, right;
    if (op1 !== op2) {
      if (op1.index > op2.index) {
        left = op2;
        right = op1;
      } else {
        left = op1;
        right = op2;
      }
      index = left.index;
      while (next = op1.parent[++index]) {
        if (next === right) {
          break;
        }
        if (next[0] === '$virtual') {
          return op1.index < op2.index;
        }
      }
      if (!(a.nodeType && b.nodeType)) {
        return op1.index < op2.index;
      }
    }
    if (a.compareDocumentPosition) {
      return a.compareDocumentPosition(b) & 4;
    }
    return a.sourceIndex < b.sourceIndex;
  };

  return Queries;

})();

module.exports = Queries;
