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
    var id, node, _i, _j, _len, _len1, _ref, _ref1, _results;
    if (this.removed) {
      _ref = this.removed;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        this.remove(id);
      }
      this.removed = void 0;
    }
    this.engine.pairs.solve();
    if (this.removing) {
      _ref1 = this.removing;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        node = _ref1[_j];
        _results.push(delete node._gss_id);
      }
      return _results;
    }
  };

  Queries.prototype.onSolve = function() {
    var collection, contd, i, index, item, old, _i, _ref, _ref1, _ref2, _ref3;
    index = 0;
    while (this.qualified[index]) {
      this.engine.document.solve(this.qualified[index], this.qualified[index + 1], this.qualified[index + 2]);
      index += 3;
    }
    index = 0;
    if (this.ascending) {
      console.error((_ref = this.ascending) != null ? _ref.slice() : void 0);
      while (this.ascending[index]) {
        contd = this.ascending[index + 1];
        collection = this[contd];
        if (old = (_ref1 = this.engine.workflow) != null ? (_ref2 = _ref1.queries) != null ? (_ref3 = _ref2[contd]) != null ? _ref3[1] : void 0 : void 0 : void 0) {
          collection = collection.slice();
          for (i = _i = collection.length - 1; _i >= 0; i = _i += -1) {
            item = collection[i];
            if (old.indexOf(item) > -1) {
              collection.splice(i, 1);
            }
          }
        }
        console.error(contd, collection, old);
        if (collection != null ? collection.length : void 0) {
          this.engine.document.expressions.ascend(this.ascending[index], contd, collection, this.ascending[index + 2]);
        }
        index += 3;
      }
      this.ascending = void 0;
    }
    return this;
  };

  Queries.prototype.add = function(node, continuation, operation, scope, key) {
    var collection, copy, el, index, keys, update, _base, _base1, _i, _len;
    collection = this.get(continuation);
    update = (_base = ((_base1 = this.engine.workflow).queries || (_base1.queries = {})))[continuation] || (_base[continuation] = []);
    if (update[1] === void 0) {
      update[1] = (copy = collection != null ? typeof collection.slice === "function" ? collection.slice() : void 0 : void 0) || null;
    }
    if (collection) {
      if (!collection.keys) {
        return;
      }
    } else {
      this[continuation] = collection = [];
    }
    keys = collection.keys || (collection.keys = []);
    if (collection.indexOf(node) === -1) {
      for (index = _i = 0, _len = collection.length; _i < _len; index = ++_i) {
        el = collection[index];
        if (this.comparePosition(el, node) !== 4) {
          break;
        }
      }
      collection.splice(index, 0, node);
      keys.splice(index - 1, 0, key);
      return true;
    } else {
      (collection.duplicates || (collection.duplicates = [])).push(node);
      keys.push(key);
      return;
    }
    return collection;
  };

  Queries.prototype.get = function(operation, continuation, old) {
    var result, upd, updated, _i, _len, _ref, _ref1;
    if (typeof operation === 'string') {
      result = this[operation];
      if (old && (updated = (_ref = this.engine.workflow.queries) != null ? (_ref1 = _ref[operation]) != null ? _ref1[3] : void 0 : void 0)) {
        if (updated.length !== void 0) {
          if (result) {
            if (result.length === void 0) {
              result = [result];
            } else {
              result = Array.prototype.slice.call(result);
            }
            for (_i = 0, _len = updated.length; _i < _len; _i++) {
              upd = updated[_i];
              if (result.indexOf(upd) === -1) {
                result.push(upd);
              }
            }
          } else {
            result || (result = updated);
          }
        }
      }
      if (typeof result === 'string') {
        return this[result];
      }
      return result;
    }
  };

  Queries.prototype.unobserve = function(id, continuation, pair, quick) {
    var contd, index, refs, subscope, watcher, watchers;
    if (continuation !== true) {
      refs = this.engine.getPossibleContinuations(continuation);
      if (typeof id !== 'object') {
        this.unpair(continuation, this.engine.identity[id]);
      }
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
      subscope = watchers[index + 2];
      watchers.splice(index, 3);
      if (!quick) {
        this.clean(watcher, contd, watcher, subscope, true, pair);
      }
    }
    if (!watchers.length) {
      return delete this.watchers[id];
    }
  };

  Queries.prototype.removeFromNode = function(id, continuation, operation, scope, pair, strict) {
    var collection, index, pairs, ref, result, subpath, _i, _len;
    collection = this.get(continuation);
    this.engine.pairs.remove(id, continuation);
    if (pairs = this.engine.pairs[continuation]) {
      for (index = _i = 0, _len = pairs.length; _i < _len; index = _i += 3) {
        subpath = pairs[index];
        this.remove(pairs[index + 2], continuation + id + '→', null, null, null, true);
        this.clean(continuation + id + '→' + subpath, null, null, null, null, true);
      }
    }
    ref = continuation + (((collection != null ? collection.length : void 0) != null) && id || '');
    this.unobserve(id, ref, pair);
    if ((result = this.get(continuation)) == null) {
      return;
    }
    console.error('remove from node', id, [continuation, this.engine.getCanonicalPath(continuation)]);
    if (window.zzzz) {
      debugger;
    }
    this.updateOperationCollection(operation, continuation, scope, void 0, this.engine.identity[id], true);
    if (result.length != null) {
      return this.clean(continuation + id);
    }
  };

  Queries.prototype.removeFromCollection = function(node, continuation, operation, scope, manual) {
    var collection, dup, duplicate, duplicates, index, keys, length, _base, _base1, _base2, _i, _len;
    if (!(collection = this.get(continuation))) {
      return;
    }
    length = collection.length;
    keys = collection.keys;
    duplicate = null;
    if ((duplicates = collection.duplicates)) {
      for (index = _i = 0, _len = duplicates.length; _i < _len; index = ++_i) {
        dup = duplicates[index];
        if (dup === node) {
          if (keys[length + index] === manual) {
            duplicates.splice(index, 1);
            keys.splice(length + index, 1);
            return false;
          } else {
            duplicate = index;
          }
        }
      }
    }
    if (operation && length && manual) {
      (_base = ((_base1 = ((_base2 = this.engine.workflow).queries || (_base2.queries = {})))[continuation] || (_base1[continuation] = [])))[1] || (_base[1] = collection.slice());
      if ((index = collection.indexOf(node)) > -1) {
        if (keys) {
          if (keys[index] !== manual) {
            return false;
          }
          if (duplicate != null) {
            duplicates.splice(duplicate, 1);
            keys[index] = keys[duplicate + length];
            keys.splice(duplicate + length, 1);
            return false;
          }
        }
        collection.splice(index, 1);
        if (keys) {
          keys.splice(index, 1);
        }
        this.chain(collection[index - 1], node, collection.slice(), continuation);
        this.chain(node, collection[index], collection.slice(), continuation);
        return true;
      }
    }
  };

  Queries.prototype.remove = function(id, continuation, operation, scope, manual, pair, strict) {
    var collection, node, removed, _base, _base1, _base2;
    if (typeof id === 'object') {
      node = id;
      id = this.engine.identity.provide(id);
    } else {
      node = this.engine.identity[id];
    }
    if (strict) {
      debugger;
    }
    if (continuation) {
      collection = this.get(continuation);
      console.error(continuation, collection);
      if ((collection != null ? collection.length : void 0) !== void 0) {
        (_base = ((_base1 = ((_base2 = this.engine.workflow).queries || (_base2.queries = {})))[continuation] || (_base1[continuation] = [])))[1] || (_base[1] = collection.slice());
      }
      removed = this.removeFromCollection(node, continuation, operation, scope, manual);
      if (removed !== false) {
        this.removeFromNode(id, continuation, operation, scope, pair, strict);
      }
      if (collection && !collection.length) {
        this.set(continuation, void 0);
      }
    } else if (node) {
      this.unobserve(id, true);
    }
    return removed;
  };

  Queries.prototype.clean = function(path, continuation, operation, scope, bind, pair) {
    var parent, result, _ref;
    if (path.def) {
      path = (continuation || '') + (path.uid || '') + (path.key || '');
    }
    if (bind) {
      continuation = path;
    }
    result = this.get(path);
    if (result != null ? result.nodeType : void 0) {
      this.unpair(path, result);
    }
    if (!pair) {
      if ((result = this.get(path, void 0, true)) !== void 0) {
        if (result) {
          if (parent = operation != null ? operation.parent : void 0) {
            if ((_ref = parent.def.release) != null) {
              _ref.call(this.engine, result, operation, continuation, scope);
            }
          }
          this.each('remove', result, path, operation);
        }
      }
    }
    if (scope && operation.def.cleaning) {
      this.remove(this.engine.identity.find(scope), path, operation);
    }
    this.engine.solved.remove(path);
    this.set(path, void 0);
    this.engine.pairs.clean(path);
    if (this.qualified) {
      this.unobserve(this.qualified, path, null, true);
    }
    this.unobserve(this.engine.scope._gss_id, path);
    if (!result || result.length === void 0) {
      this.engine.provide(['remove', this.engine.getContinuation(path)]);
    }
    return true;
  };

  Queries.prototype.fetch = function(node, args, operation, continuation, scope) {
    var query, _ref;
    node || (node = this.engine.getContext(args, operation, scope, node));
    if (this.engine.workflow.queries) {
      query = this.engine.getQueryPath(operation, node);
      return (_ref = this.engine.workflow.queries[query]) != null ? _ref[0] : void 0;
    }
  };

  Queries.prototype.chain = function(left, right, collection, continuation) {
    if (left) {
      this.match(left, '$pseudo', 'last', void 0, continuation);
      this.match(left, '$pseudo', 'next', void 0, continuation);
    }
    if (right) {
      this.match(right, '$pseudo', 'previous', void 0, continuation);
      return this.match(right, '$pseudo', 'first', void 0, continuation);
    }
  };

  Queries.prototype.updateOperationCollection = function(operation, path, scope, added, removed, strict) {
    var collection, oppath;
    oppath = this.engine.getCanonicalPath(path);
    if (path === oppath) {
      return;
    }
    collection = this.get(oppath);
    if (removed && removed === collection) {
      return;
    }
    if (removed) {
      this.each('remove', removed, oppath, operation, scope, true, null, strict);
    }
    if (added) {
      return this.each('add', added, oppath, operation, scope, true);
    }
  };

  Queries.prototype.each = function(method, result, continuation, operation, scope, manual, pair, strict) {
    var child, copy, returned, _i, _len;
    if (result.length !== void 0) {
      copy = result.slice();
      returned = void 0;
      for (_i = 0, _len = copy.length; _i < _len; _i++) {
        child = copy[_i];
        if (this[method](child, continuation, operation, scope, manual, pair, strict)) {
          returned = true;
        }
      }
      return returned;
    } else if (typeof result === 'object') {
      return this[method](result, continuation, operation, scope, manual, pair, strict);
    }
  };

  Queries.prototype.update = function(node, args, result, operation, continuation, scope) {
    var added, child, group, id, isCollection, old, path, pathed, queried, query, removed, watchers, _base, _base1, _base2, _base3, _i, _j, _len, _len1;
    node || (node = this.engine.getContext(args, operation, scope, node));
    path = this.engine.getQueryPath(operation, continuation);
    old = this.get(path);
    (_base = this.engine.workflow).queries || (_base.queries = {});
    if (pathed = this.engine.workflow.queries[path]) {
      old = pathed[1];
    }
    if (query = !operation.def.relative && this.engine.getQueryPath(operation, node, scope)) {
      if (queried = this.engine.workflow.queries[query]) {
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
    isCollection = result && result.length !== void 0;
    if (old) {
      if (old.length !== void 0) {
        removed = void 0;
        old = old.slice();
        for (_i = 0, _len = old.length; _i < _len; _i++) {
          child = old[_i];
          if (!result || Array.prototype.indexOf.call(result, child) === -1) {
            this.remove(child, path, operation, scope);
            (removed || (removed = [])).push(child);
          }
        }
      } else if (result !== old) {
        if (!result) {
          removed = old;
        }
        this.clean(path);
      }
    }
    if (isCollection) {
      added = void 0;
      for (_j = 0, _len1 = result.length; _j < _len1; _j++) {
        child = result[_j];
        if (!old || Array.prototype.indexOf.call(old, child) === -1) {
          (added || (added = [])).push(child);
        }
      }
      if (result && result.item) {
        result = Array.prototype.slice.call(result, 0);
      }
    } else {
      added = result;
    }
    if (added !== removed) {
      if (added || removed) {
        this.updateOperationCollection(operation, path, scope, added, removed, true);
      }
    }
    if (id = this.engine.identity.provide(node)) {
      watchers = (_base1 = this.watchers)[id] || (_base1[id] = []);
      if (this.engine.indexOfTriplet(watchers, operation, continuation, scope) === -1) {
        watchers.push(operation, continuation, scope);
      }
    }
    if (query) {
      group = (_base2 = this.engine.workflow.queries)[query] || (_base2[query] = []);
    }
    group = (_base3 = this.engine.workflow.queries)[path] || (_base3[path] = group || []);
    group[0] || (group[0] = result);
    group[1] || (group[1] = old);
    if (result === old) {
      return;
    }
    this.set(path, result);
    this.engine.pairs.set(path, result);
    return added;
  };

  Queries.prototype.set = function(path, result) {
    var index, item, removed, _i, _j, _len, _len1, _ref, _ref1;
    if (result) {
      this[path] = result;
      if (result.length !== void 0) {
        for (index = _i = 0, _len = result.length; _i < _len; index = ++_i) {
          item = result[index];
          this.chain(result[index - 1], item, result, path);
        }
        if (item) {
          this.chain(item, void 0, result, path);
        }
      }
    } else {
      delete this[path];
    }
    if (removed = (_ref = this.engine.workflow.queries) != null ? (_ref1 = _ref[path]) != null ? _ref1[3] : void 0 : void 0) {
      for (_j = 0, _len1 = removed.length; _j < _len1; _j++) {
        item = removed[_j];
        this.match(item, '$pseudo', 'next', void 0, path);
        this.match(item, '$pseudo', 'first', void 0, path);
        this.match(item, '$pseudo', 'previous', void 0, path);
        this.match(item, '$pseudo', 'last', void 0, path);
      }
    }
  };

  Queries.prototype.match = function(node, group, qualifier, changed, continuation) {
    var change, contd, groupped, id, index, operation, path, scope, watchers, _i, _j, _len, _len1;
    if (!(id = node._gss_id)) {
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

  Queries.prototype.comparePosition = function(a, b) {
    var _ref;
    return (_ref = typeof a.compareDocumentPosition === "function" ? a.compareDocumentPosition(b) : void 0) != null ? _ref : (a !== b && a.contains(b) && 16) + (a !== b && b.contains(a) && 8) + (a.sourceIndex >= 0 && b.sourceIndex >= 0 ? (a.sourceIndex < b.sourceIndex && 4) + (a.sourceIndex > b.sourceIndex && 2) : 1);
  };

  return Queries;

})();

module.exports = Queries;
