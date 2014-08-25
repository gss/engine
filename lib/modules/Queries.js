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
  Queries.prototype.options = {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
    attributeOldValue: true
  };

  Queries.prototype.Observer = (typeof window !== "undefined" && window !== null) && (window.MutationObserver || window.WebKitMutationObserver || window.JsMutationObserver);

  function Queries(engine) {
    this.engine = engine;
    this.watchers = {};
    this.listener = new this.Observer(this.solve.bind(this));
  }

  Queries.prototype.connect = function() {
    return this.listener.observe(this.engine.scope, this.options);
  };

  Queries.prototype.disconnect = function() {
    return this.listener.disconnect();
  };

  Queries.prototype.onBeforeSolve = function() {
    var id, index, node, plural, plurals, property, repairing, value, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
    if (this.removed) {
      _ref = this.removed;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        this.remove(id);
      }
      this.removed = void 0;
    }
    this.buffer = void 0;
    repairing = this._repairing;
    this._repairing = void 0;
    if (repairing) {
      for (property in repairing) {
        value = repairing[property];
        if (plurals = this._plurals[property]) {
          for (index = _j = 0, _len1 = plurals.length; _j < _len1; index = _j += 3) {
            plural = plurals[index];
            this.repair(property, plural, plurals[index + 1], plurals[index + 2], plurals[index + 3]);
          }
        }
      }
    }
    if (this.removing) {
      _ref1 = this.removing;
      for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
        node = _ref1[_k];
        delete node._gss_id;
      }
    }
    return this.buffer = void 0;
  };

  Queries.prototype.solve = function(mutations) {
    console.log('q', mutations);
    return this.engine.engine.solve('mutations', function() {
      var index, mutation, operation, qualified, _i, _j, _len, _len1;
      this.engine.workflow.queries = void 0;
      this.engine.workflow.reflown = void 0;
      qualified = this.queries.qualified = this.engine.workflow.qualified = [];
      for (_i = 0, _len = mutations.length; _i < _len; _i++) {
        mutation = mutations[_i];
        switch (mutation.type) {
          case "attributes":
            this.queries.$attribute(mutation.target, mutation.attributeName, mutation.oldValue);
            break;
          case "childList":
            this.queries.$children(mutation.target, mutation);
            break;
          case "characterData":
            this.queries.$characterData(mutation.target, mutation);
        }
        this.intrinsic.validate(mutation.target);
      }
      for (index = _j = 0, _len1 = qualified.length; _j < _len1; index = _j += 3) {
        operation = qualified[index];
        this.document.solve(operation, qualified[index + 1], qualified[index + 2]);
      }
    });
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
          this.match(prev, '+', void 0, '*');
          this.match(prev, '++', void 0, '*');
          firstPrev = false;
        }
        this.match(prev, '~', void 0, changedTags);
        this.match(prev, '~~', void 0, changedTags);
        next = prev;
      }
    }
    while ((next = next.nextSibling)) {
      if (next.nodeType === 1) {
        if (firstNext) {
          this.match(next, '!+', void 0, '*');
          this.match(next, '++', void 0, '*');
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
    while (parent) {
      this.match(parent, ' ', void 0, allChanged);
      for (_q = 0, _len8 = allChanged.length; _q < _len8; _q++) {
        child = allChanged[_q];
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
      if (id = this.engine.identity.find(removed)) {
        (this.removed || (this.removed = [])).push(id);
      }
    }
    return this;
  };

  Queries.prototype.$characterData = function(target) {
    var id, parent, _ref;
    parent = target.parentNode;
    if (id = this.engine.identity.find(parent)) {
      if (parent.tagName === 'STYLE') {
        if (((_ref = parent.getAttribute('type')) != null ? _ref.indexOf('text/gss') : void 0) > -1) {
          return this.engine["eval"](parent);
        }
      }
    }
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
      this.chain(collection[index - 1], node, collection, continuation);
      this.chain(node, collection[index + 1], collection, continuation);
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

  Queries.prototype.unobserve = function(id, continuation, plural, quick) {
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
        this.clean(watcher, contd, watcher, subscope, true, plural);
      }
    }
    if (!watchers.length) {
      return delete this.watchers[id];
    }
  };

  Queries.prototype.removeFromNode = function(id, continuation, operation, scope, plural) {
    var collection, index, item, plurals, ref, result, subpath, _i, _j, _len, _len1, _ref, _results;
    collection = this.get(continuation);
    if (plurals = (_ref = this._plurals) != null ? _ref[continuation] : void 0) {
      for (index = _i = 0, _len = plurals.length; _i < _len; index = _i += 3) {
        subpath = plurals[index];
        subpath = continuation + id + '→' + subpath;
        this.remove(plurals[index + 2], continuation + id + '→', null, null, null, true);
        this.clean(continuation + id + '→' + subpath, null, null, null, null, true);
      }
    }
    ref = continuation + (((collection != null ? collection.length : void 0) != null) && id || '');
    this.unobserve(id, ref, plural);
    if ((result = this.get(continuation)) == null) {
      return;
    }
    if (result.length != null) {
      if (typeof manual === 'string' && this.isPaired(null, manual)) {
        _results = [];
        for (_j = 0, _len1 = result.length; _j < _len1; _j++) {
          item = result[_j];
          _results.push(this.unpair(continuation, item));
        }
        return _results;
      } else {
        return this.clean(continuation + id);
      }
    } else {
      return this.unpair(continuation, result);
    }
  };

  Queries.prototype.removeFromCollection = function(node, continuation, operation, scope, manual) {
    var collection, copy, dup, duplicate, duplicates, index, keys, length, _base, _base1, _base2, _i, _len;
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
      if (copy = collection.slice()) {
        (_base = ((_base1 = ((_base2 = this.engine.workflow).queries || (_base2.queries = {})))[continuation] || (_base1[continuation] = [])))[1] || (_base[1] = copy);
      }
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

  Queries.prototype.remove = function(id, continuation, operation, scope, manual, plural) {
    var collection, node, removed;
    if (typeof id === 'object') {
      node = id;
      id = this.engine.identity.provide(id);
    } else {
      node = this.engine.identity[id];
    }
    if (continuation) {
      collection = this.get(continuation);
      removed = this.removeFromCollection(node, continuation, operation, scope, manual);
      if (removed !== false) {
        this.removeFromNode(id, continuation, operation, scope, plural);
      }
      if (collection && !collection.length) {
        this.set(continuation, void 0);
      }
    } else if (node) {
      this.unobserve(id, true);
    }
    return removed;
  };

  Queries.prototype.clean = function(path, continuation, operation, scope, bind, plural) {
    var parent, result, _ref, _ref1;
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
    if (!plural) {
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
    if ((_ref1 = this._plurals) != null ? _ref1[path] : void 0) {
      delete this._plurals[path];
    }
    if (this.qualified) {
      this.unobserve(this.qualified, path, null, true);
    }
    this.unobserve(this.engine.scope._gss_id, path);
    if (!result || result.length === void 0) {
      this.engine.provide(['remove', this.engine.getContinuation(path)]);
    }
    return true;
  };

  Queries.prototype.repair = function(path, key, operation, scope, collected) {
    var added, contd, index, leftNew, leftOld, leftUpdate, object, pair, prefix, removed, rightNew, rightOld, rightPath, rightUpdate, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3;
    leftUpdate = (_ref = this.engine.workflow.queries) != null ? _ref[path] : void 0;
    leftNew = ((leftUpdate != null ? leftUpdate[0] : void 0) !== void 0 ? leftUpdate[0] : this.get(path)) || [];
    if (leftNew.old !== void 0) {
      leftOld = leftNew.old || [];
    } else {
      leftOld = (leftUpdate ? leftUpdate[1] : this.get(path)) || [];
    }
    rightPath = this.engine.getScopePath(path) + key;
    rightUpdate = (_ref1 = this.engine.workflow.queries) != null ? _ref1[rightPath] : void 0;
    rightNew = rightUpdate && rightUpdate[0] || this.get(rightPath);
    if (!rightNew && collected) {
      rightNew = this.get(path + this.engine.identity.provide(leftNew[0] || leftOld[0]) + '→' + key);
    }
    rightNew || (rightNew = []);
    if (rightNew.old !== void 0) {
      rightOld = rightNew.old;
    } else if ((rightUpdate != null ? rightUpdate[1] : void 0) !== void 0) {
      rightOld = rightUpdate[1];
    } else if (!rightUpdate) {
      rightOld = this.get(rightPath);
      if (rightOld === void 0) {
        rightOld = rightNew;
      }
    }
    rightOld || (rightOld = []);
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
      prefix = this.engine.getContinuation(path, pair[0], '→');
      this.remove(scope, prefix, null, null, null, true);
      this.clean(prefix + key, null, null, null, null, true);
    }
    for (_l = 0, _len2 = added.length; _l < _len2; _l++) {
      pair = added[_l];
      prefix = this.engine.getContinuation(path, pair[0], '→');
      contd = prefix + operation.path.substring(0, operation.path.length - operation.key.length);
      if (operation.path !== operation.key) {
        this.engine.provide(operation.parent, prefix + operation.path, scope, this.engine.UP, operation.index, pair[1]);
      } else {
        this.engine.provide(operation, contd, scope, this.engine.UP, true, true);
      }
    }
    return this.engine.console.row('repair', [[added, removed], [leftNew, rightNew], [leftOld, rightOld]], path);
  };

  Queries.prototype.isPariedRegExp = /(?:^|→)([^→]+?)(\$[a-z0-9-]+)?→([^→]+)→?$/i;

  Queries.prototype.isPaired = function(operation, continuation) {
    var match;
    if (match = continuation.match(this.isPariedRegExp)) {
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
    var collection, contd, index, match, oppath, path, plural, plurals, schedule, _base, _base1, _i, _len, _ref;
    if (!(match = this.isPaired(null, continuation))) {
      return;
    }
    path = this.engine.getCanonicalPath(match[1]);
    collection = this.get(path);
    if (!(plurals = (_ref = this._plurals) != null ? _ref[path] : void 0)) {
      return;
    }
    oppath = this.engine.getCanonicalPath(continuation, true);
    for (index = _i = 0, _len = plurals.length; _i < _len; index = _i += 3) {
      plural = plurals[index];
      if (oppath !== plural) {
        continue;
      }
      contd = path + '→' + plural;
      this.remove(node, contd, plurals[index + 1], plurals[index + 2], continuation);
      ((_base = ((_base1 = this.engine.workflow).queries || (_base1.queries = {})))[contd] || (_base[contd] = []))[0] = this.get(contd);
      if (this._repairing !== void 0) {
        schedule = (this._repairing || (this._repairing = {}))[path] = true;
      }
    }
  };

  Queries.prototype.pair = function(continuation, operation, scope, result) {
    var collection, element, left, match, plurals, pushed, schedule, _base;
    if (!(match = this.isPaired(operation, continuation, true))) {
      return;
    }
    left = this.engine.getCanonicalPath(match[1]);
    plurals = (_base = (this._plurals || (this._plurals = {})))[left] || (_base[left] = []);
    if (plurals.indexOf(operation.path) === -1) {
      pushed = plurals.push(operation.path, operation, scope);
    }
    collection = this.get(left);
    element = match[2] ? this.engine.identity[match[2]] : this.get(match[1]);
    if (this._repairing !== void 0) {
      schedule = (this._repairing || (this._repairing = {}))[left] = true;
      return -1;
    }
    return collection.indexOf(element);
  };

  Queries.prototype.fetch = function(node, args, operation, continuation, scope) {
    var query;
    node || (node = this.engine.getContext(args, operation, scope, node));
    if (this.engine.workflow.queries) {
      query = this.engine.getQueryPath(operation, node);
      return this.engine.workflow.queries[query];
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

  Queries.prototype.updateOperationCollection = function(operation, path, scope, added, removed) {
    var collection, oppath, updated;
    oppath = this.engine.getCanonicalPath(path);
    if (path === oppath) {
      return;
    }
    collection = this.get(oppath);
    if (removed && removed === collection) {
      return;
    }
    updated = void 0;
    if (removed) {
      if (this.each('remove', removed, oppath, operation, scope, true)) {
        updated = true;
      }
    }
    if (added) {
      if (this.each('add', added, oppath, operation, scope, true)) {
        updated = true;
      }
    }
    return updated;
  };

  Queries.prototype.each = function(method, result, continuation, operation, scope, manual) {
    var child, copy, returned, _i, _len;
    if (result.length !== void 0) {
      copy = result.slice();
      returned = void 0;
      for (_i = 0, _len = copy.length; _i < _len; _i++) {
        child = copy[_i];
        if (this[method](child, continuation, operation, scope, manual)) {
          returned = true;
        }
      }
      return returned;
    } else if (typeof result === 'object') {
      return this[method](result, continuation, operation, scope, manual);
    }
  };

  Queries.prototype.update = function(node, args, result, operation, continuation, scope) {
    var added, child, contd, group, id, index, isCollection, noop, old, path, pathed, plurals, queried, query, removed, watchers, _base, _base1, _base2, _base3, _i, _j, _len, _len1, _ref;
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
        result = queried[0];
      }
    }
    if ((old == null) && (result && result.length === 0) && continuation) {
      old = this.get(this.engine.getCanonicalPath(path));
    }
    isCollection = result && result.length !== void 0;
    if (old === result || (old === void 0 && this.removed)) {
      if (!(result && result.keys)) {
        noop = true;
      }
      old = void 0;
    }
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
      } else if (!result) {
        this.clean(path);
        removed = old;
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
    if (added || removed) {
      this.updateOperationCollection(operation, path, scope, added, removed);
    }
    if (id = this.engine.identity.provide(node)) {
      watchers = (_base1 = this.watchers)[id] || (_base1[id] = []);
      if (this.engine.indexOfTriplet(watchers, operation, continuation, scope) === -1) {
        watchers.push(operation, continuation, scope);
      }
    }
    if (noop) {
      return;
    }
    this.set(path, result);
    if (plurals = (_ref = this._plurals) != null ? _ref[path] : void 0) {
      (this._repairing || (this._repairing = {}))[path] = true;
    }
    if (query) {
      group = (_base2 = this.engine.workflow.queries)[query] || (_base2[query] = []);
    }
    (_base3 = this.engine.workflow.queries)[path] || (_base3[path] = group || (group = []));
    group[0] || (group[0] = result);
    group[1] || (group[1] = old);
    contd = continuation;
    if (contd && contd.charAt(contd.length - 1) === '→') {
      contd = this.engine.getOperationPath(operation, contd);
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
    var index, item, removed, _i, _j, _len, _len1, _ref, _ref1;
    if (result) {
      this[path] = result;
      if (result.length !== void 0) {
        for (index = _i = 0, _len = result.length; _i < _len; index = ++_i) {
          item = result[index];
          this.chain(result[index - 1], item, result, path);
        }
        this.chain(item, void 0, result, path);
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
