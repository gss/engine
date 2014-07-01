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
    this.listener = new this.Observer(this.pull.bind(this));
    this.connect();
  }

  Queries.prototype.connect = function() {
    return this.listener.observe(this.engine.scope, this.options);
  };

  Queries.prototype.disconnect = function() {
    return this.listener.disconnect();
  };

  Queries.prototype.push = function(query, continuation, scope) {
    if (this.buffer === void 0) {
      this.output.pull(query, continuation, scope);
    } else {
      (this.buffer || (this.buffer = [])).push(query, continuation, scope);
    }
  };

  Queries.prototype.pull = function(mutations) {
    var continuation, id, index, mutation, queries, query, scope, _i, _j, _k, _len, _len1, _len2, _ref;
    this.output.buffer = this.buffer = this.updated = null;
    this.engine.start();
    for (_i = 0, _len = mutations.length; _i < _len; _i++) {
      mutation = mutations[_i];
      switch (mutation.type) {
        case "attributes":
          this.$attribute(mutation.target, mutation.attributeName, mutation.oldValue);
          break;
        case "childList":
          this.$children(mutation.target, mutation);
      }
      this.$intrinsics(mutation.target);
    }
    if (queries = this.lastOutput = this.buffer) {
      this.buffer = void 0;
      for (index = _j = 0, _len1 = queries.length; _j < _len1; index = _j += 3) {
        query = queries[index];
        continuation = queries[index + 1];
        scope = queries[index + 2];
        this.output.pull(query, continuation, scope);
      }
      if (this.removed) {
        _ref = this.removed;
        for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
          id = _ref[_k];
          this.remove(id);
        }
        this.removed = void 0;
      }
    }
    this.buffer = this.updated = void 0;
    return this.output.flush();
  };

  Queries.prototype.$attribute = function(target, name, changed) {
    var $attribute, $class, klasses, kls, old, parent, _i, _j, _k, _len, _len1, _len2;
    if (name === 'class' && typeof changed === 'string') {
      klasses = target.classList;
      old = changed.split(' ');
      changed = [];
      for (_i = 0, _len = old.length; _i < _len; _i++) {
        kls = old[_i];
        if (!(kls && klasses.contains(kls))) {
          changed.push(kls);
        }
      }
      for (_j = 0, _len1 = klasses.length; _j < _len1; _j++) {
        kls = klasses[_j];
        if (!(kls && old.indexOf(kls) > -1)) {
          changed.push(kls);
        }
      }
    }
    parent = target;
    while (parent) {
      $attribute = target === parent && '$attribute' || ' $attribute';
      this.match(parent, $attribute, name, target);
      if (changed != null ? changed.length : void 0) {
        $class = target === parent && '$class' || ' $class';
        for (_k = 0, _len2 = changed.length; _k < _len2; _k++) {
          kls = changed[_k];
          this.match(parent, $class, kls, target);
        }
      }
      if (parent === this.engine.scope) {
        break;
      }
      if (!(parent = parent.parentNode)) {
        break;
      }
    }
    return this;
  };

  Queries.prototype.index = function(update, type, value) {
    var group;
    if (group = update[type]) {
      if (group.indexOf(value) !== -1) {
        return;
      }
    } else {
      update[type] = [];
    }
    return update[type].push(value);
  };

  Queries.prototype.$children = function(target, mutation) {
    var added, allAdded, allChanged, allRemoved, attribute, changed, changedTags, child, firstNext, firstPrev, id, index, kls, next, node, parent, prev, prop, removed, tag, update, value, values, _i, _j, _k, _l, _len, _len1, _len10, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _len9, _m, _n, _o, _p, _q, _r, _ref, _ref1, _ref2, _ref3, _s;
    added = [];
    removed = [];
    _ref = mutation.addedNodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      if (child.nodeType === 1) {
        added.push(child);
      }
    }
    _ref1 = mutation.removedNodes;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      child = _ref1[_j];
      if (child.nodeType === 1) {
        if ((index = added.indexOf(child)) > -1) {
          added.splice(index, 1);
        } else {
          removed.push(child);
        }
      }
    }
    changed = added.concat(removed);
    changedTags = [];
    for (_k = 0, _len2 = changed.length; _k < _len2; _k++) {
      node = changed[_k];
      tag = node.tagName;
      if (changedTags.indexOf(tag) === -1) {
        changedTags.push(tag);
      }
    }
    prev = next = mutation;
    firstPrev = firstNext = true;
    while ((prev = prev.previousSibling)) {
      if (prev.nodeType === 1) {
        if (firstPrev) {
          this.match(prev, '+');
          this.match(prev, '++');
          firstPrev = false;
        }
        this.match(prev, '~', void 0, changedTags);
        this.match(prev, '~~', void 0, changedTags);
      }
    }
    while ((next = next.nextSibling)) {
      if (next.nodeType === 1) {
        if (firstNext) {
          this.match(next, '!+');
          this.match(next, '++');
          firstNext = false;
        }
        this.match(next, '!~', void 0, changedTags);
        this.match(next, '~~', void 0, changedTags);
      }
    }
    this.match(target, '>', void 0, changedTags);
    allAdded = [];
    allRemoved = [];
    for (_l = 0, _len3 = added.length; _l < _len3; _l++) {
      child = added[_l];
      this.match(child, '!>', void 0, target);
      allAdded.push(child);
      allAdded.push.apply(allAdded, child.getElementsByTagName('*'));
    }
    for (_m = 0, _len4 = removed.length; _m < _len4; _m++) {
      child = removed[_m];
      allRemoved.push(child);
      allRemoved.push.apply(allRemoved, child.getElementsByTagName('*'));
    }
    allChanged = allAdded.concat(allRemoved);
    update = {};
    for (_n = 0, _len5 = allChanged.length; _n < _len5; _n++) {
      node = allChanged[_n];
      _ref2 = node.attributes;
      for (_o = 0, _len6 = _ref2.length; _o < _len6; _o++) {
        attribute = _ref2[_o];
        switch (attribute.name) {
          case 'class':
            _ref3 = node.classList;
            for (_p = 0, _len7 = _ref3.length; _p < _len7; _p++) {
              kls = _ref3[_p];
              this.index(update, ' $class', kls);
            }
            break;
          case 'id':
            this.index(update, ' $id', attribute.value);
        }
        this.index(update, ' $attribute', attribute.name);
      }
      prev = next = node;
      while (prev = prev.previousSibling) {
        if (prev.nodeType === 1) {
          this.index(update, ' +', prev.tagName);
          break;
        }
      }
      while (next = next.nextSibling) {
        if (next.nodeType === 1) {
          break;
        }
      }
      if (!prev) {
        this.index(update, ' $pseudo', 'first-child');
      }
      if (!next) {
        this.index(update, ' $pseudo', 'last-child');
      }
      this.index(update, ' +', child.tagName);
    }
    parent = target;
    while (parent.nodeType === 1) {
      this.match(parent, ' ', void 0, allAdded);
      for (_q = 0, _len8 = allAdded.length; _q < _len8; _q++) {
        child = allAdded[_q];
        this.match(child, '!', void 0, parent);
      }
      for (prop in update) {
        values = update[prop];
        for (_r = 0, _len9 = values.length; _r < _len9; _r++) {
          value = values[_r];
          if (prop.charAt(1) === '$') {
            this.match(parent, prop, value);
          } else {
            this.match(parent, prop, void 0, value);
          }
        }
      }
      if (parent === this.engine.scope) {
        break;
      }
      if (!(parent = parent.parentNode)) {
        break;
      }
    }
    for (_s = 0, _len10 = allRemoved.length; _s < _len10; _s++) {
      removed = allRemoved[_s];
      if (id = this.engine.recognize(removed)) {
        (this.removed || (this.removed = [])).push(id);
      }
    }
    return this;
  };

  Queries.prototype.$intrinsics = function(node) {
    if (!document.body.contains(node)) {
      return;
    }
    return this.engine._onResize(node);
  };

  Queries.prototype.add = function(node, continuation, operation, scope) {
    var collection;
    if (scope && scope !== this.engine.scope) {
      continuation = this.engine.recognize(scope) + continuation;
    }
    collection = this[continuation] || (this[continuation] = []);
    collection.manual = true;
    if (collection.indexOf(node) === -1) {
      collection.push(node);
    } else {
      (collection.duplicates || (collection.duplicates = [])).push(node);
    }
    return collection;
  };

  Queries.prototype.get = function(continuation, scope) {
    return this[continuation];
  };

  Queries.prototype.remove = function(id, continuation, operation, scope, manual) {
    var cleaning, collection, contd, duplicates, index, node, path, ref, refforked, result, subscope, watcher, watchers, _base, _ref;
    if (typeof id === 'object') {
      node = id;
      id = this.engine.identify(id);
    } else {
      node = this.engine.elements[id];
    }
    if (continuation) {
      if (collection = this[continuation]) {
        if ((duplicates = collection.duplicates)) {
          if ((index = duplicates.indexOf(node)) > -1) {
            duplicates.splice(index, 1);
            return;
          }
        }
        if (operation && (collection != null ? collection.length : void 0) && manual) {
          if ((index = collection.indexOf(node)) > -1) {
            collection.splice(index, 1);
            if (!collection.length) {
              cleaning = continuation;
            }
          }
        }
      }
      if (node) {
        if (watchers = this._watchers[id]) {
          ref = continuation + (collection && collection.length !== void 0 && id || '');
          refforked = ref + '–';
          index = 0;
          while (watcher = watchers[index]) {
            contd = watchers[index + 1];
            if (!(contd === ref || contd === refforked)) {
              index += 3;
              continue;
            }
            subscope = watchers[index + 2];
            watchers.splice(index, 3);
            this.clean(watcher, contd, watcher, subscope, true);
          }
          if (!watchers.length) {
            delete this._watchers[id];
          }
        }
        path = continuation;
        if (((_ref = (result = this.engine.queries[path])) != null ? _ref.length : void 0) != null) {
          path += id;
          this.clean(path);
        }
      } else {
        this.clean(id, continuation, operation, scope);
      }
      if (collection && !collection.length) {
        delete this[continuation];
      }
    } else if (node) {
      if (watchers = this._watchers[id]) {
        index = 0;
        while (watcher = watchers[index]) {
          this.clean(watcher, watchers[index + 1], watcher, watchers[index + 2]);
          index += 3;
        }
        delete this._watchers[id];
      }
      ((_base = this.engine).removing || (_base.removing = [])).push(id);
      delete node._gss_id;
    }
    return this;
  };

  Queries.prototype.clean = function(path, continuation, operation, scope, bind) {
    var child, copy, parent, result, _i, _len, _ref;
    if (path.def) {
      path = (continuation || '') + (path.uid || '') + (path.key || '');
      console.log('path', path);
    }
    if (bind) {
      continuation = path;
    }
    this.engine.values.clean(path, continuation, operation, scope);
    if ((result = this[path]) !== void 0) {
      if (result) {
        if (parent = operation != null ? operation.parent : void 0) {
          if ((_ref = parent.def.release) != null) {
            _ref.call(this.engine, result, operation, continuation, scope);
          }
        }
        if (result.length !== void 0) {
          copy = result.slice();
          for (_i = 0, _len = copy.length; _i < _len; _i++) {
            child = copy[_i];
            this.remove(child, path, operation);
          }
        } else if (typeof result === 'object') {
          this.remove(result, continuation, operation);
        }
      }
      if (scope && operation.def.cleaning) {
        this.remove(this.engine.recognize(scope), path, operation);
      }
    }
    delete this[path];
    if (!result || result.length === void 0) {
      this.engine.expressions.push(['remove', path], true);
    }
    return true;
  };

  Queries.prototype.update = function(node, args, result, operation, continuation, scope) {
    var added, child, dupe, group, id, index, isCollection, noop, o, old, path, removed, watcher, watchers, _base, _i, _j, _k, _len, _len1, _len2;
    node || (node = scope || args[0]);
    path = continuation && continuation + operation.key || operation.path;
    old = this[path];
    if (this.updated && (group = this.updated[path])) {
      if (group.indexOf(operation) > -1) {
        return;
      }
      added = group[0];
      removed = group[1];
    } else {
      isCollection = result && result.length !== void 0;
      if (old === result) {
        if (!(result && result.manual)) {
          noop = true;
        }
        old = void 0;
      }
      if (old) {
        if (old.length !== void 0) {
          removed = void 0;
          o = old.slice();
          for (_i = 0, _len = o.length; _i < _len; _i++) {
            child = o[_i];
            if (!result || Array.prototype.indexOf.call(result, child) === -1) {
              this.remove(child, path, operation, scope);
              (removed || (removed = [])).push(child);
            }
          }
        } else if (!result) {
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
    }
    if (id = this.engine.identify(node)) {
      if (watchers = this._watchers[id]) {
        for (index = _k = 0, _len2 = watchers.length; _k < _len2; index = _k += 3) {
          watcher = watchers[index];
          if (watcher === operation && watchers[index + 1] === continuation && watchers[index + 2] === scope) {
            dupe = true;
            break;
          }
        }
      } else {
        watchers = this._watchers[id] = [];
      }
      if (!dupe) {
        watchers.push(operation, continuation, scope);
      }
    }
    if (noop) {
      return;
    }
    if (result) {
      this[path] = result;
    } else {
      delete this[path];
    }
    if (this.updated !== void 0) {
      group = (_base = (this.updated || (this.updated = {})))[path] || (_base[path] = []);
      if (group.length) {
        group.push(operation);
      } else {
        group.push(added, removed, operation);
      }
    }
    if (removed && !added) {
      return;
    }
    return added;
  };

  Queries.prototype.match = function(node, group, qualifier, changed) {
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
          this.qualify(operation, continuation, scope, groupped, qualifier);
        } else if (changed.nodeType) {
          this.qualify(operation, continuation, scope, groupped, changed.tagName, '*');
        } else if (typeof changed === 'string') {
          this.qualify(operation, continuation, scope, groupped, changed, '*');
        } else {
          for (_j = 0, _len1 = changed.length; _j < _len1; _j++) {
            change = changed[_j];
            if (typeof change === 'string') {
              this.qualify(operation, continuation, scope, groupped, change, '*');
            } else {
              this.qualify(operation, continuation, scope, groupped, change.tagName, '*');
            }
          }
        }
      }
    }
    return this;
  };

  Queries.prototype.qualify = function(operation, continuation, scope, groupped, qualifier, fallback) {
    var indexed;
    if ((indexed = groupped[qualifier]) || (fallback && groupped[fallback])) {
      this.push(operation, continuation, scope);
    }
    return this;
  };

  return Queries;

})();

module.exports = Queries;
