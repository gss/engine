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
    this._watched = {};
    this.references = this.engine.references;
    this.listener = new this.Observer(this.read.bind(this));
    this.listener.observe(this.engine.scope, this.options);
  }

  Queries.prototype.write = function(query, continuation, scope) {
    if (this.buffer === void 0) {
      this.output.read(query, continuation, scope);
    } else {
      (this.buffer || (this.buffer = [])).push(query, continuation, scope);
    }
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
      if (changed && changed.length) {
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

  Queries.prototype.$childList = function(target, mutation) {
    var added, allAdded, allChanged, allRemoved, attribute, changed, child, firstNext, firstPrev, id, kls, next, node, parent, prev, prop, removed, update, value, values, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _len9, _m, _n, _o, _p, _q, _r, _ref, _ref1, _ref2, _ref3;
    added = [];
    removed = [];
    changed = [];
    _ref = mutation.addedNodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      if (child.nodeType === 1) {
        changed.push(child);
        added.push(child);
      }
    }
    _ref1 = mutation.removedNodes;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      child = _ref1[_j];
      if (child.nodeType === 1) {
        changed.push(child);
        removed.push(child);
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
        this.match(prev, '~', void 0, changed);
        this.match(prev, '~~', void 0, changed);
      }
    }
    while ((next = next.nextSibling)) {
      if (next.nodeType === 1) {
        if (firstNext) {
          this.match(next, '!+');
          this.match(next, '++');
          firstNext = false;
        }
        this.match(next, '!~', void 0, changed);
        this.match(next, '~~', void 0, changed);
      }
    }
    this.match(target, '>', void 0, changed);
    allAdded = [];
    allRemoved = [];
    for (_k = 0, _len2 = added.length; _k < _len2; _k++) {
      child = added[_k];
      this.match(child, '!>', void 0, target);
      allAdded.push(child);
      allAdded.push.apply(allAdded, child.getElementsByTagName('*'));
    }
    for (_l = 0, _len3 = removed.length; _l < _len3; _l++) {
      child = removed[_l];
      allRemoved.push(child);
      allRemoved.push.apply(allRemoved, child.getElementsByTagName('*'));
    }
    allChanged = allAdded.concat(allRemoved);
    for (_m = 0, _len4 = allRemoved.length; _m < _len4; _m++) {
      removed = allRemoved[_m];
      if (id = this.engine.recognize(removed)) {
        this.engine.context.remove(id);
      }
    }
    update = {};
    for (_n = 0, _len5 = allChanged.length; _n < _len5; _n++) {
      node = allChanged[_n];
      _ref2 = node.attributes;
      for (_o = 0, _len6 = _ref2.length; _o < _len6; _o++) {
        attribute = _ref2[_o];
        switch (attribute.name) {
          case 'class':
            _ref3 = removed.classList;
            for (_p = 0, _len7 = _ref3.length; _p < _len7; _p++) {
              kls = _ref3[_p];
              if (!update[' $class'] || update[' $class'].indexOf(kls === -1)) {
                (update[' $class'] || (update[' $class'] = [])).push(kls);
              }
            }
            break;
          case 'id':
            if (!update[' $id'] || update[' $id'].indexOf(kls === -1)) {
              (update[' $id'] || (update[' $id'] = [])).push(attribute.value);
            }
            break;
          default:
            if (!update[' $attribute'] || update[' $attribute'].indexOf(kls === -1)) {
              (update[' $attribute'] || (update[' $attribute'] = [])).push(attribute.name);
            }
        }
      }
      prev = next = node;
      while (prev = prev.previousSibling) {
        if (prev.nodeType === 1) {
          (update[' +'] || (update[' +'] = [])).push(prev);
          break;
        }
      }
      while (next = next.previousSibling) {
        if (next.nodeType === 1) {
          break;
        }
      }
      if (!prev) {
        (update[' $pseudo'] || (update[' $pseudo'] = [])).push('first-child');
      }
      if (!next) {
        (update[' $pseudo'] || (update[' $pseudo'] = [])).push('last-child');
      }
      (update[' +'] || (update[' +'] = [])).push(child);
    }
    console.log(update);
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
          if (typeof value === 'object') {
            this.match(parent, prop, void 0, value);
          } else {
            this.match(parent, prop, value);
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
    return this;
  };

  Queries.prototype.read = function(mutations) {
    var buffer, continuation, index, mutation, queries, query, scope, _i, _j, _len, _len1;
    this.output.buffer = this.buffer = null;
    for (_i = 0, _len = mutations.length; _i < _len; _i++) {
      mutation = mutations[_i];
      switch (mutation.type) {
        case "attributes":
          this.$attribute(mutation.target, mutation.attributeName, mutation.oldValue);
          break;
        case "childList":
          this.$childList(mutation.target, mutation);
      }
    }
    if (queries = this.lastOutput = this.buffer) {
      this.buffer = void 0;
      for (index = _j = 0, _len1 = queries.length; _j < _len1; index = _j += 3) {
        query = queries[index];
        continuation = queries[index + 1];
        scope = queries[index + 2];
        this.output.read(query, continuation, scope);
      }
    }
    if (buffer = this.output.buffer) {
      this.output.flush();
    }
  };

  Queries.prototype.add = function(node, continuation, scope) {
    var collection;
    if (scope !== this.engine.scope) {
      continuation += this.engine.recognize(scope);
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
    if (scope !== this.engine.scope) {
      continuation += this.engine.recognize(scope);
    }
    return this[continuation];
  };

  Queries.prototype.remove = function(id, continuation) {
    var contd, index, path, ref, watched, watcher, watchers;
    if (continuation) {
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
    } else {
      if (watched = this._watched[id]) {
        index = 0;
        while (watcher = watched[index]) {
          contd = watched[index + 1];
          path = (contd || '') + watcher.key;
          this.engine.context.remove(id, path);
          index += 3;
        }
        delete this._watched[id];
      }
      if (watchers = this._watchers[id]) {
        debugger;
        index = 0;
        while (watcher = watched[index]) {
          contd = watched[index + 1];
          path = (contd || '') + watcher.key;
          this.engine.context.remove(id, path);
          index += 3;
        }
        delete this._watched[id];
      }
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

  Queries.prototype.update = function(node, args, result, operation, continuation, scope) {
    var added, child, id, isCollection, old, path, removed, watchers, _base, _base1, _base2, _i, _j, _len, _len1, _name, _name1;
    node || (node = scope || args[0]);
    path = continuation && continuation + operation.key || operation.path;
    old = this[path];
    isCollection = result && result.length !== void 0;
    if (old === result) {
      if (!(result && result.manual)) {
        return;
      }
      old = void 0;
    }
    if (id = this.references.identify(node)) {
      watchers = (_base = this._watchers)[id] || (_base[id] = []);
      if (watchers.indexOf(operation) === -1) {
        if (operation.name === '!>') {
          debugger;
        }
        watchers.push(operation, continuation, node);
      }
    }
    if (old) {
      if (old.length !== void 0) {
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
      } else if (!result) {
        this.references.remove(continuation, path);
      }
    }
    if (isCollection) {
      added = void 0;
      for (_j = 0, _len1 = result.length; _j < _len1; _j++) {
        child = result[_j];
        if (!old || watchers.indexOf.call(old, child) === -1) {
          (added || (added = [])).push(child);
          ((_base1 = this._watched)[_name = this.engine.identify(child)] || (_base1[_name] = [])).push(operation, continuation, scope);
        }
      }
      if (continuation && (!old || !old.length)) {
        this.references.append(continuation, path);
      }
      if (result && result.item && (!old || removed || added)) {
        result = watchers.slice.call(result, 0);
      }
    } else {
      if (result) {
        ((_base2 = this._watched)[_name1 = this.engine.identify(result)] || (_base2[_name1] = [])).push(operation, continuation, scope);
      } else {
        debugger;
      }
      added = result;
      if (result !== void 0 && old === void 0) {
        this.references.append(continuation, path);
      }
    }
    this[path] = result;
    console.log('found', result && (result.nodeType === 1 && 1 || result.length) || 0, ' by', path);
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
        } else {
          for (_j = 0, _len1 = changed.length; _j < _len1; _j++) {
            change = changed[_j];
            this.qualify(operation, continuation, scope, groupped, change.tagName, '*');
          }
        }
      }
    }
    return this;
  };

  Queries.prototype.qualify = function(operation, continuation, scope, groupped, qualifier, fallback) {
    var indexed;
    if (typeof scope === 'string') {
      debugger;
    }
    if ((indexed = groupped[qualifier]) || (fallback && groupped[fallback])) {
      this.write(operation, continuation, scope);
    }
    return this;
  };

  return Queries;

})();

module.exports = Queries;
