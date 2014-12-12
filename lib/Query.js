var Command, Query,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('./Command');

Query = (function(_super) {
  __extends(Query, _super);

  Query.prototype.type = 'Query';

  function Query(operation) {
    this.key = this.path = this.serialize(operation);
  }

  Query.prototype.ascend = function(engine, operation, continuation, scope, result, ascender) {
    var contd, node, parent, _base, _base1, _i, _len;
    if (parent = operation.parent) {
      if (engine.isCollection(result)) {
        for (_i = 0, _len = result.length; _i < _len; _i++) {
          node = result[_i];
          contd = this.fork(engine, continuation, node);
          if (!(typeof (_base = parent.command)["yield"] === "function" ? _base["yield"](node, engine, operation, contd, scope, ascender) : void 0)) {
            parent.command.solve(engine, parent, contd, scope, parent.indexOf(operation), node);
          }
        }
      } else {
        if (!(typeof (_base1 = parent.command)["yield"] === "function" ? _base1["yield"](result, engine, operation, continuation, scope, ascender) : void 0)) {
          if ((ascender != null) || !this.hidden || !this.reference) {
            return parent.command.solve(engine, parent, continuation, scope, parent.indexOf(operation), result);
          } else {
            return result;
          }
        }
      }
    }
  };

  Query.prototype.serialize = function(operation) {
    var argument, cmd, index, length, start, string, _i, _ref;
    if (this.prefix != null) {
      string = this.prefix;
    } else {
      string = operation[0];
    }
    if (typeof operation[1] === 'object') {
      start = 2;
    }
    length = operation.length;
    for (index = _i = _ref = start || 1; _ref <= length ? _i < length : _i > length; index = _ref <= length ? ++_i : --_i) {
      if (argument = operation[index]) {
        if (cmd = argument.command) {
          string += cmd.key;
        } else {
          string += argument;
          if (length - 1 > index) {
            string += this.separator;
          }
        }
      }
    }
    if (this.suffix) {
      string += this.suffix;
    }
    return string;
  };

  Query.prototype.push = function(operation) {
    var arg, cmd, i, index, inherited, match, tag, tags, _i, _j, _k, _l, _len, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
    for (index = _i = 1, _ref = operation.length; 1 <= _ref ? _i < _ref : _i > _ref; index = 1 <= _ref ? ++_i : --_i) {
      if (cmd = (_ref1 = operation[index]) != null ? _ref1.command : void 0) {
        inherited = this.inherit(cmd, inherited);
      }
    }
    if (tags = this.tags) {
      for (i = _j = 0, _len = tags.length; _j < _len; i = ++_j) {
        tag = tags[i];
        match = true;
        for (index = _k = 1, _ref2 = operation.length; 1 <= _ref2 ? _k < _ref2 : _k > _ref2; index = 1 <= _ref2 ? ++_k : --_k) {
          if (cmd = (_ref3 = (arg = operation[index])) != null ? _ref3.command : void 0) {
            if (!(((_ref4 = cmd.tags) != null ? _ref4.indexOf(tag) : void 0) > -1) || !this.checkers[tag](this, cmd, operation, arg, inherited)) {
              match = false;
              break;
            }
          }
        }
        if (match) {
          inherited = false;
          for (index = _l = 1, _ref5 = operation.length; 1 <= _ref5 ? _l < _ref5 : _l > _ref5; index = 1 <= _ref5 ? ++_l : --_l) {
            if (cmd = (_ref6 = (arg = operation[index])) != null ? _ref6.command : void 0) {
              inherited = this.mergers[tag](this, cmd, operation, arg, inherited);
            }
          }
        }
      }
    }
    return this;
  };

  Query.prototype.inherit = function(command, inherited) {
    var path;
    if (command.scoped) {
      this.scoped = command.scoped;
    }
    if (path = command.path) {
      if (inherited) {
        this.path += this.separator + path;
      } else {
        this.path = path + this.path;
      }
    }
    return true;
  };

  Query.prototype["continue"] = function(result, engine, operation, continuation) {
    if (continuation == null) {
      continuation = '';
    }
    return continuation + this.key;
  };

  Query.prototype.jump = function(engine, operation, continuation, scope, ascender, ascending) {
    var tail, _ref, _ref1;
    tail = this.tail;
    if ((((_ref = tail[1]) != null ? (_ref1 = _ref.command) != null ? _ref1.key : void 0 : void 0) != null) && (ascender == null) && (continuation.lastIndexOf(this.PAIR) === continuation.indexOf(this.PAIR))) {
      return tail[1].command.solve(engine, tail[1], continuation, scope);
    }
    return this.perform(engine, this.head, continuation, scope, ascender, ascending);
  };

  Query.prototype.prepare = function() {};

  Query.prototype.mergers = {};

  Query.prototype.checkers = {};

  Query.prototype.before = function(args, engine, operation, continuation, scope, ascender, ascending) {
    var node, query, _ref, _ref1, _ref2;
    node = ((_ref = args[0]) != null ? _ref.nodeType : void 0) === 1 ? args[0] : scope;
    query = operation.command.getPath(engine, operation, node);
    return (_ref1 = engine.updating) != null ? (_ref2 = _ref1.queries) != null ? _ref2[query] : void 0 : void 0;
  };

  Query.prototype.after = function(args, result, engine, operation, continuation, scope) {
    var added, child, command, id, index, isCollection, node, observers, old, path, query, removed, updating, _base, _base1, _base2, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
    updating = engine.updating;
    path = operation.command.getPath(engine, operation, continuation);
    old = this.get(engine, path);
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
          observers = (_base = engine.observers)[id] || (_base[id] = []);
          if (engine.indexOfTriplet(observers, operation, continuation, scope) === -1) {
            operation.command.prepare(operation);
            observers.push(operation, continuation, scope);
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
      observers = (_base1 = engine.observers)[id] || (_base1[id] = []);
      if (engine.indexOfTriplet(observers, operation, continuation, scope) === -1) {
        operation.command.prepare(operation);
        observers.push(operation, continuation, scope);
      }
    }
    if (query) {
      this.snapshot(engine, query, old);
      ((_base2 = engine.updating).queries || (_base2.queries = {}))[query] = result;
    }
    this.snapshot(engine, path, old);
    if (result === old) {
      return;
    }
    if (!(result != null ? result.push : void 0)) {
      this.set(path, result);
    }
    return added;
  };

  Query.prototype.commit = function(solution) {
    var collection, contd, i, index, item, old, op, watcher, _i, _ref, _ref1;
    if (this.mutations) {
      index = 0;
      while (this.mutations[index]) {
        watcher = this.mutations.splice(0, 3);
        this.engine.document.solve(watcher[0], watcher[1], watcher[2]);
      }
    }
    if (this.ascending) {
      index = 0;
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

  Query.prototype.add = function(engine, node, continuation, operation, scope, key, contd) {
    var collection, dup, duplicates, el, index, keys, paths, scopes, _i, _j, _len, _len1;
    collection = this[continuation] || (this[continuation] = []);
    if (!collection.push) {
      return;
    }
    collection.isCollection = true;
    keys = collection.continuations || (collection.continuations = []);
    paths = collection.paths || (collection.paths = []);
    scopes = collection.scopes || (collection.scopes = []);
    this.snapshot(engine, continuation, collection);
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
      if (operation.parent[0] === 'rule') {
        this.engine.Stylesheet.match(node, continuation);
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

  Query.prototype.get = function(operation, continuation, old) {
    var result;
    if (typeof operation === 'string') {
      result = this[operation];
      return result;
    }
  };

  Query.prototype.unobserve = function(engine, id, continuation, quick, path, contd, scope, top) {
    var index, matched, observers, parent, query, refs, subscope, watcher;
    if (continuation !== true) {
      refs = this.getVariants(continuation);
    }
    index = 0;
    if (!(observers = typeof id === 'object' && id || engine.observers[id])) {
      return;
    }
    while (watcher = observers[index]) {
      query = observers[index + 1];
      if (refs && (refs.indexOf(query) === -1 || (scope && scope !== observers[index + 2]) || (top && this.getRoot(watcher) !== top))) {
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
      subscope = observers[index + 2];
      observers.splice(index, 3);
      if (!quick) {
        this.clean(engine, watcher, query, watcher, subscope, true, contd != null ? contd : query);
      }
    }
    if (!observers.length && observers === engine.observers[id]) {
      return delete engine.observers[id];
    }
  };

  Query.prototype.snapshot = function(engine, key, collection) {
    var c, collections, _base;
    if ((collections = (_base = engine.updating).collections || (_base.collections = {})).hasOwnProperty(key)) {
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

  Query.prototype.removeFromCollection = function(engine, node, continuation, operation, scope, needle, contd) {
    var collection, dup, duplicate, duplicates, index, keys, length, negative, paths, refs, scopes, _i, _len;
    collection = this.get(engine, continuation);
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
            this.snapshot(engine, continuation, collection);
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
      this.snapshot(engine, continuation, collection);
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
        if (operation.parent[0] === 'rule') {
          this.engine.Stylesheet.unmatch(node, continuation);
        }
        return true;
      }
    }
  };

  Query.prototype.remove = function(id, continuation, operation, scope, needle, recursion, contd) {
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
        this.snapshot(engine, continuation, collection);
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
        this.unobserve(id, ref, void 0, void 0, ref);
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

  Query.prototype.clean = function(path, continuation, operation, scope, bind, contd) {
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

  Query.prototype.fetch = function(args, operation, continuation, scope) {
    var node, query, _ref, _ref1, _ref2;
    node = ((_ref = args[0]) != null ? _ref.nodeType : void 0) === 1 ? args[0] : scope;
    query = operation.command.getPath(this.engine, operation, node);
    return (_ref1 = this.engine.updating) != null ? (_ref2 = _ref1.queries) != null ? _ref2[query] : void 0 : void 0;
  };

  Query.prototype.chain = function(left, right, continuation) {
    if (left) {
      this.match(left, ':last', '*', void 0, continuation);
      this.match(left, ':next', '*', void 0, continuation);
    }
    if (right) {
      this.match(right, ':previous', '*', void 0, continuation);
      return this.match(right, ':first', '*', void 0, continuation);
    }
  };

  Query.prototype.updateCollections = function(operation, path, scope, added, removed, recursion, contd) {
    var oppath;
    oppath = this.getCanonicalPath(path);
    if (path !== oppath && recursion !== oppath) {
      this.updateCollection(operation, oppath, scope, added, removed, oppath, path);
    }
    return this.updateCollection(operation, path, scope, added, removed, recursion, contd || '');
  };

  Query.prototype.updateCollection = function(operation, path, scope, added, removed, recursion, contd) {
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

  Query.prototype.each = function(method, result, continuation, operation, scope, needle, recursion, contd) {
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

  Query.prototype.set = function(path, result) {
    var left, observers, old, _ref;
    old = this[path];
    if (result == null) {
      this.snapshot(engine, path, old);
    }
    if (result) {
      this[path] = result;
    } else {
      delete this[path];
    }
    path = this.getCanonicalPath(path);
    _ref = this.paths;
    for (left in _ref) {
      observers = _ref[left];
      if (observers.indexOf(path) > -1) {
        (this.dirty || (this.dirty = {}))[left] = true;
      }
    }
  };

  Query.prototype.onLeft = function(operation, parent, continuation, scope) {
    var left;
    left = this.getCanonicalPath(continuation);
    if (this.engine.Domain.prototype.indexOfTriplet(this.lefts, parent, left, scope) === -1) {
      parent.right = operation;
      this.lefts.push(parent, left, scope);
      return true;
    } else {
      (this.dirty || (this.dirty = {}))[left] = true;
      return false;
    }
  };

  Query.prototype.onRight = function(engine, operation, parent, continuation, scope, left, right) {
    var index, op, pairs, pushed, _base, _i, _len, _ref;
    right = this.getCanonicalPath(continuation.substring(0, continuation.length - 1));
    _ref = this.lefts;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = _i += 3) {
      op = _ref[index];
      if (op === parent && this.lefts[index + 2] === scope) {
        left = this.lefts[index + 1];
        this.watch(engine, operation, continuation, scope, left, right);
      }
    }
    if (!left) {
      return;
    }
    left = this.getCanonicalPath(left);
    pairs = (_base = this.paths)[left] || (_base[left] = []);
    if (pairs.indexOf(right) === -1) {
      pushed = pairs.push(right, operation, scope);
    }
    if (this.repairing === void 0) {
      (this.dirty || (this.dirty = {}))[left] = true;
    }
    return false;
  };

  Query.prototype.remove = function(id, continuation) {
    if (!this.paths[continuation]) {
      return;
    }
    return (this.dirty || (this.dirty = {}))[continuation] = true;
  };

  Query.prototype.retrieve = function(engine, operation, continuation, scope, ascender, ascending, single) {
    var contd, id, index, last, parent, prev, result;
    last = continuation.lastIndexOf(engine.PAIR);
    if (last > -1 && !operation.command.reference) {
      prev = -1;
      while ((index = continuation.indexOf(this.PAIR, prev + 1)) > -1) {
        if (result = this.retrieve(engine, operation, continuation.substring(prev + 1, index), scope, ascender, ascending, true)) {
          return result;
        }
        prev = index;
      }
      if (last === continuation.length - 1 && ascending) {
        parent = this.getRoot(operation);
        if (!parent.right || parent.right === operation) {
          return this.onLeft(engine, operation, parent, continuation, scope, ascender, ascending);
        } else {
          return this.onRight(engine, operation, parent, continuation, scope, ascender, ascending);
        }
      }
    } else {
      if (continuation.length === 1) {
        return;
      }
      contd = this.getCanonicalPath(continuation, true);
      if (contd.charAt(0) === this.PAIR) {
        contd = contd.substring(1);
      }
      if (contd === operation.command.path) {
        if (id = continuation.match(this.TrailingIDRegExp)) {
          if (id[1].indexOf('"') > -1) {
            return id[1];
          }
          return engine.identity[id[1]];
        } else {
          return engine.queries[continuation];
        }
      }
    }
  };

  Query.prototype.TrailingIDRegExp = /(\$[a-z0-9-_"]+)[↓↑→]?$/i;

  Query.prototype.repair = function() {
    var dirty, index, pair, pairs, property, value, _i, _len, _ref;
    if (!(dirty = this.dirty)) {
      return;
    }
    this.dirty = void 0;
    this.repairing = true;
    for (property in dirty) {
      value = dirty[property];
      if (pairs = (_ref = this.paths[property]) != null ? _ref.slice() : void 0) {
        for (index = _i = 0, _len = pairs.length; _i < _len; index = _i += 3) {
          pair = pairs[index];
          this.solve(property, pair, pairs[index + 1], pairs[index + 2]);
        }
      }
    }
    return this.repairing = void 0;
  };

  Query.prototype.match = function(collection, node, scope) {
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

  Query.prototype.count = function(value) {
    if (value != null ? value.push : void 0) {
      return value.length;
    } else {
      return (value != null) && 1 || 0;
    }
  };

  Query.prototype.pad = function(value, length) {
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

  Query.prototype.pair = function(left, right, operation, scope) {
    var I, J, added, cleaned, cleaning, contd, el, index, leftNew, leftOld, object, op, pair, removed, rightNew, rightOld, root, solved, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _n, _ref, _ref1;
    root = this.getRoot(operation);
    right = this.getScopePath(engine, scope, left) + root.right.command.path;
    leftNew = this.get(engine, left);
    rightNew = this.get(engine, right);
    if (engine.updating.collections.hasOwnProperty(left)) {
      leftOld = engine.updating.collections[left];
    } else {
      leftOld = leftNew;
    }
    if (this.engine.updating.collections.hasOwnProperty(right)) {
      rightOld = engine.updating.collections[right];
    } else {
      rightOld = rightNew;
    }
    if (operation.command.singular) {
      if (leftNew != null ? leftNew.push : void 0) {
        leftNew = leftNew[0];
      }
      if (leftOld != null ? leftOld.push : void 0) {
        leftOld = leftOld[0];
      }
    }
    if (root.right.command.singular) {
      if (rightNew != null ? rightNew.push : void 0) {
        rightNew = rightNew[0];
      }
      if (rightOld != null ? rightOld.push : void 0) {
        rightOld = rightOld[0];
      }
    }
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
      for (index = _j = _ref = leftOld.length, _ref1 = leftNew.length; _j < _ref1; index = _j += 1) {
        if (rightNew[index]) {
          added.push([leftNew[index], rightNew[index]]);
        }
      }
    }
    this.engine.console.group('%s \t\t\t\t%o\t\t\t%c%s', this.PAIR, [['pairs', added, removed], ['new', leftNew, rightNew], ['old', leftOld, rightOld]], 'font-weight: normal; color: #999', left + ' ' + PAIR + ' ' + root.right.command.path + ' in ' + this.engine.identify(scope));
    cleaned = [];
    for (_k = 0, _len1 = removed.length; _k < _len1; _k++) {
      pair = removed[_k];
      if (!pair[0] || !pair[1]) {
        continue;
      }
      contd = left;
      contd += engine.identify(pair[0]);
      contd += this.PAIR;
      contd += root.right.command.path;
      contd += engine.identify(pair[1]);
      cleaned.push(contd);
    }
    solved = [];
    for (_l = 0, _len2 = added.length; _l < _len2; _l++) {
      pair = added[_l];
      contd = left;
      contd += engine.identify(pair[0]);
      contd += this.PAIR;
      contd += root.right.command.path;
      contd += engine.identify(pair[1]);
      if ((index = cleaned.indexOf(contd)) > -1) {
        cleaned.splice(index, 1);
      } else {
        op = operation.parent;
        engine.document.solve(op, contd + this.PAIR, scope, true);
      }
    }
    for (_m = 0, _len3 = cleaned.length; _m < _len3; _m++) {
      contd = cleaned[_m];
      this.clean(engine, contd);
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
      this.unpair(engine, left, scope, operation);
    }
    return engine.console.groupEnd();
  };

  Query.prototype.unpair = function(engine, left, scope, operation) {
    var cleaning, contd, i, index, j, op, other, others, pairs, prefix, right, rights, top, _i, _j, _k, _l, _len, _len1, _len2, _m, _ref, _ref1;
    if (pairs = (_ref = this.paths) != null ? _ref[left] : void 0) {
      rights = [];
      top = this.getRoot(operation);
      for (index = _i = 0, _len = pairs.length; _i < _len; index = _i += 3) {
        op = pairs[index];
        if (pairs[index + 2] === scope && this.getRoot(pairs[index + 1]) === top) {
          rights.push(index);
        }
      }
      cleaning = rights.slice();
      top = this.getRoot(operation);
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
        this.unlisten(engine, scope._gss_id, this.PAIR, null, right.substring(1), void 0, scope, top);
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

  Query.prototype.listen = function(operation, continuation, scope, left, right) {
    var observers, _base;
    observers = (_base = this.paths)[left] || (_base[left] = []);
    if (this.engine.Domain.prototype.indexOfTriplet(observers, right, operation, scope) === -1) {
      return observers.push(right, operation, scope);
    }
  };

  Query.prototype.unlisten = function(operation, continuation, scope, left, right) {
    var index, observers, _base;
    observers = (_base = this.paths)[left] || (_base[left] = []);
    if ((index = this.engine.Domain.prototype.indexOfTriplet(observers, right, operation, scope)) !== -1) {
      return observers.splice(index, 3);
    }
  };

  Query.prototype.getScopePath = function(engine, scope, continuation) {
    var bits, id, index, last, path, prev;
    if (!continuation) {
      return '';
    }
    bits = continuation.split(this.DESCEND);
    if (!bits[bits.length - 1]) {
      return continuation;
    }
    if (scope && engine.scope !== scope) {
      id = engine.identify(scope);
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
    return path;
  };

  Query.prototype.getScope = function(engine, node, continuation) {
    var code, el, id, index, length, parent;
    if (!node) {
      if ((index = continuation.lastIndexOf('$')) > -1) {
        code = continuation.charCodeAt((length = continuation.length) - 1);
        if (continuation.charCodeAt((length = continuation.length) - 1) === 8595) {
          length--;
        }
        id = continuation.substring(index, length);
        if (el = engine.identity[id] || engine.queries[continuation.substring(0, length)]) {
          if (el.scoped) {
            if ((parent = engine.getScopeElement(el.parentNode)) === engine.scope) {
              return;
            }
            return node._gss_id;
          }
          return el._gss_id;
        }
      }
    } else if (node !== engine.scope) {
      return node._gss_id || node;
    }
  };

  Query.prototype.getParentScope = function(engine, scope, continuation, level) {
    var bit, id, index, j, last, result;
    if (level == null) {
      level = 1;
    }
    if (!continuation) {
      return scope._gss_id;
    }
    last = continuation.length - 1;
    if (continuation.charCodeAt(last) === 8594) {
      last = continuation.lastIndexOf(this.DESCEND, last) - 1;
    }
    while (true) {
      index = continuation.lastIndexOf(this.DESCEND, last);
      if ((bit = continuation.substring(index + 1, last + 1)) && bit.charCodeAt(0) !== 64 && --level === -1) {
        break;
      }
      if (index === -1) {
        return engine.scope;
      }
      last = index - 1;
    }
    if ((j = bit.lastIndexOf('$')) > -1) {
      id = bit.substring(j);
      if (id.indexOf('"') > -1) {
        return id;
      }
      if (result = engine.identity[id]) {
        return engine.getScopeElement(result);
      }
    }
    if (result = this[continuation.substring(0, index)]) {
      return engine.getScopeElement(result);
    }
    return engine.scope;
  };

  Query.prototype.getCanonicalPath = function(continuation, compact) {
    var bits, last;
    bits = this.delimit(continuation).split(this.DESCEND);
    last = bits[bits.length - 1];
    last = bits[bits.length - 1] = last.replace(this.CanonicalizeRegExp, '$1');
    if (compact) {
      return last;
    }
    return bits.join(this.DESCEND);
  };

  Query.prototype.getVariants = function(path) {
    return [path, path + this.ASCEND, path + this.PAIR, path + this.DESCEND];
  };

  Query.prototype.getCanonicalCollection = function(engine, path) {
    return engine.queries[this.getCanonicalPath(path)];
  };

  Query.prototype.getPath = function(engine, operation, continuation) {
    if (continuation) {
      if (continuation.nodeType) {
        return engine.identify(continuation) + ' ' + this.path;
      } else {
        return continuation + (this.selector || this.key);
      }
    } else {
      return this.selector || this.key;
    }
  };

  return Query;

})(Command);

module.exports = Query;
