/* Selectors with custom combinators 
inspired by Slick of mootools fame (shout-out & credits)

Combinators fetch new elements, while qualifiers filter them.
*/

var Command, Query, Selector, dummy,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../concepts/Command');

Query = require('./Query');

Selector = (function(_super) {
  __extends(Selector, _super);

  Selector.prototype.type = 'Selector';

  function Selector(operation) {
    this.key = this.path = this.serialize(operation);
  }

  Selector.prototype.prepare = function(operation, parent) {
    var name, prefix, suffix, _base, _name;
    prefix = this.getIndexPrefix(operation, parent);
    name = this.getIndex(operation, parent);
    suffix = this.getIndexSuffix(operation, parent);
    return ((_base = (this[_name = prefix + name] || (this[_name] = {})))[suffix] || (_base[suffix] = [])).push(operation);
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

  Selector.prototype.relative = void 0;

  Selector.prototype.before = function(args, engine, operation, continuation, scope) {
    return engine.queries.fetch(args, operation, continuation, scope);
  };

  Selector.prototype.after = function(args, result, engine, operation, continuation, scope) {
    return engine.queries.update(args, result, operation, continuation, scope);
  };

  Selector.prototype.getIndex = function(operation) {
    return operation[0];
  };

  Selector.prototype.getIndexPrefix = function(operation, parent) {
    return parent && ' ' || '';
  };

  Selector.prototype.getIndexSuffix = function(operation) {
    return operation[2] || operation[1];
  };

  return Selector;

})(Query);

Selector.prototype.mergers.selector = function(command, other, parent, operation, inherited) {
  var left, right, selecting;
  if (!other.head) {
    if (other instanceof Selector.Combinator && operation[0] !== ' ') {
      return;
    }
  }
  if (selecting = command instanceof Selector.Selecter) {
    if (!other.selecting) {
      return;
    }
  } else if (other.selecting) {
    command.selecting = true;
  }
  other.head = parent;
  command.head = parent;
  command.tail = other.tail || operation;
  command.tail.head = parent;
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
  getIndexPrefix: function() {
    return ' ';
  }
});

Selector.Combinator = Selector.Selecter.extend({
  signature: [
    [
      {
        context: ['Selector'],
        query: ['String']
      }
    ]
  ],
  getIndex: function(operation) {
    return operation.parent.name === "$tag" && operation.parent[2] || "*";
  }
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
    {
      context: ['Selector'],
      matcher: ['String'],
      query: ['String']
    }
  ]
});

Selector.Element = Selector.extend({
  signature: [],
  before: function() {},
  after: function(args, result) {
    return result;
  },
  serialize: function() {
    return '';
  }
});

Selector.define({
  'class': {
    prefix: '.',
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
    tags: ['selector'],
    prefix: '',
    Selecter: function(value, engine, operation, continuation, scope) {
      return scope.getElementsByTagName(value);
    },
    Qualifier: function(node, value) {
      if (value === '*' || node.tagName === value.toUpperCase()) {
        return node;
      }
    }
  },
  'id': {
    prefix: '#',
    tags: ['selector'],
    Selecter: function(id, engine, operation, continuation, scope) {
      if (scope == null) {
        scope = this.scope;
      }
      return (typeof scope.getElementById === "function" ? scope.getElementById(id) : void 0) || scope.querySelector('[id="' + id + '"]');
    },
    Qualifier: function(node, value) {
      if (node.id === value) {
        return node;
      }
    }
  },
  ' ': {
    tags: ['selector'],
    Combinator: {
      execute: function(node) {
        return node.getElementsByTagName("*");
      },
      getIndexPrefix: function() {
        return '';
      }
    }
  },
  '!': {
    Combinator: function(node) {
      var nodes;
      nodes = void 0;
      while (node = node.parentNode) {
        if (node.nodeType === 1) {
          (nodes || (nodes = [])).push(node);
        }
      }
      return nodes;
    }
  },
  '>': {
    tags: ['selector'],
    Combinator: function(node) {
      return node.children;
    }
  },
  '!>': {
    Combinator: function(node) {
      return node.parentElement;
    }
  },
  '+': {
    tags: ['selector'],
    Combinator: function(node) {
      return node.nextElementSibling;
    }
  },
  '!+': {
    Combinator: function(node) {
      return node.previousElementSibling;
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
  '::this': {
    log: function() {},
    Element: function(engine, operation, continuation, scope) {
      return scope;
    },
    "continue": function(engine, operation, continuation) {
      return continuation;
    }
  },
  '::parent': {
    Element: Selector['!>'].prototype.Combinator
  },
  '::root': {
    Element: function(engine, operation, continuation, scope) {
      return engine.scope;
    }
  },
  '::window': {
    hidden: true,
    Element: function() {
      return '::window';
    }
  }
});

Selector.define({
  '[=]': {
    tags: ['selector'],
    prefix: '[',
    separator: '="',
    suffix: '"]',
    Search: function(node, attribute, value) {
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
    Search: function(node, attribute, value) {
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
    Search: function(node, attribute, value) {
      if (node.getAttribute(attribute) != null) {
        return node;
      }
    }
  },
  '[]': {
    tags: ['selector'],
    prefix: '[',
    suffix: ']',
    Search: function(node, attribute) {
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
    Combinator: function(property, engine, operation, continuation, scope) {
      return scope[property];
    }
  },
  ':first-child': {
    tags: ['selector'],
    Selecter: function(node) {
      if (!node.previousElementSibling) {
        return node;
      }
    }
  },
  ':last-child': {
    tags: ['selector'],
    Selecter: function(node) {
      if (!node.nextElementSibling) {
        return node;
      }
    }
  },
  ':next': {
    relative: true,
    Selecter: function(node, engine, operation, continuation, scope) {
      var collection, index;
      collection = engine.queries.getScopedCollection(operation, continuation, scope);
      index = collection != null ? collection.indexOf(node) : void 0;
      if ((index == null) || index === -1 || index === collection.length - 1) {
        return;
      }
      return collection[index + 1];
    }
  },
  ':previous': {
    relative: true,
    Selecter: function(node, engine, operation, continuation, scope) {
      var collection, index;
      collection = engine.queries.getScopedCollection(operation, continuation, scope);
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
      collection = engine.queries.getScopedCollection(operation, continuation, scope);
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
    Selecter: function(node, engine, operation, continuation, scope) {
      var collection, index;
      collection = engine.queries.getScopedCollection(operation, continuation, scope);
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
    eager: true,
    signature: null,
    separator: ',',
    serialize: function() {
      return '';
    },
    command: function(engine, operation, continuation, scope) {
      var contd, index;
      contd = this.Continuation.getScopePath(scope, continuation) + operation.path;
      if (this.queries.ascending) {
        index = this.engine.indexOfTriplet(this.queries.ascending, operation, contd, scope) === -1;
        if (index > -1) {
          this.queries.ascending.splice(index, 3);
        }
      }
      return this.queries[contd];
    },
    "yield": function(result, engine, operation, continuation, scope, ascender) {
      var contd, _base;
      contd = engine.Continuation.getScopePath(scope, continuation) + operation.parent.path;
      engine.queries.add(result, contd, operation.parent, scope, operation, continuation);
      (_base = engine.queries).ascending || (_base.ascending = []);
      if (engine.indexOfTriplet(engine.queries.ascending, operation.parent, contd, scope) === -1) {
        engine.queries.ascending.push(operation.parent, contd, scope);
      }
      return true;
    },
    release: function(result, engine, operation, continuation, scope) {
      var contd;
      contd = engine.Continuation.getScopePath(scope, continuation) + operation.parent.path;
      engine.queries.remove(result, contd, operation.parent, scope, operation, void 0, continuation);
      return true;
    }
  }
});

if (typeof document !== "undefined" && document !== null) {
  dummy = Selector.dummy = document.createElement('_');
  if (!dummy.hasOwnProperty("classList")) {
    Selector['class'].prototype.Qualifier = function(node, value) {
      if (node.className.split(/\s+/).indexOf(value) > -1) {
        return node;
      }
    };
  }
  if (!dummy.hasOwnProperty("parentElement")) {
    Selector['!>'].prototype.Combinator = Selector['::parent'].prototype.Element = function(node) {
      var parent;
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
    Selector[':first-child'].prototype.Qualifier = function(node) {
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
