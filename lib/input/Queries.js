var Queries;

Queries = (function() {
  Queries.prototype.options = {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
    attributeOldValue: true
  };

  Queries.prototype.Observer = window.MutationObserver || window.WebKitMutationObserver || window.JsMutationObserver;

  function Queries(engine, output) {
    this.engine = engine;
    this.output = output;
    this._watchers = {};
    this.references = this.engine.references;
    this.listener = new this.Observer(this.read.bind(this));
    this.listener.observe(this.engine.scope, this.options);
  }

  Queries.prototype.write = function(queries) {
    var continuation, index, query, scope, _i, _len;
    for (index = _i = 0, _len = queries.length; _i < _len; index = _i += 3) {
      query = queries[index];
      continuation = queries[index + 1];
      scope = queries[index + 2];
      this.output.read(query, continuation, scope);
    }
    return this;
  };

  Queries.prototype.read = function(mutations) {
    var allChanged, changed, child, firstNext, firstPrev, klasses, kls, mutation, next, old, parent, prev, queries, scope, target, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _p, _ref, _ref1;
    queries = [];
    scope = this.engine.scope;
    for (_i = 0, _len = mutations.length; _i < _len; _i++) {
      mutation = mutations[_i];
      target = parent = mutation.target;
      switch (mutation.type) {
        case "attributes":
          if (mutation.attributeName === 'class') {
            klasses = parent.classList;
            old = mutation.oldValue.split(' ');
            changed = [];
            for (_j = 0, _len1 = old.length; _j < _len1; _j++) {
              kls = old[_j];
              if (!(kls && klasses.contains(kls))) {
                changed.push(kls);
              }
            }
            for (_k = 0, _len2 = klasses.length; _k < _len2; _k++) {
              kls = klasses[_k];
              if (!(kls && old.indexOf(kls) > -1)) {
                changed.push(kls);
              }
            }
            while (parent.nodeType === 1) {
              for (_l = 0, _len3 = changed.length; _l < _len3; _l++) {
                kls = changed[_l];
                this.match(queries, parent, '$class', kls, target);
              }
              if (parent === scope) {
                break;
              }
              parent = parent.parentNode;
            }
            parent = target;
          }
          while (parent.nodeType === 1) {
            this.match(queries, parent, '$attribute', mutation.attributeName, target);
            if (parent === scope) {
              break;
            }
            parent = parent.parentNode;
          }
          break;
        case "childList":
          changed = [];
          _ref = mutation.addedNodes;
          for (_m = 0, _len4 = _ref.length; _m < _len4; _m++) {
            child = _ref[_m];
            if (child.nodeType === 1) {
              changed.push(child);
            }
          }
          _ref1 = mutation.removedNodes;
          for (_n = 0, _len5 = _ref1.length; _n < _len5; _n++) {
            child = _ref1[_n];
            if (child.nodeType === 1) {
              changed.push(child);
            }
          }
          prev = next = mutation;
          firstPrev = firstNext = true;
          while ((prev = prev.previousSibling)) {
            if (prev.nodeType === 1) {
              if (firstPrev) {
                this.match(queries, prev, '+');
                this.match(queries, prev, '++');
                firstPrev = false;
              }
              this.match(queries, prev, '~', void 0, changed);
              this.match(queries, prev, '~~', void 0, changed);
            }
          }
          while ((next = next.nextSibling)) {
            if (next.nodeType === 1) {
              if (firstNext) {
                this.match(queries, next, '!+');
                this.match(queries, next, '++');
                firstNext = false;
              }
              this.match(queries, next, '!~', void 0, changed);
              this.match(queries, next, '~~', void 0, changed);
            }
          }
          this.match(queries, parent, '>', void 0, changed);
          allChanged = [];
          for (_o = 0, _len6 = changed.length; _o < _len6; _o++) {
            child = changed[_o];
            this.match(queries, child, '!>', void 0, parent);
            allChanged.push(child);
            allChanged.push.apply(allChanged, void 0, child.getElementsByTagName('*'));
          }
          while (parent && parent.nodeType === 1) {
            this.match(queries, parent, ' ', void 0, allChanged);
            for (_p = 0, _len7 = allChanged.length; _p < _len7; _p++) {
              child = allChanged[_p];
              prev = child;
              while (prev = prev.previousSibling) {
                if (prev.nodeType === 1) {
                  this.match(queries, parent, ' +', void 0, prev);
                  break;
                }
              }
              this.match(queries, parent, ' +', void 0, child);
              this.match(queries, child, '!', void 0, parent);
            }
            parent = parent.parentNode;
          }
      }
    }
    if (queries.length) {
      this.write(queries);
    }
    return true;
  };

  Queries.prototype.add = function(node, continuation) {
    var collection;
    collection = this[continuation] || (this[continuation] = []);
    if (collection.indexOf(node) === -1) {
      collection.push(node);
    } else {
      (collection.dupes || (collection.dupes = [])).push(node);
    }
    return collection;
  };

  Queries.prototype.remove = function(id, continuation) {
    var contd, index, path, ref, watcher, watchers;
    if (watchers = this._watchers[id]) {
      ref = continuation + id;
      index = 0;
      while (watcher = watchers[index]) {
        contd = watchers[index + 1];
        if (contd !== ref) {
          index += 3;
          continue;
        }
        watchers.splice(index, 3);
        path = (contd || '') + watcher.key;
        this.clean(path);
      }
      if (!watchers.length) {
        delete this._watchers[id];
      }
    } else {
      this.clean(id);
    }
    return this;
  };

  Queries.prototype.clean = function(path) {
    var child, result, _i, _len;
    if (result = this[path]) {
      delete this[path];
      if (result.length !== void 0) {
        for (_i = 0, _len = result.length; _i < _len; _i++) {
          child = result[_i];
          this.engine.context.remove(child, path, result);
        }
      } else {
        this.engine.context.remove(result, path);
      }
    }
    return true;
  };

  Queries.prototype.filter = function(node, args, result, operation, continuation, scope) {
    var added, child, id, isCollection, old, path, removed, watchers, _base, _i, _j, _len, _len1;
    if (result === old) {
      return;
    }
    node || (node = scope || args[0]);
    path = (continuation || '') + operation.key;
    old = this[path];
    isCollection = result && result.length !== void 0;
    if (id = this.references.identify(node)) {
      watchers = (_base = this._watchers)[id] || (_base[id] = []);
      if (watchers.indexOf(operation) === -1) {
        watchers.push(operation, continuation, node);
      }
    }
    if (old && old.length) {
      removed = void 0;
      for (_i = 0, _len = old.length; _i < _len; _i++) {
        child = old[_i];
        if (!result || old.indexOf.call(result, child) === -1) {
          this.engine.context.remove(child, path, old);
          (removed || (removed = [])).push(child);
        }
      }
      if (continuation && (!isCollection || !result.length)) {
        this.engine.context.remove(path, continuation);
      }
    }
    if (isCollection) {
      added = void 0;
      for (_j = 0, _len1 = result.length; _j < _len1; _j++) {
        child = result[_j];
        if (!old || watchers.indexOf.call(old, child) === -1) {
          if (old) {
            (added || (added = [])).push(child);
          }
        }
      }
      if (continuation && (!old || !old.length)) {
        this.references.append(continuation, path);
      }
      if (result && result.item && (!old || removed || added)) {
        result = watchers.slice.call(result, 0);
      }
    } else if (result !== void 0 || old !== void 0) {
      this.references.append(continuation, path);
    }
    this[path] = result;
    if (result) {
      console.log('found', result.nodeType === 1 && 1 || result.length, ' by', path);
    }
    if (removed && !added) {
      return;
    }
    return added || result;
  };

  Queries.prototype.match = function(queries, node, group, qualifier, changed) {
    var change, continuation, groupped, id, index, operation, scope, watchers, _i, _j, _len, _len1;
    if (!(id = node._gss_id)) {
      return;
    }
    if (!(watchers = this._watchers[id])) {
      return;
    }
    for (index = _i = 0, _len = watchers.length; _i < _len; index = _i += 3) {
      operation = watchers[index];
      if (groupped = operation[group]) {
        continuation = watchers[index + 1];
        scope = watchers[index + 2];
        if (qualifier) {
          this.qualify(queries, operation, continuation, scope, groupped, qualifier);
        } else if (changed.nodeType) {
          this.qualify(queries, operation, continuation, scope, groupped, changed.tagName, '*');
        } else {
          for (_j = 0, _len1 = changed.length; _j < _len1; _j++) {
            change = changed[_j];
            this.qualify(queries, operation, continuation, scope, groupped, change.tagName, '*');
          }
        }
      }
    }
    return this;
  };

  Queries.prototype.qualify = function(queries, operation, continuation, scope, groupped, qualifier, fallback) {
    var indexed;
    if (typeof scope === 'string') {
      debugger;
    }
    if ((indexed = groupped[qualifier]) || (fallback && groupped[fallback])) {
      if (queries.indexOf(operation) === -1) {
        queries.push(operation, continuation, scope);
      }
    }
    return this;
  };

  return Queries;

})();

module.exports = Queries;
