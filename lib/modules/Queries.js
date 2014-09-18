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
    if (!node.nodeType) {
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

  Queries.prototype.add = function(node, continuation, operation, scope, key) {
    var collection, copy, el, index, keys, update, _base, _base1, _i, _len;
    collection = this.get(continuation);
    update = (_base = ((_base1 = this.engine.updating).queries || (_base1.queries = {})))[continuation] || (_base[continuation] = []);
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
        if (!this.comparePosition(el, node, operation[collection.keys[index]], operation[key])) {
          break;
        }
      }
      collection.splice(index, 0, node);
      keys.splice(index, 0, key);
      this.chain(collection[index - 1], node, continuation);
      this.chain(node, collection[index + 1], continuation);
      if (operation.parent.name === 'rule') {
        this.addMatch(node, continuation);
      }
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
      if (old && (updated = (_ref = this.engine.updating.queries) != null ? (_ref1 = _ref[operation]) != null ? _ref1[3] : void 0 : void 0)) {
        if (updated.length !== void 0) {
          if (result) {
            if (!this.engine.isCollection(result)) {
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

  Queries.prototype.removeFromNode = function(id, continuation, operation, scope, strict) {
    var collection, ref, result;
    collection = this.get(continuation);
    this.engine.pairs.remove(id, continuation);
    ref = continuation + (((collection != null ? collection.length : void 0) != null) && id || '');
    this.unobserve(id, ref);
    if (strict || ((result = this.get(continuation)) == null)) {
      return;
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
            if (duplicate == null) {
              duplicate = index;
            }
          }
        }
      }
    }
    if (operation && length && manual) {
      (_base = ((_base1 = ((_base2 = this.engine.updating).queries || (_base2.queries = {})))[continuation] || (_base1[continuation] = [])))[1] || (_base[1] = collection.slice());
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
        this.removeMatch(node, continuation);
        if (keys) {
          keys.splice(index, 1);
        }
        this.chain(collection[index - 1], node, continuation);
        this.chain(node, collection[index], continuation);
        return true;
      }
    }
  };

  Queries.prototype.remove = function(id, continuation, operation, scope, manual, strict) {
    var collection, node, parent, removed, _base, _base1, _base2, _ref;
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
      removed = this.removeFromCollection(node, continuation, operation, scope, manual);
      if (removed !== false) {
        this.removeFromNode(id, continuation, operation, scope, strict);
      }
      if (collection && !collection.length) {
        this.set(continuation, void 0);
      }
    } else if (node) {
      this.unobserve(id, true);
    }
    return removed;
  };

  Queries.prototype.clean = function(path, continuation, operation, scope, bind) {
    var contd, result, _ref, _ref1;
    if (path.def) {
      path = (continuation || '') + (path.uid || '') + (path.key || '');
    }
    if (bind) {
      continuation = path;
    }
    result = this.get(path);
    if ((result = this.get(path, void 0, true)) !== void 0) {
      this.each('remove', result, path, operation);
    }
    if (scope && operation.def.cleaning) {
      this.remove(this.engine.identity.find(scope), path, operation, scope, void 0, true);
    }
    this.engine.solved.remove(path);
    if ((_ref = this.engine.stylesheets) != null) {
      _ref.remove(path, this['style[type*="text/gss"]']);
    }
    this.set(path, void 0);
    if (this.qualified) {
      this.unobserve(this.qualified, path, true);
    }
    this.unobserve(this.engine.scope._gss_id, path);
    if (!result || !this.engine.isCollection(result)) {
      if (path.charAt(0) !== this.engine.PAIR) {
        contd = this.engine.getContinuation(path);
        if ((_ref1 = this.engine.updating) != null) {
          _ref1.remove(contd);
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

  Queries.prototype.updateOperationCollection = function(operation, path, scope, added, removed, strict) {
    var add, collection, oppath, remove, _i, _j, _len, _len1;
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
      return;
    }
    collection = this.get(oppath);
    if (removed && removed === collection) {
      return;
    }
    if (removed) {
      this.each('remove', removed, oppath, operation, scope, true, strict);
    }
    if (added) {
      return this.each('add', added, oppath, operation, scope, true);
    }
  };

  Queries.prototype.each = function(method, result, continuation, operation, scope, manual, strict) {
    var child, copy, returned, _i, _len;
    if (this.engine.isCollection(result)) {
      copy = result.slice();
      returned = void 0;
      for (_i = 0, _len = copy.length; _i < _len; _i++) {
        child = copy[_i];
        if (this[method](child, continuation, operation, scope, manual, strict)) {
          returned = true;
        }
      }
      return returned;
    } else if (typeof result === 'object') {
      return this[method](result, continuation, operation, scope, manual, strict);
    }
  };

  Queries.prototype.update = function(node, args, result, operation, continuation, scope) {
    var added, child, group, id, isCollection, old, path, pathed, queried, query, removed, watchers, _base, _base1, _base2, _base3, _base4, _i, _j, _len, _len1;
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
    if (added !== removed) {
      if (added || removed) {
        this.updateOperationCollection(operation, path, scope, added, removed, true);
      }
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
    if (result != null ? result.push : void 0) {
      result.isCollection = true;
    }
    this.set(path, result);
    return added;
  };

  Queries.prototype.set = function(path, result) {
    var index, item, removed, update, _base, _base1, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
    if (this.engine.updating) {
      update = (_base = ((_base1 = this.engine.updating).queries || (_base1.queries = {})))[path] || (_base[path] = []);
      if (update[1] === void 0) {
        update[1] = this[path] || null;
        if ((_ref = update[1]) != null ? _ref.length : void 0) {
          update[1] = update[1].slice();
        }
      }
    }
    if (result) {
      this[path] = result;
      if (this.engine.isCollection(result)) {
        for (index = _i = 0, _len = result.length; _i < _len; index = ++_i) {
          item = result[index];
          this.chain(result[index - 1], item, path);
        }
        if (item) {
          this.chain(item, void 0, path);
        }
      }
    } else {
      delete this[path];
    }
    if (removed = (_ref1 = this.engine.updating.queries) != null ? (_ref2 = _ref1[path]) != null ? _ref2[3] : void 0 : void 0) {
      for (_j = 0, _len1 = removed.length; _j < _len1; _j++) {
        item = removed[_j];
        this.match(item, '$pseudo', 'next', void 0, path);
        this.match(item, '$pseudo', 'first', void 0, path);
        this.match(item, '$pseudo', 'previous', void 0, path);
        this.match(item, '$pseudo', 'last', void 0, path);
      }
    }
    if ((_ref3 = this.engine.pairs) != null) {
      _ref3.set(path, result);
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
