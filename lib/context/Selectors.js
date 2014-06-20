var Selectors, command, dummy, property, _ref;

Selectors = (function() {
  function Selectors() {}

  Selectors.prototype.onDOMQuery = function(node, args, result, operation, continuation, scope) {
    console.log(node, args, operation, result);
    if (operation.def.hidden) {
      return result;
    }
    return this.engine.queries.filter(node, args, result, operation, continuation, scope);
  };

  Selectors.prototype.remove = function(id, continuation, collection) {
    var path;
    if (typeof id === 'object') {
      id = this.engine.references.recognize(id);
    }
    this.engine.queries.remove(id, continuation);
    if (this.engine.References.prototype[id]) {
      path = continuation;
      if (collection) {
        path += id;
      }
      this.engine.references.remove(continuation, path);
      this.engine.expressions.write(['remove', path], true);
    }
    return this;
  };

  Selectors.prototype['$query'] = {
    group: '$query',
    1: "querySelectorAll",
    2: function(node, value) {
      if (node.webkitMatchesSelector(value)) {
        return node;
      }
    },
    perform: function(object, operation) {
      var global, name, op, shortcut, tail;
      name = operation.def.group;
      shortcut = [name, operation.groupped];
      shortcut.parent = (operation.head || operation).parent;
      shortcut.index = (operation.head || operation).index;
      object.analyze(shortcut);
      tail = operation.tail;
      global = tail.arity === 1 && tail.length === 2;
      op = operation;
      while (op) {
        this.analyze(op, shortcut);
        if (op === tail) {
          break;
        }
        op = op[1];
      }
      if (tail.parent === operation) {
        if (!global) {
          shortcut.splice(1, 0, tail[1]);
        }
      }
      return shortcut;
    },
    analyze: function(operation, parent) {
      var group, index, _base, _base1;
      switch (operation[0]) {
        case '$tag':
          if (!parent || operation === operation.tail) {
            group = ' ';
            index = (operation[2] || operation[1]).toUpperCase();
          }
          break;
        case '$combinator':
          group = (parent && ' ' || '') + operation.name;
          index = operation.parent.name === "$tag" && operation.parent[2].toUpperCase() || "*";
          break;
        case '$class':
        case '$pseudo':
        case '$attribute':
        case '$id':
          group = operation[0];
          index = operation[2] || operation[1];
      }
      ((_base = ((_base1 = parent || operation)[group] || (_base1[group] = {})))[index] || (_base[index] = [])).push(operation);
      return index = group = null;
    },
    promise: function(operation, parent) {
      var promise;
      promise = operation.groupped;
      if (operation.tail) {
        if (operation[0] === '$combinator' && (parent[0] === '$combinator' || parent[0] === ',')) {
          promise += "*";
        }
      }
      return promise;
    },
    condition: function(operation) {
      if (operation.name === '$combinator') {
        if (operation[operation.skip] !== ' ') {
          return false;
        }
      } else if (operation.arity === 2) {
        return false;
      }
      return true;
    }
  };

  Selectors.prototype['$class'] = {
    prefix: '.',
    group: '$query',
    1: "getElementsByClassName",
    2: function(node, value) {
      if (node.classList.contains(value)) {
        return node;
      }
    }
  };

  Selectors.prototype['$tag'] = {
    prefix: '',
    group: '$query',
    1: "getElementsByTagName",
    2: function(node, value) {
      if (value === '*' || node.tagName === value.toUpperCase()) {
        return node;
      }
    }
  };

  Selectors.prototype['$id'] = {
    prefix: '#',
    group: '$query',
    1: "getElementById",
    2: function(node, value) {
      if (node.id === name) {
        return node;
      }
    }
  };

  Selectors.prototype['getElementById'] = function(node, id) {
    return this.engine.all[id || node];
  };

  Selectors.prototype['$virtual'] = {
    prefix: '"',
    suffix: '"'
  };

  Selectors.prototype['$nth'] = {
    prefix: ':nth(',
    suffix: ')',
    command: function(node, divisor, comparison) {
      var i, nodes, _i, _len;
      nodes = [];
      for (node = _i = 0, _len = node.length; _i < _len; node = ++_i) {
        i = node[node];
        if (i % parseInt(divisor) === parseInt(comparison)) {
          nodes.push(nodes);
        }
      }
      return nodes;
    }
  };

  Selectors.prototype['$attribute'] = {
    type: 'qualifier',
    prefix: '[',
    suffix: ']',
    lookup: true
  };

  Selectors.prototype['$pseudo'] = {
    type: 'qualifier',
    prefix: ':',
    lookup: true
  };

  Selectors.prototype['$combinator'] = {
    prefix: '',
    type: 'combinator',
    lookup: true
  };

  Selectors.prototype['$reserved'] = {
    type: 'combinator',
    prefix: '::',
    lookup: true
  };

  Selectors.prototype[','] = {
    eager: true,
    separator: true,
    group: '$query',
    prefix: ',',
    evaluate: function(operation, continuation, scope, ascender, ascending) {
      debugger;
      if (operation.index === 2 && !ascender) {
        this.evaluate(operation, continuation, ascending, void 0, void 0, operation.parent);
      } else {
        return this;
      }
    },
    command: function() {
      debugger;
    },
    receive: function(engine, context, result, operation, continuation) {
      return engine.queries.add(result, operation.path);
    }
  };

  Selectors.prototype[' '] = {
    group: '$query',
    1: function(node) {
      return node.getElementsByTagName("*");
    }
  };

  Selectors.prototype['!'] = {
    1: function(node) {
      var nodes;
      nodes = void 0;
      while (node = node.parentNode) {
        if (node.nodeType === 1) {
          (nodes || (nodes = [])).push(node);
        }
      }
      return nodes;
    }
  };

  Selectors.prototype['>'] = {
    group: '$query',
    1: function(node) {
      return node.children;
    }
  };

  Selectors.prototype['!>'] = {
    1: function(node) {
      return node.parentElement;
    }
  };

  Selectors.prototype['+'] = {
    group: '$query',
    1: function(node) {
      return node.nextElementSibling;
    }
  };

  Selectors.prototype['!+'] = {
    1: function(node) {
      return node.previousElementSibling;
    }
  };

  Selectors.prototype['++'] = {
    1: function(node) {
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
  };

  Selectors.prototype['~'] = {
    group: '$query',
    1: function(node) {
      var nodes;
      nodes = void 0;
      while (node = node.nextElementSibling) {
        (nodes || (nodes = [])).push(node);
      }
      return nodes;
    }
  };

  Selectors.prototype['!~'] = {
    1: function(node) {
      var nodes, prev;
      nodes = void 0;
      prev = node.parentNode.firstElementChild;
      while (prev !== node) {
        (nodes || (nodes = [])).push(prev);
        prev = prev.nextElementSibling;
      }
      return nodes;
    }
  };

  Selectors.prototype['~~'] = {
    1: function(node) {
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
  };

  Selectors.prototype[':value'] = {
    1: function(node) {
      return node.value;
    },
    watch: "oninput"
  };

  Selectors.prototype[':get'] = {
    2: function(node, property) {
      return node[property];
    }
  };

  Selectors.prototype[':first-child'] = {
    group: '$query',
    1: function(node) {
      if (!node.previousElementSibling) {
        return node;
      }
    }
  };

  Selectors.prototype[':last-child'] = {
    group: '$query',
    1: function(node) {
      if (!node.nextElementSibling) {
        return node;
      }
    }
  };

  Selectors.prototype['::this'] = {
    scoped: true,
    hidden: true,
    1: function(node) {
      return node;
    }
  };

  Selectors.prototype['::parent'] = {
    prefix: '::parent',
    scoped: true,
    1: function(node) {
      var parent;
      if (parent = node.parentNode) {
        if (parent.nodeType === 1) {
          return parent;
        }
      }
    }
  };

  Selectors.prototype['::scope'] = {
    prefix: "::scope",
    1: function(node) {
      return this.engine.scope;
    }
  };

  Selectors.prototype['::window'] = {
    prefix: 'window',
    absolute: "window"
  };

  return Selectors;

})();

_ref = Selectors.prototype;
for (property in _ref) {
  command = _ref[property];
  if (typeof command === 'object') {
    command.callback = 'onDOMQuery';
  }
}

dummy = document.createElement('_');

if (!dummy.hasOwnProperty("parentElement")) {
  Selectors.prototype['!>'][1] = function(node) {
    var parent;
    if (parent = node.parentNode) {
      if (parent.nodeType === 1) {
        return parent;
      }
    }
  };
}

if (!dummy.hasOwnProperty("nextElementSibling")) {
  Selectors.prototype['>'][1] = function(node) {
    var child, _i, _len, _ref1, _results;
    _ref1 = node.childNodes;
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      child = _ref1[_i];
      if (child.nodeType === 1) {
        _results.push(child);
      }
    }
    return _results;
  };
  Selectors.prototype['+'][1] = function(node) {
    while (node = node.nextSibling) {
      if (node.nodeType === 1) {
        return node;
      }
    }
  };
  Selectors.prototype['!+'][1] = function() {
    var node;
    while (node = node.previousSibling) {
      if (node.nodeType === 1) {
        return node;
      }
    }
  };
  Selectors.prototype['++'][1] = function(node) {
    var next, nodes, prev;
    nodes = void 0;
    while (prev = node.previousSibling) {
      if (prev.nodeType === 1) {
        (nodes || (nodes = [])).push(prev);
        break;
      }
    }
    while (next = node.nextSibling) {
      if (next.nodeType === 1) {
        (nodes || (nodes = [])).push(next);
        break;
      }
    }
    return nodes;
  };
  Selectors.prototype['~'][1] = function(node) {
    var nodes;
    nodes = void 0;
    while (node = node.nextSibling) {
      if (node.nodeType === 1) {
        (nodes || (nodes = [])).push(node);
      }
    }
    return nodes;
  };
  Selectors.prototype['!~'][1] = function(node) {
    var nodes, prev;
    nodes = void 0;
    prev = node.parentNode.firstChild;
    while (prev !== node) {
      if (pref.nodeType === 1) {
        (nodes || (nodes = [])).push(prev);
      }
      node = node.nextSibling;
    }
    return nodes;
  };
  Selectors.prototype['~~'][1] = function(node) {
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
  Selectors.prototype[':first-child'][1] = function(node) {
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
  Selectors.prototype[':last-child'][1] = function(node) {
    var child, parent;
    if (parent = node.parentNode) {
      child = parent.lastChild;
      while (child && child.nodeType !== 1) {
        child = child.previousSibling;
      }
      return child === node;
    }
  };
}

module.exports = Selectors;
