var Mutations;

Mutations = (function() {
  Mutations.prototype.options = {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
    attributeOldValue: true
  };

  function Mutations(engine) {
    this.engine = engine;
    this.listener = new this.Observer(this.solve.bind(this));
  }

  Mutations.prototype.Observer = (typeof window !== "undefined" && window !== null) && (window.MutationObserver || window.WebKitMutationObserver || window.JsMutationObserver);

  Mutations.prototype.connect = function() {
    return this.listener.observe(this.engine.scope, this.options);
  };

  Mutations.prototype.disconnect = function() {
    return this.listener.disconnect();
  };

  Mutations.prototype.solve = function(mutations) {
    var result;
    if (!this.engine.engine.running) {
      return this.engine.engine.compile(true);
    }
    result = this.engine.engine.solve('mutations', function() {
      var mutation, qualified, _i, _len;
      this.engine.workflow.queries = void 0;
      this.engine.workflow.reflown = void 0;
      qualified = this.queries.qualified = this.engine.workflow.qualified = [];
      for (_i = 0, _len = mutations.length; _i < _len; _i++) {
        mutation = mutations[_i];
        switch (mutation.type) {
          case "attributes":
            this.mutations.onAttributes(mutation.target, mutation.attributeName, mutation.oldValue);
            break;
          case "childList":
            this.mutations.onChildList(mutation.target, mutation);
            break;
          case "characterData":
            this.mutations.onCharacterData(mutation.target, mutation);
        }
        this.intrinsic.validate(mutation.target);
      }
    });
    return result;
  };

  Mutations.prototype.onChildList = function(target, mutation) {
    var added, allAdded, allChanged, allMoved, allRemoved, attribute, changed, changedTags, child, firstNext, firstPrev, id, index, j, kls, moved, next, node, parent, prev, prop, removed, tag, update, value, values, _base, _i, _j, _k, _l, _len, _len1, _len10, _len11, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _len9, _m, _n, _o, _p, _q, _r, _ref, _ref1, _ref2, _ref3, _s, _t;
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
          this.engine.queries.match(prev, '+', void 0, '*');
          this.engine.queries.match(prev, '++', void 0, '*');
          firstPrev = false;
        }
        this.engine.queries.match(prev, '~', void 0, changedTags);
        this.engine.queries.match(prev, '~~', void 0, changedTags);
        next = prev;
      }
    }
    while ((next = next.nextSibling)) {
      if (next.nodeType === 1) {
        if (firstNext) {
          this.engine.queries.match(next, '!+', void 0, '*');
          this.engine.queries.match(next, '++', void 0, '*');
          firstNext = false;
        }
        this.engine.queries.match(next, '!~', void 0, changedTags);
        this.engine.queries.match(next, '~~', void 0, changedTags);
      }
    }
    this.engine.queries.match(target, '>', void 0, changedTags);
    allAdded = [];
    allRemoved = [];
    allMoved = [];
    moved = [];
    for (_l = 0, _len3 = added.length; _l < _len3; _l++) {
      child = added[_l];
      this.engine.queries.match(child, '!>', void 0, target);
      allAdded.push(child);
      allAdded.push.apply(allAdded, child.getElementsByTagName('*'));
    }
    for (_m = 0, _len4 = removed.length; _m < _len4; _m++) {
      child = removed[_m];
      allRemoved.push(child);
      allRemoved.push.apply(allRemoved, child.getElementsByTagName('*'));
    }
    allChanged = allAdded.concat(allRemoved, allMoved);
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
      this.engine.queries.match(parent, ' ', void 0, allChanged);
      for (_q = 0, _len8 = allChanged.length; _q < _len8; _q++) {
        child = allChanged[_q];
        this.engine.queries.match(child, '!', void 0, parent);
      }
      for (prop in update) {
        values = update[prop];
        for (_r = 0, _len9 = values.length; _r < _len9; _r++) {
          value = values[_r];
          if (prop.charAt(1) === '$') {
            this.engine.queries.match(parent, prop, value);
          } else {
            this.engine.queries.match(parent, prop, void 0, value);
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
      if (allAdded.indexOf(removed) === -1) {
        if (id = this.engine.identity.find(removed)) {
          ((_base = this.engine.queries).removed || (_base.removed = [])).push(id);
        }
      }
    }
    if (this.engine.queries.removed) {
      for (_t = 0, _len11 = allAdded.length; _t < _len11; _t++) {
        added = allAdded[_t];
        if ((j = this.engine.queries.removed.indexOf(this.engine.identity.find(added))) > -1) {
          this.engine.queries.removed.splice(j, 1);
        }
      }
    }
    return this;
  };

  Mutations.prototype.index = function(update, type, value) {
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

  Mutations.prototype.onCharacterData = function(target) {
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

  Mutations.prototype.onAttributes = function(target, name, changed) {
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
      this.engine.queries.match(parent, $attribute, name, target);
      if ((changed != null ? changed.length : void 0) && name === 'class') {
        $class = target === parent && '$class' || ' $class';
        for (_k = 0, _len2 = changed.length; _k < _len2; _k++) {
          kls = changed[_k];
          this.engine.queries.match(parent, $class, kls, target);
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

  return Mutations;

})();

module.exports = Mutations;
