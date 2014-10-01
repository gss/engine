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
    this.mutations = [];
  }

  Queries.prototype.onBeforeSolve = function() {
    var collection, contd, i, index, item, old, watcher, _i, _ref, _ref1;
    index = 0;
    while (this.mutations[index]) {
      watcher = this.mutations.splice(0, 3);
      this.engine.document.solve(watcher[0], watcher[1], watcher[2]);
    }
    index = 0;
    if (this.ascending) {
      while (this.ascending[index]) {
        contd = this.ascending[index + 1];
        collection = this[contd];
        if (old = (_ref = this.engine.updating) != null ? (_ref1 = _ref.collections) != null ? _ref1[contd] : void 0 : void 0) {
          collection = collection.slice();
          collection.isCollection = true;
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
    this.engine.console.error(continuation);
    if ((index = continuation.indexOf(this.engine.DESCEND)) > -1) {
      continuation = continuation.substring(index + 1);
    }
    this.engine.console.error(continuation, this.engine.getCanonicalSelector(continuation));
    continuation = this.engine.getCanonicalSelector(continuation);
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
      path = ' ' + this.engine.getCanonicalSelector(continuation);
      if (matches.indexOf(path) > -1) {
        return node.setAttribute('matches', matches.replace(path, ''));
      }
    }
  };

  Queries.prototype.add = function(node, continuation, operation, scope, key, contd) {
    var collection, dup, duplicates, el, index, keys, paths, scopes, _i, _j, _len, _len1;
    collection = this[continuation] || (this[continuation] = []);
    if (!collection.push) {
      return;
    }
    collection.isCollection = true;
    keys = collection.continuations || (collection.continuations = []);
    paths = collection.paths || (collection.paths = []);
    scopes = collection.scopes || (collection.scopes = []);
    this.snapshot(continuation, collection);
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
      duplicates = (collection.duplicates || (collection.duplicates = []));
      for (index = _j = 0, _len1 = duplicates.length; _j < _len1; index = ++_j) {
        dup = duplicates[index];
        if (dup === node) {
          if (keys[index] === key && scopes[index] === scope && paths[index] === contd) {
            return;
          }
        }
      }
      duplicates.push(node);
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

  Queries.prototype.unobserve = function(id, continuation, quick, path, contd, scope) {
    var index, matched, parent, query, refs, subscope, watcher, watchers, _ref;
    if (continuation !== true) {
      refs = this.engine.getPossibleContinuations(continuation);
    }
    index = 0;
    if (!(watchers = typeof id === 'object' && id || this.watchers[id])) {
      return;
    }
    while (watcher = watchers[index]) {
      query = watchers[index + 1];
      if (refs && (refs.indexOf(query) === -1 || (scope && scope !== watchers[index + 2]))) {
        index += 3;
        continue;
      }
      if (path) {
        parent = watcher;
        matched = false;
        while (parent) {
          if (parent.path === path || (((_ref = parent.path) != null ? _ref.substring(0, 6) : void 0) === '::this' && '::this' + path === parent.path)) {
            matched = true;
            break;
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
        this.clean(watcher, query, watcher, subscope, true, contd != null ? contd : query);
      }
    }
    if (!watchers.length && watchers === this.watchers[id]) {
      return delete this.watchers[id];
    }
  };

  Queries.prototype.filterByScope = function(collection, scope, operation, top) {
    var index, length, result, s, value, _i, _len, _ref;
    if (!(collection != null ? collection.scopes : void 0)) {
      return collection;
    }
    length = collection.length;
    result = [];
    if (operation) {
      operation = this.engine.pairs.getTopmostOperation(operation);
    }
    _ref = collection.scopes;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      s = _ref[index];
      if (s === scope) {
        if (operation && collection.continuations) {
          top = this.engine.pairs.getTopmostOperation(collection.continuations[index]);
          if (top !== operation) {
            continue;
          }
        }
        if (index < length) {
          value = collection[index];
        } else {
          value = collection.duplicates[index - length];
        }
        if (result.indexOf(value) === -1) {
          result.push(value);
        }
      }
    }
    return result;
  };

  Queries.prototype.snapshot = function(key, collection) {
    var c, collections, _base;
    if ((collections = (_base = this.engine.updating).collections || (_base.collections = {})).hasOwnProperty(key)) {
      return;
    }
    if (collection != null ? collection.push : void 0) {
      c = collection.slice();
      if (collection.isCollection) {
        c.isCollection = true;
      }
      if (collection.duplicates) {
        c.duplicates = collection.duplicates.slice();
      }
      if (collection.scopes) {
        c.scopes = collection.scopes.slice();
      }
      if (collection.continuations) {
        c.continuations = collection.continuations.slice();
      }
      collection = c;
    }
    return collections[key] = collection;
  };

  Queries.prototype.removeFromCollection = function(node, continuation, operation, scope, needle, contd) {
    var collection, dup, duplicate, duplicates, index, keys, length, negative, paths, refs, scopes, _i, _len, _ref;
    if (!((_ref = (collection = this.get(continuation))) != null ? _ref.continuations : void 0)) {
      return null;
    }
    length = collection.length;
    keys = collection.continuations;
    paths = collection.paths;
    scopes = collection.scopes;
    duplicate = null;
    if (contd == null) {
      refs = [void 0];
    } else {
      refs = this.engine.getPossibleContinuations(contd);
    }
    if ((duplicates = collection.duplicates)) {
      for (index = _i = 0, _len = duplicates.length; _i < _len; index = ++_i) {
        dup = duplicates[index];
        if (dup === node) {
          if ((refs.indexOf(paths[length + index]) > -1 && (keys[length + index] === needle)) && scopes[length + index] === scope) {
            this.snapshot(continuation, collection);
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
    if (operation && length && (needle != null)) {
      this.snapshot(continuation, collection);
      if ((index = collection.indexOf(node)) > -1) {
        if (keys) {
          negative = refs ? null : false;
          if (scopes[index] !== scope) {
            return negative;
          }
          if (refs.indexOf(paths[index]) === -1) {
            return negative;
          }
          if (keys[index] !== needle) {
            return negative;
          }
          this.snapshot(continuation, collection);
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
    var collection, node, parent, r, ref, removed, string, _ref;
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
      if (id.indexOf('"') > -1) {
        node = id;
      } else {
        node = this.engine.identity[id];
      }
    }
    if (continuation) {
      collection = this.get(continuation);
      if (parent = operation != null ? operation.parent : void 0) {
        if (this.engine.isCollection(collection)) {
          string = continuation + id;
        } else {
          string = continuation;
        }
        if ((_ref = parent.def.release) != null) {
          _ref.call(this.engine, node, operation, string, scope);
        }
      }
      collection = this.get(continuation);
      if (collection && this.engine.isCollection(collection)) {
        this.snapshot(continuation, collection);
      }
      r = removed = this.removeFromCollection(node, continuation, operation, scope, needle, contd);
      this.engine.pairs.remove(id, continuation);
      ref = continuation + (((collection != null ? collection.length : void 0) != null) && id || '');
      this.unobserve(id, ref, void 0, void 0, ref);
      if (recursion !== continuation) {
        if (removed !== null || !(parent != null ? parent.def.release : void 0)) {
          this.updateCollections(operation, continuation, scope, recursion, node, continuation, contd);
        }
        if (this.engine.isCollection(collection) && removed !== false) {
          this.clean(continuation + id);
        }
      }
    } else if (node) {
      this.unobserve(id, true);
    }
    return removed;
  };

  Queries.prototype.clean = function(path, continuation, operation, scope, bind, contd) {
    var i, result, s, shared, _i, _len, _ref, _ref1, _ref2, _ref3;
    if (path.def) {
      path = (continuation || '') + (path.uid || '') + (path.key || '');
    }
    if (bind) {
      continuation = path;
    }
    result = this.get(path);
    if ((result = this.get(path, void 0, true)) !== void 0) {
      this.each('remove', result, path, operation, scope, operation, false, contd);
    }
    if (scope && operation.def.cleaning) {
      this.remove(this.engine.identity.find(scope), path, operation, scope, operation, void 0, contd);
    }
    this.engine.solved.remove(path);
    if ((_ref = this.engine.stylesheets) != null) {
      _ref.remove(path);
    }
    if ((_ref1 = this.engine.stylesheets) != null) {
      _ref1.remove(path);
    }
    shared = false;
    if (this.engine.isCollection(result)) {
      if (result.scopes) {
        _ref2 = result.scopes;
        for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
          s = _ref2[i];
          if (s !== scope || (operation && result.continuations[i] !== operation)) {
            shared = true;
            break;
          }
        }
      }
    }
    if (!shared) {
      this.set(path, void 0);
    }
    if (this.mutations) {
      this.unobserve(this.mutations, path, true);
    }
    this.unobserve(this.engine.scope._gss_id, path);
    if (!result || !this.engine.isCollection(result)) {
      if (path.charAt(0) !== this.engine.PAIR) {
        contd = this.engine.getContinuation(path);
        if ((_ref3 = this.engine.updating) != null) {
          _ref3.remove(contd);
        }
        this.engine.provide(['remove', contd]);
      }
    }
    return true;
  };

  Queries.prototype.fetch = function(node, args, operation, continuation, scope) {
    var query, _ref, _ref1;
    node || (node = this.engine.getContext(args, operation, scope, node));
    query = this.engine.getQueryPath(operation, node);
    return (_ref = this.engine.updating) != null ? (_ref1 = _ref.queries) != null ? _ref1[query] : void 0 : void 0;
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
      this.updateCollection(operation, oppath, scope, added, removed, oppath, path);
    }
    return this.updateCollection(operation, path, scope, added, removed, recursion, contd || '');
  };

  Queries.prototype.updateCollection = function(operation, path, scope, added, removed, recursion, contd) {
    var collection, i, index, node, sorted, updated, _i, _len, _ref, _results,
      _this = this;
    if (removed) {
      this.each('remove', removed, path, operation, scope, operation, recursion, contd);
    }
    if (added) {
      this.each('add', added, path, operation, scope, operation, contd);
    }
    if ((_ref = (collection = this[path])) != null ? _ref.continuations : void 0) {
      sorted = collection.slice().sort(function(a, b) {
        var i, j;
        i = collection.indexOf(a);
        j = collection.indexOf(b);
        return _this.comparePosition(a, b, collection.continuations[i], collection.continuations[j]) && -1 || 1;
      });
      updated = void 0;
      _results = [];
      for (index = _i = 0, _len = sorted.length; _i < _len; index = ++_i) {
        node = sorted[index];
        if (node !== collection[index]) {
          if (!updated) {
            updated = collection.slice();
            if (this[path]) {
              this[path] = updated;
            }
            updated.continuations = collection.continuations.slice();
            updated.paths = collection.paths.slice();
            updated.scopes = collection.scopes.slice();
            updated.duplicates = collection.duplicates;
            updated.isCollection = collection.isCollection;
            updated[index] = node;
          }
          i = collection.indexOf(node);
          updated[index] = node;
          updated.continuations[index] = collection.continuations[i];
          updated.paths[index] = collection.paths[i];
          updated.scopes[index] = collection.scopes[i];
          this.chain(sorted[index - 1], node, path);
          _results.push(this.chain(node, sorted[index + 1], path));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  };

  Queries.prototype.each = function(method, result, continuation, operation, scope, needle, recursion, contd) {
    var child, copy, returned, _i, _len;
    if (result == null) {
      result = void 0;
    }
    if (this.engine.isCollection(result)) {
      copy = result.slice();
      returned = void 0;
      for (_i = 0, _len = copy.length; _i < _len; _i++) {
        child = copy[_i];
        if (this[method](child, continuation, operation, scope, needle, recursion, contd)) {
          returned = true;
        }
      }
      return returned;
    } else if (typeof result === 'object') {
      return this[method](result, continuation, operation, scope, needle, recursion, contd);
    }
  };

  Queries.prototype.update = function(node, args, result, operation, continuation, scope) {
    var added, child, id, index, isCollection, old, path, query, removed, watchers, _base, _base1, _base2, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    if (result == null) {
      result = void 0;
    }
    node || (node = this.engine.getContext(args, operation, scope, node));
    path = this.engine.getQueryPath(operation, continuation);
    old = this.get(path);
    if (!operation.def.relative && !operation.marked && (query = this.engine.getQueryPath(operation, node, scope)) && ((_ref = this.engine.updating.queries) != null ? _ref.hasOwnProperty(query) : void 0)) {
      result = this.engine.updating.queries[query];
    }
    if ((_ref1 = this.engine.updating.collections) != null ? _ref1.hasOwnProperty(path) : void 0) {
      old = this.engine.updating.collections[path];
    } else if ((old == null) && (result && result.length === 0) && continuation) {
      old = this.get(this.engine.getCanonicalPath(path));
    }
    isCollection = this.engine.isCollection(result);
    if (old) {
      if (this.engine.isCollection(old)) {
        removed = void 0;
        for (index = _i = 0, _len = old.length; _i < _len; index = ++_i) {
          child = old[index];
          if (!old.scopes || ((_ref2 = old.scopes) != null ? _ref2[index] : void 0) === scope) {
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
          watchers = (_base = this.watchers)[id] || (_base[id] = []);
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
    if (result != null ? result.continuations : void 0) {
      this.updateCollections(operation, path, scope, void 0, void 0, void 0, continuation);
    } else {
      this.updateCollections(operation, path, scope, added, removed, void 0, continuation);
    }
    if (id = this.engine.identity.provide(node)) {
      watchers = (_base1 = this.watchers)[id] || (_base1[id] = []);
      if (this.engine.indexOfTriplet(watchers, operation, continuation, scope) === -1) {
        watchers.push(operation, continuation, scope);
      }
    }
    if (query) {
      this.snapshot(query, old);
      ((_base2 = this.engine.updating).queries || (_base2.queries = {}))[query] = result;
    }
    this.snapshot(path, old);
    if (result === old) {
      return;
    }
    if (!(result != null ? result.push : void 0)) {
      this.set(path, result);
    }
    return added;
  };

  Queries.prototype.set = function(path, result) {
    var old, _ref;
    old = this[path];
    if (result == null) {
      this.snapshot(path, old);
    }
    if (result) {
      this[path] = result;
    } else {
      delete this[path];
    }
    if ((_ref = this.engine.pairs) != null) {
      _ref.set(path, result);
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
    var index, indexed, length, mutations, _i, _len, _ref;
    if ((indexed = groupped[qualifier]) || (fallback && groupped[fallback])) {
      if (this.engine.indexOfTriplet(this.mutations, operation, continuation, scope) === -1) {
        length = (continuation || '').length;
        _ref = this.mutations;
        for (index = _i = 0, _len = _ref.length; _i < _len; index = _i += 3) {
          mutations = _ref[index];
          if ((this.mutations[index + 1] || '').length > length) {
            break;
          }
        }
        this.mutations.splice(index, 0, operation, continuation, scope);
      }
    }
    return this;
  };

  Queries.prototype.getParentScope = function(continuation, operation) {
    var bit, bits, canonical, id, index, parent, _i;
    this.ScopeSplitterRegExp || (this.ScopeSplitterRegExp = new RegExp(this.engine.DESCEND + '|' + this.engine.ASCEND + '::this', 'g'));
    bits = continuation.split(this.ScopeSplitterRegExp);
    if (!bits[bits.length - 1]) {
      bits.pop();
    }
    bits.pop();
    for (index = _i = bits.length - 1; _i >= 0; index = _i += -1) {
      bit = bits[index];
      parent = operation.parent;
      canonical = this.engine.getCanonicalPath(bit);
      while (parent = parent.parent) {
        if (parent.name === 'rule' && parent[1].path === canonical) {
          break;
        }
      }
      if (parent) {
        break;
      }
      bits.splice(index, 1);
    }
    continuation = bits.join(this.engine.DESCEND);
    if (!continuation || (bits.length === 1 && bits[0].indexOf('style[type*="text/gss"]') > -1)) {
      return this.engine.scope;
    }
    if (id = continuation.match(this.engine.pairs.TrailingIDRegExp)) {
      if (id[1].indexOf('"') > -1) {
        return id[1];
      }
      return this.engine.identity[id[1]];
    } else {
      return this.engine.queries[continuation];
    }
  };

  Queries.prototype.getScopedCollection = function(operation, continuation, scope) {
    var collection, path;
    path = this.engine.getContinuation(this.engine.getCanonicalPath(continuation));
    collection = this.get(path);
    if (operation[1].marked) {
      collection = this.filterByScope(collection, scope);
    } else if (operation[1].def.mark) {
      collection = this.filterByScope(collection, this.getParentScope(continuation, operation));
    }
    return collection;
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
