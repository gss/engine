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
    var property, _i, _len, _ref;
    this.engine = engine;
    this.watchers = {};
    this.mutations = [];
    this.engine.addEventListener('commit', this.commit.bind(this));
    if (!this.CanonicalizeRegExp) {
      _ref = ['PAIR', 'ASCEND', 'DESCEND', 'DELIMITERS', 'delimit'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        property = _ref[_i];
        Queries.prototype[property] = this.engine.Command.prototype[property];
      }
      Queries.prototype.CanonicalizeRegExp = new RegExp("" + "([^" + Queries.prototype.PAIR + ",])" + "\\$[^" + Queries.prototype.ASCEND + "]+" + "(?:" + Queries.prototype.ASCEND + "|$)", "g");
    }
  }

  Queries.prototype.commit = function(solution) {
    var collection, contd, i, index, item, old, op, watcher, _i, _ref, _ref1;
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
          op = this.ascending[index];
          this.engine.document.Command(op).ascend(this.engine.document, op, contd, this.ascending[index + 2], collection);
        }
        index += 3;
      }
      this.ascending = void 0;
    }
    return this;
  };

  Queries.prototype.addMatch = function(node, continuation) {
    var index;
    if (node.nodeType !== 1) {
      return;
    }
    if ((index = continuation.indexOf(this.DESCEND)) > -1) {
      continuation = continuation.substring(index + 1);
    }
    continuation = this.getCanonicalSelector(continuation);
    return node.setAttribute('matches', (node.getAttribute('matches') || '') + ' ' + continuation.replace(/\s+/, this.DESCEND));
  };

  Queries.prototype.removeMatch = function(node, continuation) {
    var index, matches, path;
    if (node.nodeType !== 1) {
      return;
    }
    if (matches = node.getAttribute('matches')) {
      if ((index = continuation.indexOf(this.DESCEND)) > -1) {
        continuation = continuation.substring(index + 1);
      }
      path = ' ' + this.getCanonicalSelector(continuation);
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
    } else if (!(scopes[index] === scope && paths[index] === contd)) {
      duplicates = (collection.duplicates || (collection.duplicates = []));
      for (index = _j = 0, _len1 = duplicates.length; _j < _len1; index = ++_j) {
        dup = duplicates[index];
        if (dup === node) {
          if (scopes[index] === scope && paths[index] === contd) {
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

  Queries.prototype.unobserve = function(id, continuation, quick, path, contd, scope, top) {
    var index, matched, parent, query, refs, subscope, watcher, watchers;
    if (continuation !== true) {
      refs = this.getVariants(continuation);
    }
    index = 0;
    if (!(watchers = typeof id === 'object' && id || this.watchers[id])) {
      return;
    }
    while (watcher = watchers[index]) {
      query = watchers[index + 1];
      if (refs && (refs.indexOf(query) === -1 || (scope && scope !== watchers[index + 2]) || (top && this.engine.Command.getRoot(watcher) !== top))) {
        index += 3;
        continue;
      }
      if (path) {
        parent = watcher;
        matched = false;
        while (parent) {
          if (parent.path === path) {
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
      operation = this.engine.Command.getRoot(operation);
    }
    _ref = collection.scopes;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      s = _ref[index];
      if (s === scope) {
        if (operation && collection.continuations) {
          top = this.engine.Command.getRoot(collection.continuations[index]);
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
    var collection, dup, duplicate, duplicates, index, keys, length, negative, paths, refs, scopes, _i, _len;
    collection = this.get(continuation);
    length = collection.length;
    keys = collection.continuations;
    paths = collection.paths;
    scopes = collection.scopes;
    duplicate = null;
    refs = this.getVariants(contd);
    if ((duplicates = collection.duplicates)) {
      for (index = _i = 0, _len = duplicates.length; _i < _len; index = ++_i) {
        dup = duplicates[index];
        if (dup === node) {
          if (refs.indexOf(paths[length + index]) > -1 && scopes[length + index] === scope) {
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
          negative = false;
          if (scopes[index] !== scope) {
            return null;
          }
          if (refs.indexOf(paths[index]) === -1) {
            return null;
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
        if (keys) {
          keys.splice(index, 1);
          paths.splice(index, 1);
          scopes.splice(index, 1);
        }
        this.chain(collection[index - 1], node, continuation);
        this.chain(node, collection[index], continuation);
        if (operation.parent.name === 'rule') {
          this.removeMatch(node, continuation);
        }
        return true;
      }
    }
  };

  Queries.prototype.remove = function(id, continuation, operation, scope, needle, recursion, contd) {
    var collection, node, parent, ref, removed, string, _base;
    if (needle == null) {
      needle = operation;
    }
    if (contd == null) {
      contd = continuation;
    }
    if (typeof id === 'object') {
      node = id;
      id = this.engine.identify(id);
    } else {
      if (id.indexOf('"') > -1) {
        node = id;
      } else {
        node = this.engine.identity[id];
      }
    }
    if (continuation) {
      collection = this.get(continuation);
      if (collection && this.engine.isCollection(collection)) {
        this.snapshot(continuation, collection);
        removed = this.removeFromCollection(node, continuation, operation, scope, needle, contd);
      } else {
        removed = void 0;
      }
      if (removed !== false) {
        this.engine.pairs.remove(id, continuation);
        if (parent = operation != null ? operation.parent : void 0) {
          if (this.engine.isCollection(collection)) {
            string = continuation + id;
          } else {
            string = continuation;
          }
          if (typeof (_base = parent.command).release === "function") {
            _base.release(node, this.engine, operation, string, scope);
          }
        }
        ref = continuation + (((collection != null ? collection.length : void 0) != null) && id || '');
        if (ref.charAt(0) === this.PAIR) {
          this.unobserve(id, ref, void 0, void 0, ref, scope);
        } else {
          this.unobserve(id, ref, void 0, void 0, ref);
        }
        if (recursion !== continuation) {
          if (removed !== false) {
            this.updateCollections(operation, continuation, scope, recursion, node, continuation, contd);
          }
          if (removed) {
            this.clean(continuation + id);
          }
        }
      }
    } else if (node) {
      this.unobserve(id, true);
    }
    return removed;
  };

  Queries.prototype.clean = function(path, continuation, operation, scope, bind, contd) {
    var command, i, result, s, shared, _i, _len, _ref, _ref1;
    if (command = path.command) {
      path = (continuation || '') + (operation.uid || '') + (command.selector || command.key || '');
    }
    if (bind) {
      continuation = path;
    }
    result = this.get(path);
    if ((result = this.get(path, void 0, true)) !== void 0) {
      this.each('remove', result, path, operation, scope, operation, false, contd);
    }
    this.engine.solved.remove(path);
    this.engine.intrinsic.remove(path);
    if ((_ref = this.engine.Stylesheet) != null) {
      _ref.remove(this.engine, path);
    }
    shared = false;
    if (this.engine.isCollection(result)) {
      if (result.scopes) {
        _ref1 = result.scopes;
        for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
          s = _ref1[i];
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
    this.unobserve((scope || this.engine.scope)._gss_id, path);
    if (!result || !this.engine.isCollection(result)) {
      this.engine.triggerEvent('remove', path);
    }
    return true;
  };

  Queries.prototype.fetch = function(args, operation, continuation, scope) {
    var node, query, _ref, _ref1, _ref2;
    node = ((_ref = args[0]) != null ? _ref.nodeType : void 0) === 1 ? args[0] : scope;
    query = operation.command.getPath(this.engine, operation, node);
    return (_ref1 = this.engine.updating) != null ? (_ref2 = _ref1.queries) != null ? _ref2[query] : void 0 : void 0;
  };

  Queries.prototype.chain = function(left, right, continuation) {
    if (left) {
      this.match(left, ':last', '*', void 0, continuation);
      this.match(left, ':next', '*', void 0, continuation);
    }
    if (right) {
      this.match(right, ':previous', '*', void 0, continuation);
      return this.match(right, ':first', '*', void 0, continuation);
    }
  };

  Queries.prototype.updateCollections = function(operation, path, scope, added, removed, recursion, contd) {
    var oppath;
    oppath = this.getCanonicalPath(path);
    if (path === oppath || this.PAIR + oppath === path) {

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

  Queries.prototype.update = function(args, result, operation, continuation, scope) {
    var added, child, command, engine, id, index, isCollection, node, old, path, query, removed, updating, watchers, _base, _base1, _base2, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
    if (result == null) {
      result = void 0;
    }
    engine = this.engine;
    updating = engine.updating;
    path = operation.command.getPath(engine, operation, continuation);
    old = this.get(path);
    command = operation.command;
    node = ((_ref = args[0]) != null ? _ref.nodeType : void 0) === 1 ? args[0] : scope;
    if (!command.relative && !command.marked && (query = operation.command.getPath(engine, operation, node, scope)) && ((_ref1 = updating.queries) != null ? _ref1.hasOwnProperty(query) : void 0)) {
      result = updating.queries[query];
    }
    if ((_ref2 = updating.collections) != null ? _ref2.hasOwnProperty(path) : void 0) {
      old = updating.collections[path];
    } else if ((old == null) && (result && result.length === 0) && continuation) {
      old = this.get(this.getCanonicalPath(path));
    }
    isCollection = engine.isCollection(result);
    if (old) {
      if (engine.isCollection(old)) {
        if ((continuation != null ? continuation.charAt(0) : void 0) === this.PAIR) {
          old = this.filterByScope(old, scope, operation);
        }
        removed = void 0;
        for (index = _i = 0, _len = old.length; _i < _len; index = ++_i) {
          child = old[index];
          if (!old.scopes || ((_ref3 = old.scopes) != null ? _ref3[index] : void 0) === scope) {
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
      } else if (continuation.charAt(0) === this.PAIR) {
        if (id = engine.identify(node)) {
          watchers = (_base = this.watchers)[id] || (_base[id] = []);
          if (engine.indexOfTriplet(watchers, operation, continuation, scope) === -1) {
            operation.command.prepare(operation);
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
    if (id = engine.identify(node)) {
      watchers = (_base1 = this.watchers)[id] || (_base1[id] = []);
      if (engine.indexOfTriplet(watchers, operation, continuation, scope) === -1) {
        operation.command.prepare(operation);
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
    if (!(id = this.engine.identify(node))) {
      return;
    }
    if (!(watchers = this.watchers[id])) {
      return;
    }
    if (continuation) {
      path = this.getCanonicalPath(continuation);
    }
    for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 3) {
      operation = watchers[index];
      if (groupped = operation.command[group]) {
        contd = watchers[index + 1];
        if (path && path !== this.getCanonicalPath(contd)) {
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

  Queries.prototype.getCanonicalCollection = function(path) {
    return this.get(this.getCanonicalPath(path));
  };

  Queries.prototype.comparePosition = function(a, b, op1, op2) {
    var i, index, j, left, next, parent, right;
    if (op1 !== op2) {
      parent = op1.parent;
      i = parent.indexOf(op1);
      j = parent.indexOf(op2);
      if (i > j) {
        left = op2;
        right = op1;
      } else {
        left = op1;
        right = op2;
      }
      index = i;
      while (next = parent[++index]) {
        if (next === right) {
          break;
        }
        if (next[0] === '$virtual') {
          return i < j;
        }
      }
      if (!(a.nodeType && b.nodeType)) {
        return i < j;
      }
    }
    if (a.compareDocumentPosition) {
      return a.compareDocumentPosition(b) & 4;
    }
    return a.sourceIndex < b.sourceIndex;
  };

  Queries.prototype.getScopePath = function(scope, continuation) {
    var bits, id, index, last, path, prev;
    if (!continuation) {
      return '';
    }
    bits = continuation.split(this.DESCEND);
    if (!bits[bits.length - 1]) {
      return continuation;
    }
    if (scope && this.engine.scope !== scope) {
      id = this.engine.identify(scope);
      prev = bits[bits.length - 2];
      if (prev && prev.substring(prev.length - id.length) !== id) {
        last = bits[bits.length - 1];
        if ((index = last.indexOf(id + this.ASCEND)) > -1) {
          bits.splice(bits.length - 1, 0, last.substring(0, index + id.length));
        }
      }
    }
    bits[bits.length - 1] = "";
    path = bits.join(this.DESCEND);
    if (continuation.charAt(0) === this.PAIR) {
      path = this.PAIR + path;
    }
    return path;
  };

  Queries.prototype.getParentScope = function(scope, continuation) {
    var bits, id, last, matched;
    if (!continuation) {
      return scope._gss_id;
    }
    bits = continuation.split(this.DESCEND);
    while (!(last = bits[bits.length - 1])) {
      bits.pop();
    }
    if (scope && this.engine.scope !== scope) {
      id = this.engine.identify(scope);
      if (last.substring(last.length - id.length) === id) {
        bits.pop();
        last = bits[bits.length - 1];
      }
    }
    if (last == null) {
      return this.engine.scope;
    }
    if (matched = last.match(this.engine.pairs.TrailingIDRegExp)) {
      if (matched[1].indexOf('"') > -1) {
        return matched[1];
      }
      return this.engine.identity[matched[1]];
    }
    return this.engine.queries[bits.join(this.DESCEND)];
  };

  Queries.prototype.getCanonicalPath = function(continuation, compact) {
    var bits, last;
    bits = this.delimit(continuation).split(this.DESCEND);
    last = bits[bits.length - 1];
    last = bits[bits.length - 1] = last.replace(this.CanonicalizeRegExp, '$1');
    if (compact) {
      return last;
    }
    return bits.join(this.DESCEND);
  };

  Queries.prototype.getVariants = function(path) {
    return [path, path + this.ASCEND, path + this.PAIR, path + this.DESCEND];
  };

  return Queries;

})();

module.exports = Queries;
