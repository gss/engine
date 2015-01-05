/* Selectors with custom combinators 
inspired by Slick of mootools fame (shout-out & credits)

Combinators fetch new elements, while qualifiers filter them.
*/

var Query, Selector, dummy,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

Query = require('./Query');

require('../vendor/weakmap.js');

require('../vendor/MutationObserver.js');

require('../vendor/MutationObserver.attributes.js');

Selector = (function(_super) {
  __extends(Selector, _super);

  Selector.prototype.type = 'Selector';

  function Selector(operation) {
    this.key = this.path = this.serialize(operation);
  }

  Selector.prototype.prepare = function(operation, parent) {
    var argument, name, prefix, suffix, _base, _base1, _i, _len, _name, _ref;
    if (this.prepared) {
      return;
    }
    this.prepared = true;
    prefix = this.getIndexPrefix(operation, parent);
    name = this.getIndex(operation, parent);
    suffix = this.getIndexSuffix(operation, parent);
    ((_base = ((_base1 = parent || this)[_name = prefix + name] || (_base1[_name] = {})))[suffix] || (_base[suffix] = [])).push(operation);
    if (this.tail) {
      for (_i = 0, _len = operation.length; _i < _len; _i++) {
        argument = operation[_i];
        if (((_ref = argument.command) != null ? _ref.head : void 0) === (parent || this).head) {
          argument.command.prepare(argument, parent || this);
        }
      }
    }
  };

  Selector.prototype.perform = function(engine, operation, continuation, scope, ascender, ascending) {
    var args, command, node, result, selector;
    command = operation.command;
    selector = command.selector;
    args = [ascender != null ? ascending : scope, selector];
    command.log(args, engine, operation, continuation, scope, command.selecting && 'select' || 'match');
    result = command.before(args, engine, operation, continuation, scope);
    node = args[0];
    if (command.selecting) {
      if (result == null) {
        result = node.querySelectorAll(args[1]);
      }
    } else if ((result !== node) && node.matches(args[1])) {
      if (result == null) {
        result = node;
      }
    }
    command.unlog(engine, result);
    if (result = command.after(args, result, engine, operation, continuation, scope)) {
      return command.ascend(engine, operation, continuation + selector, scope, result, ascender);
    }
  };

  Selector.prototype.separator = '';

  Selector.prototype.scoped = void 0;

  Selector.prototype.prefix = void 0;

  Selector.prototype.suffix = void 0;

  Selector.prototype.key = void 0;

  Selector.prototype.path = void 0;

  Selector.prototype.tail = void 0;

  Selector.prototype.head = void 0;

  Selector.prototype.singular = void 0;

  Selector.prototype.getIndexPrefix = function(operation, parent) {
    return (parent || this.selecting) && ' ' || '';
  };

  Selector.prototype.getIndex = function(operation) {
    var _ref;
    return (_ref = this.prefix) != null ? _ref : operation[0];
  };

  Selector.prototype.getIndexSuffix = function(operation) {
    return operation[2] || operation[1];
  };

  Selector.prototype.getKey = function() {
    return this.selector || this.key;
  };

  Selector.options = {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
    attributeOldValue: true
  };

  Selector.observe = function(engine) {
    if (this.Observer) {
      this.listener = new this.Observer(this.onMutations.bind(engine));
      return this.connect(engine);
    }
  };

  Selector.Observer = (typeof window !== "undefined" && window !== null) && (window.MutationObserver || window.WebKitMutationObserver || window.JsMutationObserver);

  Selector.connect = function(engine, temporary) {
    if (temporary && window.JsMutationObserver === this.Observer) {
      return;
    }
    return this.listener.observe(engine.scope, this.options);
  };

  Selector.disconnect = function(engine, temporary) {
    if (temporary && window.JsMutationObserver === this.Observer) {
      return;
    }
    return this.listener.disconnect();
  };

  Selector.filterMutation = function(mutation) {
    var parent;
    parent = mutation.target;
    while (parent) {
      if (parent.nodeType === 1 && this.filterNodeMutation(parent) === false) {
        return false;
      }
      parent = parent.parentNode;
    }
    return true;
  };

  Selector.filterNodeMutation = function(target) {
    if (target._gss) {
      return false;
    }
    return true;
  };

  Selector.onMutations = function(mutations) {
    var result;
    if (!this.running) {
      if (this.scope.nodeType === 9) {
        return;
      }
      return this.solve(function() {});
    }
    result = this.solve('Mutate', String(mutations.length), function() {
      var mutation, _base, _base1, _base2, _i, _len;
      if (this.updating.index > -1) {
        this.updating.reset();
      }
      for (_i = 0, _len = mutations.length; _i < _len; _i++) {
        mutation = mutations[_i];
        if (Selector.filterMutation(mutation) === false) {
          continue;
        }
        switch (mutation.type) {
          case "attributes":
            Selector.mutateAttribute(this, mutation.target, mutation.attributeName, mutation.oldValue || '');
            if ((_base = this.updating).restyled == null) {
              _base.restyled = true;
            }
            break;
          case "childList":
            if (Selector.mutateChildList(this, mutation.target, mutation)) {
              if ((_base1 = this.updating).restyled == null) {
                _base1.restyled = true;
              }
            }
            break;
          case "characterData":
            if ((_base2 = this.updating).restyled == null) {
              _base2.restyled = true;
            }
            Selector.mutateCharacterData(this, mutation.target, mutation);
        }
        this.intrinsic.validate(mutation.target);
      }
    });
    if (!this.scope.parentNode && this.scope.nodeType === 1) {
      this.destroy();
    }
    return result;
  };

  Selector.mutateChildList = function(engine, target, mutation) {
    var added, allAdded, allChanged, allMoved, allRemoved, attribute, changed, changedTags, child, el, firstNext, firstPrev, id, index, j, kls, moved, next, node, parent, prev, prop, queries, removed, tag, update, value, values, _i, _j, _k, _l, _len, _len1, _len10, _len11, _len12, _len13, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _len9, _m, _n, _o, _p, _q, _r, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _s, _t, _u, _v;
    added = [];
    removed = [];
    _ref = mutation.addedNodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      if (child.nodeType === 1 && this.filterNodeMutation(child) !== false) {
        added.push(child);
      }
    }
    _ref1 = mutation.removedNodes;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      child = _ref1[_j];
      if (child.nodeType === 1 && this.filterNodeMutation(child) !== false) {
        if ((index = added.indexOf(child)) > -1) {
          added.splice(index, 1);
        } else {
          removed.push(child);
        }
      }
    }
    this.mutateCharacterData(engine, target, target);
    changed = added.concat(removed);
    if (!changed.length) {
      return;
    }
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
    queries = engine.queries;
    while ((prev = prev.previousSibling)) {
      if (prev.nodeType === 1) {
        if (firstPrev) {
          this.prototype.match(engine, prev, '+', void 0, '*');
          this.prototype.match(engine, prev, '++', void 0, '*');
          firstPrev = false;
        }
        this.prototype.match(engine, prev, '~', void 0, changedTags);
        this.prototype.match(engine, prev, '~~', void 0, changedTags);
        next = prev;
      }
    }
    while ((next = next.nextSibling)) {
      if (next.nodeType === 1) {
        if (firstNext) {
          this.prototype.match(engine, next, '!+', void 0, '*');
          this.prototype.match(engine, next, '++', void 0, '*');
          firstNext = false;
        }
        this.prototype.match(engine, next, '!~', void 0, changedTags);
        this.prototype.match(engine, next, '~~', void 0, changedTags);
      }
    }
    this.prototype.match(engine, target, '>', void 0, changedTags);
    allAdded = [];
    allRemoved = [];
    allMoved = [];
    moved = [];
    for (_l = 0, _len3 = added.length; _l < _len3; _l++) {
      child = added[_l];
      this.prototype.match(engine, child, '!>', void 0, target);
      allAdded.push(child);
      _ref2 = child.getElementsByTagName('*');
      for (_m = 0, _len4 = _ref2.length; _m < _len4; _m++) {
        el = _ref2[_m];
        allAdded.push(el);
      }
    }
    for (_n = 0, _len5 = removed.length; _n < _len5; _n++) {
      child = removed[_n];
      allRemoved.push(child);
      _ref3 = child.getElementsByTagName('*');
      for (_o = 0, _len6 = _ref3.length; _o < _len6; _o++) {
        el = _ref3[_o];
        allRemoved.push(el);
      }
    }
    allChanged = allAdded.concat(allRemoved, allMoved);
    update = {};
    for (_p = 0, _len7 = allChanged.length; _p < _len7; _p++) {
      node = allChanged[_p];
      _ref4 = node.attributes;
      for (_q = 0, _len8 = _ref4.length; _q < _len8; _q++) {
        attribute = _ref4[_q];
        switch (attribute.name) {
          case 'class':
            _ref5 = node.classList || node.className.split(/\s+/);
            for (_r = 0, _len9 = _ref5.length; _r < _len9; _r++) {
              kls = _ref5[_r];
              this.index(update, ' .', kls);
            }
            break;
          case 'id':
            this.index(update, ' #', attribute.value);
        }
        this.index(update, ' attribute', attribute.name);
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
        this.index(update, ' :', 'first-child');
      }
      if (!next) {
        this.index(update, ' :', 'last-child');
      }
      this.index(update, ' +', child.tagName);
    }
    parent = target;
    while (parent) {
      this.prototype.match(engine, parent, ' ', void 0, allChanged);
      for (_s = 0, _len10 = allChanged.length; _s < _len10; _s++) {
        child = allChanged[_s];
        this.prototype.match(engine, child, '!', void 0, parent);
      }
      for (prop in update) {
        values = update[prop];
        for (_t = 0, _len11 = values.length; _t < _len11; _t++) {
          value = values[_t];
          if (prop.charAt(1) === '$') {
            this.prototype.match(engine, parent, prop, value);
          } else {
            this.prototype.match(engine, parent, prop, void 0, value);
          }
        }
      }
      if (parent === engine.scope) {
        break;
      }
      if (!(parent = parent.parentNode)) {
        break;
      }
    }
    for (_u = 0, _len12 = allRemoved.length; _u < _len12; _u++) {
      removed = allRemoved[_u];
      if (allAdded.indexOf(removed) === -1) {
        if (id = engine.identity.find(removed)) {
          (engine.removed || (engine.removed = [])).push(id);
        }
      }
    }
    if (engine.removed) {
      for (_v = 0, _len13 = allAdded.length; _v < _len13; _v++) {
        added = allAdded[_v];
        if ((j = engine.removed.indexOf(engine.identity.find(added))) > -1) {
          engine.removed.splice(j, 1);
        }
      }
    }
    return true;
  };

  Selector.mutateCharacterData = function(engine, target, parent) {
    var id, _ref;
    if (parent == null) {
      parent = target.parentNode;
    }
    if (id = engine.identity.find(parent)) {
      if (parent.tagName === 'STYLE') {
        if (((_ref = parent.getAttribute('type')) != null ? _ref.indexOf('text/gss') : void 0) > -1) {
          return engine["import"](parent);
        }
      }
    }
  };

  Selector.mutateAttribute = function(engine, target, name, changed) {
    var $attribute, $class, klasses, kls, old, parent, _i, _j, _k, _len, _len1, _len2, _ref;
    if (name === 'class' && typeof changed === 'string') {
      klasses = target.classList || target.className.split(/\s+/);
      old = changed.split(' ');
      changed = [];
      for (_i = 0, _len = old.length; _i < _len; _i++) {
        kls = old[_i];
        if (!(kls && ((_ref = klasses.indexOf && klasses.indexOf(kls) > -1) != null ? _ref : klasses.contains(kls)))) {
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
      $attribute = target === parent && 'attribute' || ' attribute';
      this.prototype.match(engine, parent, $attribute, name, target);
      if ((changed != null ? changed.length : void 0) && name === 'class') {
        $class = target === parent && '.' || ' .';
        for (_k = 0, _len2 = changed.length; _k < _len2; _k++) {
          kls = changed[_k];
          this.prototype.match(engine, parent, $class, kls, target);
        }
      }
      if (parent === engine.scope) {
        break;
      }
      if (!(parent = parent.parentNode)) {
        break;
      }
    }
    return this;
  };

  Selector.index = function(update, type, value) {
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

  return Selector;

})(Query);

Selector.prototype.checkers.selector = function(command, other, parent, operation) {
  var selecting;
  if (!other.head) {
    if (other instanceof Selector.Combinator && operation[0] !== ' ') {
      return;
    }
  }
  if (!command.key && !other.selector && other.key !== other.path) {
    return;
  }
  if (selecting = command.selecting) {
    if (!other.selecting) {
      return;
    }
  }
  if (parent[0] === ',') {
    if ((other.selector || other.key) !== other.path) {
      return;
    }
  }
  return true;
};

Selector.prototype.mergers.selector = function(command, other, parent, operation, inherited) {
  var left, right;
  if (other.selecting) {
    command.selecting || (command.selecting = true);
  }
  other.head = parent;
  command.head = parent;
  command.tail = other.tail || (other.tail = operation);
  command.tail.command.head = parent;
  left = other.selector || other.key;
  right = command.selector || command.key;
  command.selector = inherited ? right + command.separator + left : left + right;
  return true;
};

Selector.Selecter = Selector.extend({
  signature: [
    {
      query: ['String']
    }
  ],
  selecting: true,
  getIndexPrefix: function() {
    return ' ';
  }
});

Selector.Combinator = Selector.Selecter.extend({
  signature: [
    [
      {
        context: ['Selector']
      }
    ]
  ],
  getIndexSuffix: function(operation) {
    return operation.parent[0] === 'tag' && operation.parent[2].toUpperCase() || "*";
  },
  getIndexPrefix: function(operation, parent) {
    return parent && ' ' || '';
  }
});

Selector.Virtual = Selector.extend({
  signature: [
    [
      {
        context: ['Selector']
      }
    ], {
      query: ['String']
    }
  ]
});

Selector.Qualifier = Selector.extend({
  signature: [
    {
      context: ['Selector'],
      matcher: ['String']
    }
  ]
});

Selector.Search = Selector.extend({
  signature: [
    [
      {
        context: ['Selector']
      }
    ], {
      matcher: ['String'],
      query: ['String']
    }
  ]
});

Selector.Attribute = Selector.Search.extend({
  getIndex: function() {
    return 'attribute';
  }
});

Selector.Element = Selector.extend({
  signature: [
    [
      {
        parameter: ['Number', 'String']
      }
    ]
  ]
});

Selector.Reference = Selector.Element.extend({
  excludes: ['Selector', 'Iterator'],
  condition: function(engine, operation) {
    return this.excludes.indexOf(operation.parent.command.type) === -1;
  },
  kind: 'Element',
  prefix: '',
  after: function() {
    return result;
  },
  retrieve: function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    args.unshift(args[1][1]);
    return this.execute.apply(this, args);
  },
  reference: true
});

Selector.define({
  '.': {
    helpers: ['class', 'getElementsByClassName'],
    tags: ['selector'],
    Selecter: function(value, engine, operation, continuation, scope) {
      return scope.getElementsByClassName(value);
    },
    Qualifier: function(node, value) {
      if (node.classList.contains(value)) {
        return node;
      }
    }
  },
  'tag': {
    helpers: ['getElementsByTagName'],
    tags: ['selector'],
    prefix: '',
    Selecter: function(value, engine, operation, continuation, scope) {
      return scope.getElementsByTagName(value);
    },
    Qualifier: function(node, value) {
      if (value === '*' || node.tagName === value.toUpperCase()) {
        return node;
      }
    },
    getIndexSuffix: function(operation) {
      return operation[operation.length - 1].toUpperCase();
    }
  },
  '#': {
    helpers: ['id', 'getElementById'],
    tags: ['selector'],
    Selecter: function(id, engine, operation, continuation, scope) {
      if (scope == null) {
        scope = engine.scope;
      }
      return (typeof scope.getElementById === "function" ? scope.getElementById(id) : void 0) || scope.querySelector('[id="' + id + '"]');
    },
    Qualifier: function(node, value) {
      if (node.id === value) {
        return node;
      }
    },
    singular: true
  },
  ' ': {
    tags: ['selector'],
    Combinator: {
      execute: function(node, engine, operation, continuation, scope) {
        return (node || scope).getElementsByTagName("*");
      },
      getIndexPrefix: function() {
        return '';
      }
    }
  },
  '!': {
    Combinator: function(node, engine, operation, continuation, scope) {
      var nodes;
      nodes = void 0;
      while (node = (node || scope).parentNode) {
        if (node.nodeType === 1) {
          (nodes || (nodes = [])).push(node);
        }
      }
      return nodes;
    }
  },
  '>': {
    tags: ['selector'],
    Combinator: function(node, engine, operation, continuation, scope) {
      return (node || scope).children;
    }
  },
  '!>': {
    Combinator: function(node, engine, operation, continuation, scope) {
      return (node || scope).parentElement;
    }
  },
  '+': {
    tags: ['selector'],
    Combinator: function(node, engine, operation, continuation, scope) {
      return (node || scope).nextElementSibling;
    }
  },
  '!+': {
    Combinator: function(node, engine, operation, continuation, scope) {
      return (node || scope).previousElementSibling;
    }
  },
  '++': {
    Combinator: function(node) {
      var next, nodes, prev;
      nodes = void 0;
      if (prev = node.previousElementSibling) {
        (nodes || (nodes = [])).push(prev);
      }
      if (next = node.nextElementSibling) {
        (nodes || (nodes = [])).push(next);
      }
      return nodes;
    }
  },
  '~': {
    tags: ['selector'],
    Combinator: function(node) {
      var nodes;
      nodes = void 0;
      while (node = node.nextElementSibling) {
        (nodes || (nodes = [])).push(node);
      }
      return nodes;
    }
  },
  '!~': {
    Combinator: function(node) {
      var nodes, prev;
      nodes = void 0;
      prev = node.parentNode.firstElementChild;
      while (prev !== node) {
        (nodes || (nodes = [])).push(prev);
        prev = prev.nextElementSibling;
      }
      return nodes;
    }
  },
  '~~': {
    Combinator: function(node) {
      var nodes, prev;
      nodes = void 0;
      prev = node.parentNode.firstElementChild;
      while (prev) {
        if (prev !== node) {
          (nodes || (nodes = [])).push(prev);
        }
        prev = prev.nextElementSibling;
      }
      return nodes;
    }
  }
});

Selector.define({
  '&': {
    before: function() {},
    after: function(args, result) {
      return result;
    },
    serialize: function(operation) {
      var _ref;
      if ((_ref = Selector[operation.parent[0]]) != null ? _ref.prototype.Qualifier : void 0) {
        return '&';
      } else {
        return '';
      }
    },
    log: function() {},
    unlog: function() {},
    hidden: true,
    Element: function(parameter, engine, operation, continuation, scope) {
      return scope;
    },
    retrieve: function() {
      return this.execute.apply(this, arguments);
    },
    "continue": function(engine, operation, continuation) {
      var key;
      if (continuation == null) {
        continuation = '';
      }
      if ((key = this.key) === '&' && continuation.charAt(continuation.length - 1) === '&') {
        return continuation;
      }
      return continuation + this.key;
    }
  },
  '^': {
    Element: function(parameter, engine, operation, continuation, scope) {
      if (parameter == null) {
        parameter = 1;
      }
      return this.getParentScope(engine, scope, continuation, parameter);
    }
  },
  '$': {
    Element: function(parameter, engine, operation, continuation, scope) {
      return engine.scope;
    }
  },
  '::window': {
    Reference: function() {
      return '::window';
    },
    stringy: true
  },
  'virtual': {
    localizers: ['Selector', 'Iterator'],
    Virtual: function(node, value, engine, operation, continuation, scope) {
      var prefix;
      if (!node && this.localizers.indexOf(operation.parent.command.type) > -1) {
        node = scope;
      }
      prefix = this.getScope(engine, node, continuation) || '$';
      return prefix + '"' + value + '"';
    },
    prefix: '"'
  }
});

Selector.define({
  '[=]': {
    tags: ['selector'],
    prefix: '[',
    separator: '="',
    suffix: '"]',
    Attribute: function(node, attribute, value) {
      if (node.getAttribute(attribute) === value) {
        return node;
      }
    }
  },
  '[*=]': {
    tags: ['selector'],
    prefix: '[',
    separator: '*="',
    suffix: '"]',
    Attribute: function(node, attribute, value) {
      var _ref;
      if (((_ref = node.getAttribute(attribute)) != null ? _ref.indexOf(value) : void 0) > -1) {
        return node;
      }
    }
  },
  '[|=]': {
    tags: ['selector'],
    prefix: '[',
    separator: '|="',
    suffix: '"]',
    Attribute: function(node, attribute, value) {
      if (node.getAttribute(attribute) != null) {
        return node;
      }
    }
  },
  '[]': {
    tags: ['selector'],
    prefix: '[',
    suffix: ']',
    Attribute: function(node, attribute) {
      if (node.getAttribute(attribute) != null) {
        return node;
      }
    }
  }
});

Selector.define({
  ':value': {
    Qualifier: function(node) {
      return node.value;
    },
    watch: "oninput"
  },
  ':get': {
    Qualifier: function(node, property, engine, operation, continuation, scope) {
      return node[property];
    }
  },
  ':first-child': {
    tags: ['selector'],
    Combinator: function(node) {
      if (!node.previousElementSibling) {
        return node;
      }
    }
  },
  ':last-child': {
    tags: ['selector'],
    Combinator: function(node) {
      if (!node.nextElementSibling) {
        return node;
      }
    }
  },
  ':next': {
    relative: true,
    Combinator: function(node, engine, operation, continuation, scope) {
      var collection, index;
      if (node == null) {
        node = scope;
      }
      collection = this.getCanonicalCollection(engine, continuation);
      index = collection != null ? collection.indexOf(node) : void 0;
      if ((index == null) || index === -1 || index === collection.length - 1) {
        return;
      }
      return collection[index + 1];
    }
  },
  ':previous': {
    relative: true,
    Combinator: function(node, engine, operation, continuation, scope) {
      var collection, index;
      if (node == null) {
        node = scope;
      }
      collection = this.getCanonicalCollection(engine, continuation);
      index = collection != null ? collection.indexOf(node) : void 0;
      if (index === -1 || !index) {
        return;
      }
      return collection[index - 1];
    }
  },
  ':last': {
    relative: true,
    singular: true,
    Combinator: function(node, engine, operation, continuation, scope) {
      var collection, index;
      if (node == null) {
        node = scope;
      }
      collection = this.getCanonicalCollection(engine, continuation);
      index = collection != null ? collection.indexOf(node) : void 0;
      if (index == null) {
        return;
      }
      if (index === collection.length - 1) {
        return node;
      }
    }
  },
  ':first': {
    relative: true,
    singular: true,
    Combinator: function(node, engine, operation, continuation, scope) {
      var collection, index;
      if (node == null) {
        node = scope;
      }
      collection = this.getCanonicalCollection(engine, continuation);
      index = collection != null ? collection.indexOf(node) : void 0;
      if (index == null) {
        return;
      }
      if (index === 0) {
        return node;
      }
    }
  },
  ',': {
    tags: ['selector'],
    signature: false,
    separator: ',',
    serialize: function() {
      return '';
    },
    "yield": function(result, engine, operation, continuation, scope, ascender) {
      var contd;
      contd = this.getPrefixPath(engine, continuation) + operation.parent.command.path;
      this.add(engine, result, contd, operation.parent, scope, operation, continuation);
      this.defer(engine, operation.parent, contd, scope);
      return true;
    },
    release: function(result, engine, operation, continuation, scope) {
      var contd;
      contd = this.getPrefixPath(engine, continuation) + operation.parent.command.path;
      this.remove(engine, result, contd, operation.parent, scope, operation, void 0, continuation);
      return true;
    },
    descend: function(engine, operation, continuation, scope, ascender, ascending) {
      var argument, index, _i, _ref;
      for (index = _i = 1, _ref = operation.length; _i < _ref; index = _i += 1) {
        if ((argument = operation[index]) instanceof Array) {
          argument.parent || (argument.parent = operation);
          engine.Command(argument).solve(operation.domain || engine, argument, continuation, scope);
        }
      }
      return false;
    }
  }
});

if (typeof document !== "undefined" && document !== null) {
  dummy = Selector.dummy = document.createElement('_');
  if (!dummy.hasOwnProperty("classList")) {
    Selector['.'].prototype.Qualifier = function(node, value) {
      if (node.className.split(/\s+/).indexOf(value) > -1) {
        return node;
      }
    };
  }
  if (!dummy.hasOwnProperty("parentElement")) {
    Selector['!>'].prototype.Combinator = function(node, engine, operation, continuation, scope) {
      var parent;
      if (node == null) {
        node = scope;
      }
      if (parent = node.parentNode) {
        if (parent.nodeType === 1) {
          return parent;
        }
      }
    };
  }
  if (!dummy.hasOwnProperty("nextElementSibling")) {
    Selector['+'].prototype.Combinator = function(node) {
      while (node = node.nextSibling) {
        if (node.nodeType === 1) {
          return node;
        }
      }
    };
    Selector['!+'].prototype.Combinator = function(node) {
      while (node = node.previousSibling) {
        if (node.nodeType === 1) {
          return node;
        }
      }
    };
    Selector['++'].prototype.Combinator = function(node) {
      var next, nodes, prev;
      nodes = void 0;
      prev = next = node;
      while (prev = prev.previousSibling) {
        if (prev.nodeType === 1) {
          (nodes || (nodes = [])).push(prev);
          break;
        }
      }
      while (next = next.nextSibling) {
        if (next.nodeType === 1) {
          (nodes || (nodes = [])).push(next);
          break;
        }
      }
      return nodes;
    };
    Selector['~'].prototype.Combinator = function(node) {
      var nodes;
      nodes = void 0;
      while (node = node.nextSibling) {
        if (node.nodeType === 1) {
          (nodes || (nodes = [])).push(node);
        }
      }
      return nodes;
    };
    Selector['!~'].prototype.Combinator = function(node) {
      var nodes, prev;
      nodes = void 0;
      prev = node.parentNode.firstChild;
      while (prev && (prev !== node)) {
        if (prev.nodeType === 1) {
          (nodes || (nodes = [])).push(prev);
        }
        prev = prev.nextSibling;
      }
      return nodes;
    };
    Selector['~~'].prototype.Combinator = function(node) {
      var nodes, prev;
      nodes = void 0;
      prev = node.parentNode.firstChild;
      while (prev) {
        if (prev !== node && prev.nodeType === 1) {
          (nodes || (nodes = [])).push(prev);
        }
        prev = prev.nextSibling;
      }
      return nodes;
    };
    Selector[':first-child'].prototype.Selecter = function(node) {
      var child, parent;
      if (parent = node.parentNode) {
        child = parent.firstChild;
        while (child && child.nodeType !== 1) {
          child = child.nextSibling;
        }
        if (child === node) {
          return node;
        }
      }
    };
    Selector[':last-child'].prototype.Qualifier = function(node) {
      var child, parent;
      if (parent = node.parentNode) {
        child = parent.lastChild;
        while (child && child.nodeType !== 1) {
          child = child.previousSibling;
        }
        if (child === node) {
          return mpde;
        }
      }
    };
  }
}

module.exports = Selector;
