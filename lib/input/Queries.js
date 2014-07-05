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
    } else if (!this.buffer || this.engine.values.indexOf(this.buffer, query, continuation, scope) === -1) {
      (this.buffer || (this.buffer = [])).push(query, continuation, scope);
    }
  };

  Queries.prototype.pull = function(mutations) {
    var capture, continuation, id, index, mutation, node, plural, plurals, property, queries, query, repairing, scope, value, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1;
    this.buffer = this.updated = null;
    capture = this.output.capture();
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
    this._repairing = null;
    if (queries = this.lastOutput = this.buffer) {
      this.buffer = void 0;
      if (this.removed) {
        _ref = this.removed;
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          id = _ref[_j];
          this.remove(id);
        }
        this.removed = void 0;
      }
      for (index = _k = 0, _len2 = queries.length; _k < _len2; index = _k += 3) {
        query = queries[index];
        if (!query) {
          break;
        }
        continuation = queries[index + 1];
        scope = queries[index + 2];
        this.output.pull(query, continuation, scope);
      }
    }
    repairing = this._repairing;
    this._repairing = void 0;
    if (repairing) {
      for (property in repairing) {
        value = repairing[property];
        if (plurals = this._plurals[property]) {
          for (index = _l = 0, _len3 = plurals.length; _l < _len3; index = _l += 3) {
            plural = plurals[index];
            this.repair(property, plural, plurals[index + 1], plurals[index + 2]);
          }
        }
      }
    }
    if (this.removing) {
      _ref1 = this.removing;
      for (_m = 0, _len4 = _ref1.length; _m < _len4; _m++) {
        node = _ref1[_m];
        delete node._gss_id;
      }
    }
    console.log('Updated', this.updated);
    this.buffer = this.updated = void 0;
    if (capture) {
      return this.output.flush();
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
      if ((changed != null ? changed.length : void 0) && name === 'class') {
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

  Queries.prototype.add = function(node, continuation, operation, scope, key) {
    var collection, index, keys;
    collection = this.get(continuation);
    (collection || (collection = this[continuation] = [])).manual = true;
    keys = collection.keys || (collection.keys = []);
    if (collection.indexOf(node) === -1) {
      index = collection.push(node);
      keys.splice(index - 1, 0, key);
    } else {
      (collection.duplicates || (collection.duplicates = [])).push(node);
      keys.push(key);
    }
    return collection;
  };

  Queries.prototype.get = function(operation, continuation, old) {
    var result, upd, updated, _i, _len, _ref, _ref1;
    if (typeof operation === 'string') {
      result = this[operation];
      if (old && (updated = (_ref = this.updated) != null ? (_ref1 = _ref[operation]) != null ? _ref1[3] : void 0 : void 0)) {
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

  Queries.prototype.unwatch = function(id, continuation, plural, quick) {
    var contd, index, refs, subscope, watcher, watchers;
    if (continuation !== true) {
      refs = this.engine.getPossibleContinuations(continuation);
      if (typeof id !== 'object') {
        this.unpair(continuation, this.engine.elements[id]);
      }
    }
    index = 0;
    console.error('unwatch', id, continuation);
    if (continuation === 'style$2….a–.b!+.b$b1') {
      debugger;
    }
    if (!(watchers = typeof id === 'object' && id || this._watchers[id])) {
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
        this.clean(watcher, contd, watcher, subscope, true, plural);
      }
    }
    if (!watchers.length) {
      return delete this._watchers[id];
    }
  };

  Queries.prototype.remove = function(id, continuation, operation, scope, manual, plural) {
    var cleaning, collection, dup, duplicate, duplicates, index, item, keys, length, node, path, plurals, ref, result, subpath, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
    console.error('REMOVE', Array.prototype.slice.call(arguments));
    if (manual === 'style$2….a$a1–.b$b3') {
      debugger;
    }
    if (typeof id === 'object') {
      node = id;
      id = this.engine.identify(id);
    } else {
      node = this.engine.elements[id];
    }
    if (continuation) {
      if (collection = this.get(continuation)) {
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
                return true;
              } else {
                duplicate = index;
              }
            }
          }
        }
        if (operation && (collection != null ? collection.length : void 0) && manual) {
          if ((index = collection.indexOf(node)) > -1) {
            if (keys) {
              if (keys[index] !== manual) {
                return;
              }
              if (duplicate != null) {
                collection.duplicates.splice(duplicate, 1);
                if (keys[duplicate + length] === 0) {
                  debugger;
                }
                keys[index] = keys[duplicate + length];
                keys.splice(duplicate + length, 1);
                return;
              }
            }
            collection.splice(index, 1);
            if (keys) {
              keys.splice(index, 1);
            }
            if (!collection.length) {
              cleaning = continuation;
            }
          }
        }
      }
      if (node) {
        if (plurals = (_ref = this._plurals) != null ? _ref[continuation] : void 0) {
          for (index = _j = 0, _len1 = plurals.length; _j < _len1; index = _j += 3) {
            plural = plurals[index];
            subpath = continuation + id + '–' + plural;
            this.remove(plurals[index + 2], continuation + id + '–', null, null, null, true);
            this.clean(continuation + id + '–' + plural, null, null, null, null, true);
            console.log('lol', plurals, scope, continuation + id + '–' + plural, this.get(continuation + id + '–' + plural));
          }
        }
        ref = continuation + (collection && collection.length !== void 0 && id || '');
        this.unwatch(id, ref, plural);
        path = continuation;
        if (((_ref1 = (result = this.engine.queries.get(path))) != null ? _ref1.length : void 0) != null) {
          if (manual && this.isPaired(null, manual)) {
            for (_k = 0, _len2 = result.length; _k < _len2; _k++) {
              item = result[_k];
              this.unpair(path, item);
            }
          } else {
            path += id;
            this.clean(path);
          }
        } else if (result) {
          this.unpair(path, result);
        }
      } else {
        this.clean(id, continuation, operation, scope);
      }
      if (collection && !collection.length) {
        delete this[continuation];
      }
    } else if (node) {
      this.unwatch(id, true);
    }
  };

  Queries.prototype.clean = function(path, continuation, operation, scope, bind, plural) {
    var child, copy, parent, result, _i, _len, _ref, _ref1;
    if (path.def) {
      path = (continuation || '') + (path.uid || '') + (path.key || '');
    }
    if (bind) {
      continuation = path;
    }
    console.error('CLEAN', Array.prototype.slice.call(arguments), this[continuation], this[path]);
    this.engine.values.clean(path, continuation, operation, scope);
    result = this.get(path);
    if (result) {
      this.unpair(path, result);
    }
    if (!plural) {
      if ((result = this.get(path, void 0, true)) !== void 0) {
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
            this.remove(result, path, operation);
          }
        }
        if (scope && operation.def.cleaning) {
          this.remove(this.engine.recognize(scope), path, operation);
        }
      }
    }
    delete this[path];
    if ((_ref1 = this._plurals) != null ? _ref1[path] : void 0) {
      delete this._plurals[path];
    }
    if (this.lastOutput) {
      this.unwatch(this.lastOutput, path, null, true);
    }
    this.unwatch(this.engine.scope._gss_id, path);
    if (!result || result.length === void 0) {
      if (path === "style$2….a$a2–.b!+.b") {
        debugger;
      }
      this.engine.expressions.push(['remove', this.engine.getContinuation(path)], true);
    }
    return true;
  };

  Queries.prototype.repair = function(path, key, operation, scope) {
    var added, contd, index, leftNew, leftOld, leftUpdate, object, pair, prefix, removed, rightNew, rightOld, rightPath, rightUpdate, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3;
    leftUpdate = (_ref = this.updated) != null ? _ref[path] : void 0;
    leftNew = (leftUpdate ? leftUpdate[0] : this.get(path)) || [];
    leftOld = (leftUpdate ? leftUpdate[1] : this.get(path)) || [];
    rightPath = path + '–' + key;
    rightUpdate = (_ref1 = this.updated) != null ? _ref1[rightPath] : void 0;
    console.error(rightPath, rightUpdate, this, this.updated);
    rightNew = (rightUpdate ? rightUpdate[0] : this.get(rightPath)) || [];
    rightOld = (rightUpdate ? rightUpdate[1] : this.get(rightPath)) || [];
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
      console.error('remove', path + this.engine.recognize(pair[0]) + '–');
      this.remove(scope, path + this.engine.recognize(pair[0]) + '–', null, null, null, true);
      this.clean(path + this.engine.recognize(pair[0]) + '–' + key, null, null, null, null, true);
    }
    for (_l = 0, _len2 = added.length; _l < _len2; _l++) {
      pair = added[_l];
      prefix = path + this.engine.recognize(pair[0]) + '–';
      contd = prefix + operation.path.substring(0, operation.path.length - operation.key.length);
      console.error(666, operation, scope, contd, key);
      if (operation.path !== operation.key) {
        this.engine.expressions.pull(operation.parent, prefix + operation.path, scope, operation.index, pair[1]);
      } else {
        this.engine.expressions.pull(operation, contd, scope, true, true);
      }
    }
    return console.log(this.updated, [path, key], [leftNew, leftOld], [rightNew, rightOld], "NEED TO REBALANCE DIS", added, removed);
  };

  Queries.prototype.pairRe = /(?:^|–)([^–]+)(\$[a-z0-9-]+)–([^–]+)–?$/i;

  Queries.prototype.isPaired = function(operation, continuation) {
    var match;
    if (match = continuation.match(this.pairRe)) {
      if (operation && operation.parent.def.serialized) {
        return;
      }
      if (!this.engine.isCollection(this[continuation]) && match[3].indexOf('$') === -1) {
        return;
      }
      return match;
    }
  };

  Queries.prototype.unpair = function(continuation, node) {
    var collection, index, match, plural, plurals, _i, _len, _ref;
    if (!(match = this.isPaired(null, continuation))) {
      return;
    }
    console.info(continuation, node, match);
    collection = this.get(match[1]);
    if (!(plurals = (_ref = this._plurals) != null ? _ref[match[1]] : void 0)) {
      return;
    }
    for (index = _i = 0, _len = plurals.length; _i < _len; index = _i += 3) {
      plural = plurals[index];
      if (this.remove(node, match[1] + '–' + plural, plurals[index + 1], plurals[index + 2], continuation)) {
        this.clean(match[1] + match[2] + '–' + plural);
      }
    }
  };

  Queries.prototype.pair = function(continuation, operation, scope, result) {
    var collection, element, match, node, old, path, plurals, schedule, _base, _base1, _i, _len, _name, _ref, _ref1;
    if (!(match = this.isPaired(operation, continuation, true))) {
      return;
    }
    plurals = (_base = (this._plurals || (this._plurals = {})))[_name = match[1]] || (_base[_name] = []);
    if (plurals.indexOf(operation.path) === -1) {
      plurals.push(operation.path, operation, scope);
    }
    collection = this.get(match[1]);
    element = this.engine.elements[match[2]];
    console.log(777, continuation, operation, operation.path, result);
    if (this.engine.isCollection(result)) {
      if (operation.key === operation.path) {
        path = match[1] + '–' + operation.path;
        console.info(this.get(continuation), this.get(path));
        if (old = ((_ref = this.updated) != null ? (_ref1 = _ref[path]) != null ? _ref1[1] : void 0 : void 0) || this.get(path)) {
          (_base1 = this.updated)[path] || (_base1[path] = [result, old, void 0, void 0]);
        }
        this.set(path, result);
      } else {
        for (_i = 0, _len = result.length; _i < _len; _i++) {
          node = result[_i];
          this.add(node, match[1] + '–' + operation.path, operation, scope, continuation);
        }
      }
    } else {
      this.add(result, match[1] + '–' + operation.path, operation, scope, continuation);
    }
    console.error("FUHRER", result, match[1] + '–' + operation.path, this[continuation], operation.path, match, continuation, collection.indexOf(element));
    if (this._repairing !== void 0) {
      schedule = (this._repairing || (this._repairing = {}))[match[1]] = true;
      return -1;
    }
    return collection.indexOf(element);
  };

  Queries.prototype.getContext = function(args, operation, scope, node) {
    var _ref;
    if (args.length !== 0 && ((_ref = args[0]) != null ? _ref.nodeType : void 0)) {
      return args[0];
    }
    if (!operation.bound) {
      return this.engine.scope;
    }
    return scope;
  };

  Queries.prototype.fetch = function(node, args, operation, continuation, scope) {
    var query;
    node || (node = this.getContext(args, operation, scope, node));
    if (this.updated) {
      query = this.getQueryPath(operation, this.engine.identify(node));
      console.log('fetched', query, this.updated[query], continuation);
      return this.updated[query];
    }
  };

  Queries.prototype.update = function(node, args, result, operation, continuation, scope) {
    var added, child, contd, group, id, index, isCollection, noop, o, old, path, plurals, query, removed, scoped, watchers, _base, _base1, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    node || (node = this.getContext(args, operation, scope, node));
    path = this.getQueryPath(operation, continuation);
    old = this.get(path);
    query = this.getQueryPath(operation, this.engine.identify(node));
    if (group = (_ref = this.updated) != null ? _ref[query] : void 0) {
      old || (old = group[1]);
      result = group[0];
      if (this[path] == null) {
        scoped = true;
      } else {
        this[path] = group[0];
      }
    }
    console.error(this.updated, group, query, args, scope, scoped, 'SCOPEEED', path, operation, result);
    if ((group || (group = (_ref1 = this.updated) != null ? _ref1[path] : void 0))) {
      if (scoped) {
        added = result;
      } else {
        added = group[2];
        removed = group[3];
      }
    } else {
      isCollection = result && result.length !== void 0;
      if (old === result || (old === void 0 && this.removed)) {
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
      watchers = (_base = this._watchers)[id] || (_base[id] = []);
      if (this.engine.values.indexOf(watchers, operation, continuation, scope) === -1) {
        watchers.push(operation, continuation, scope);
      }
    }
    if (noop) {
      return;
    }
    this.set(path, result);
    if (plurals = (_ref2 = this._plurals) != null ? _ref2[path] : void 0) {
      (this._repairing || (this._repairing = {}))[path] = true;
    }
    if (this.updated !== void 0) {
      this.updated || (this.updated = {});
      group = (_base1 = this.updated)[path] || (_base1[path] = group || [result, old, added, removed]);
      if (query) {
        this.updated[query] = group;
      }
    }
    contd = continuation;
    if (contd && contd.charAt(contd.length - 1) === '–') {
      contd = this.engine.expressions.log(operation, contd);
    }
    if (continuation && ((index = this.pair(contd, operation, scope, result)) != null)) {
      if (index === -1) {
        return;
      } else {
        return result[index];
      }
    }
    if (removed && !added) {
      return;
    }
    return added;
  };

  Queries.prototype.set = function(path, result) {
    if (result) {
      return this[path] = result;
    } else {
      return delete this[path];
    }
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

  Queries.prototype.getQueryPath = function(operation, continuation) {
    if (continuation) {
      if (continuation.nodeType) {
        return this.engine.identify(continuation) + operation.path;
      } else {
        return continuation + operation.key;
      }
    } else {
      return operation.key;
    }
  };

  return Queries;

})();

module.exports = Queries;
