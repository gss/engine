/* Selectors with custom combinators 
inspired by Slick of mootools fame (shout-out & credits)

Combinators fetch new elements, while qualifiers filter them.
*/

var Command, Query, Selector, dummy, _class, _class1, _class2, _ref, _ref1, _ref2, _ref3,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../concepts/Command');

Query = require('./Query');

Selector = (function(_super) {
  __extends(Selector, _super);

  function Selector() {
    _ref = Selector.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Selector.prototype.toString = function(command, operation) {
    var argument, index, string, _i, _ref1;
    if (command.prefix) {
      string = command.prefix;
    } else {
      string = operation[0];
    }
    for (index = _i = 1, _ref1 = operation.length; 1 <= _ref1 ? _i < _ref1 : _i > _ref1; index = 1 <= _ref1 ? ++_i : --_i) {
      if (argument = operation[index]) {
        if (command = argument.command) {
          string += command.name;
        } else {
          string += argument;
        }
      }
    }
    if (command.suffix) {
      string += suffix;
    }
    return string;
  };

  Selector.prototype.prepare = function(operation, parent) {
    var group, index, prefix, _base, _ref1;
    prefix = ((parent && operation.name !== ' ') || (operation[0] !== '$combinator' && typeof operation[1] !== 'object')) && ' ' || '';
    switch (operation[0]) {
      case '$tag':
        if ((!parent || operation === ((_ref1 = operation.selector) != null ? _ref1.tail : void 0)) && operation[1][0] !== '$combinator') {
          group = ' ';
          index = (operation[2] || operation[1]).toUpperCase();
        }
        break;
      case '$combinator':
        group = prefix + operation.name;
        index = operation.parent.name === "$tag" && operation.parent[2].toUpperCase() || "*";
        break;
      case '$class':
      case '$pseudo':
      case '$attribute':
      case '$id':
        group = prefix + operation[0];
        index = operation[2] || operation[1];
    }
    if (!group) {
      return;
    }
    return ((_base = (this[group] || (this[group] = {})))[index] || (_base[index] = [])).push(operation);
  };

  Selector.prototype.separator = ',';

  Selector.prototype.scoped = void 0;

  Selector.prototype.key = void 0;

  Selector.prototype.path = void 0;

  Selector.prototype.tail = void 0;

  Selector.prototype.head = void 0;

  Selector.prototype.singular = void 0;

  Selector.prototype.hidden = void 0;

  Selector.prototype.relative = void 0;

  return Selector;

})(Query);

Query.Combinator = (function(_super) {
  __extends(Combinator, _super);

  function Combinator() {
    _ref1 = _class.apply(this, arguments);
    return _ref1;
  }

  _class = Query.construct();

  Combinator.prototype.signature = [
    [
      {
        context: ['Node']
      }
    ]
  ];

  return Combinator;

})(Selector);

Query.Qualifier = (function(_super) {
  __extends(Qualifier, _super);

  function Qualifier() {
    _ref2 = _class1.apply(this, arguments);
    return _ref2;
  }

  _class1 = Query.construct();

  Qualifier.prototype.signature = [
    {
      context: ['Node'],
      qualifier: ['String']
    }, [
      {
        filter: ['String'],
        query: ['String']
      }
    ]
  ];

  return Qualifier;

})(Selector);

Query.Element = (function(_super) {
  __extends(Element, _super);

  function Element() {
    _ref3 = _class2.apply(this, arguments);
    return _ref3;
  }

  _class2 = Query.construct();

  Element.prototype.signature = [];

  return Element;

})(Selector);

Command.define.call(Query, {
  'class': {
    prefix: '.',
    group: 'native',
    Combinator: function(value, engine, operation, continuation, scope) {
      return (scope || this.scope).getElementsByClassName(value);
    },
    Qualifier: function(node, value) {
      if (node.classList.contains(value)) {
        return node;
      }
    }
  },
  'tag': {
    prefix: '',
    group: 'native',
    Combinator: function(value, engine, operation, continuation, scope) {
      return (scope || this.scope).getElementsByTagName(value);
    },
    Qualifier: function(node, value) {
      if (value === '*' || node.tagName === value.toUpperCase()) {
        return node;
      }
    }
  },
  'id': {
    prefix: '#',
    group: 'native',
    Combinator: function(id, engine, operation, continuation, scope) {
      if (scope == null) {
        scope = this.scope;
      }
      return (typeof scope.getElementById === "function" ? scope.getElementById(id) : void 0) || node.querySelector('[id="' + id + '"]');
    },
    Qualifier: function(node, value) {
      if (node.id === value) {
        return node;
      }
    }
  },
  ' ': {
    group: 'native',
    Combinator: function(node) {
      return node.getElementsByTagName("*");
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
    group: 'native',
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
    group: 'native',
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
    group: 'native',
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

Command.define.call(Query, {
  '::this': {
    hidden: true,
    mark: 'ASCEND',
    Element: function(engine, operation, continuation, scope) {
      return scope;
    }
  },
  '::parent': {
    Element: Query['!>'].Combinator
  },
  '::scope': {
    hidden: true,
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

Command.define.call(Query, {
  '[=]': {
    binary: true,
    quote: true,
    group: 'native',
    prefix: '[',
    suffix: ']',
    Qualifier: function(node, attribute, value) {
      if (node.getAttribute(attribute) === value) {
        return node;
      }
    }
  },
  '[*=]': {
    binary: true,
    quote: true,
    prefix: '[',
    suffix: ']',
    group: 'native',
    Qualifier: function(node, attribute, value) {
      var _ref4;
      if (((_ref4 = node.getAttribute(attribute)) != null ? _ref4.indexOf(value) : void 0) > -1) {
        return node;
      }
    }
  },
  '[|=]': {
    binary: true,
    quote: true,
    group: 'native',
    prefix: '[',
    suffix: ']',
    Qualifier: function(node, attribute, value) {
      if (node.getAttribute(attribute) != null) {
        return node;
      }
    }
  },
  '[]': {
    group: 'native',
    prefix: '[',
    suffix: ']',
    Qualifier: function(node, attribute) {
      if (node.getAttribute(attribute) != null) {
        return node;
      }
    }
  }
});

Command.define.call(Query, {
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
    group: 'native',
    Combinator: function(node) {
      if (!node.previousElementSibling) {
        return node;
      }
    }
  },
  ':last-child': {
    group: 'native',
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
    Combinator: function(node, engine, operation, continuation, scope) {
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
    Qualifier: function(node, engine, operation, continuation, scope) {
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
    group: 'native',
    eager: true,
    signature: null,
    Default: function(engine, operation, continuation, scope) {
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
    capture: function(result, engine, operation, continuation, scope, ascender) {
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
    Query['class'].Qualifier = function(node, value) {
      if (node.className.split(/\s+/).indexOf(value) > -1) {
        return node;
      }
    };
  }
  if (!dummy.hasOwnProperty("parentElement")) {
    Query['!>'].Combinator = Selector['::parent'][1] = function(node) {
      var parent;
      if (parent = node.parentNode) {
        if (parent.nodeType === 1) {
          return parent;
        }
      }
    };
  }
  if (!dummy.hasOwnProperty("nextElementSibling")) {
    Query['+'].Combinator = function(node) {
      while (node = node.nextSibling) {
        if (node.nodeType === 1) {
          return node;
        }
      }
    };
    Query['!+'].Combinator = function(node) {
      while (node = node.previousSibling) {
        if (node.nodeType === 1) {
          return node;
        }
      }
    };
    Query['++'].Combinator = function(node) {
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
    Query['~'].Combinator = function(node) {
      var nodes;
      nodes = void 0;
      while (node = node.nextSibling) {
        if (node.nodeType === 1) {
          (nodes || (nodes = [])).push(node);
        }
      }
      return nodes;
    };
    Query['!~'].Combinator = function(node) {
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
    Query['~~'].Combinator = function(node) {
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
    Query[':first-child'].Qualifier = function(node) {
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
    Query[':last-child'].Qualifier = function(node) {
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
