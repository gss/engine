var Selectors, command, dummy, property, _ref,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

dummy = document.createElement('_');

Selectors = (function() {
  function Selectors() {}

  Selectors.prototype.onDOMQuery = function(node, args, result, operation, continuation, scope) {
    if (operation.def.hidden) {
      return result;
    }
    return this.engine.queries.filter(node, args, result, operation, continuation, scope);
  };

  Selectors.prototype.remove = function(id, continuation) {
    var path;
    if (typeof id === 'object') {
      id = this.engine.references.recognize(id);
    }
    this.engine.queries.remove(id, continuation);
    if (this.engine.References.prototype[id]) {
      path = continuation + id;
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
      shortcut = [name, operation.promise];
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
          group = operation[0];
          index = operation[2] || operation[1];
      }
      ((_base = ((_base1 = parent || operation)[group] || (_base1[group] = {})))[index] || (_base[index] = [])).push(operation);
      return index = group = null;
    },
    attempt: function(operation) {
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
    type: 'combinator',
    lookup: true
  };

  Selectors.prototype['$reserved'] = {
    type: 'combinator',
    prefix: '::',
    lookup: true
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
    1: __indexOf.call(dummy, "children") >= 0 ? function(node) {
      return node.children;
    } : function(node) {
      var child, _i, _len, _ref, _results;
      _ref = node.childNodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        if (child.nodeType === 1) {
          _results.push(child);
        }
      }
      return _results;
    }
  };

  Selectors.prototype['!>'] = {
    1: dummy.hasOwnProperty("parentElement") ? function(node) {
      return node.parentElement;
    } : function(node) {
      var parent;
      if (parent = node.parentNode) {
        if (parent.nodeType === 1) {
          return parent;
        }
      }
    }
  };

  Selectors.prototype['+'] = {
    group: '$query',
    1: dummy.hasOwnProperty("nextElementSibling") ? function(node) {
      return node.nextElementSibling;
    } : function(node) {
      while (node = node.nextSibling) {
        if (node.nodeType === 1) {
          return node;
        }
      }
    }
  };

  Selectors.prototype['!+'] = {
    1: dummy.hasOwnProperty("previousElementSibling") ? function(node) {
      return node.previousElementSibling;
    } : function(node) {
      while (node = node.previousSibling) {
        if (node.nodeType === 1) {
          return node;
        }
      }
    }
  };

  Selectors.prototype['++'] = {
    1: function(node) {
      var nodes;
      nodes = void 0;
      while (node = node.previousSibling) {
        if (node.nodeType === 1) {
          (nodes || (nodes = [])).push(node);
          break;
        }
      }
      while (node = node.nextSibling) {
        if (node.nodeType === 1) {
          (nodes || (nodes = [])).push(node);
          break;
        }
      }
      return nodes;
    }
  };

  Selectors.prototype['~'] = {
    group: '$query',
    1: function(node) {
      var nodes;
      nodes = void 0;
      while (node = node.nextSibling) {
        if (node.nodeType === 1) {
          (nodes || (nodes = [])).push(node);
        }
      }
      return nodes;
    }
  };

  Selectors.prototype['!~'] = {
    1: function(node) {
      var nodes;
      nodes = void 0;
      while (node = node.previousSibling) {
        if (node.nodeType === 1) {
          (nodes || (nodes = [])).push(node);
        }
      }
      return nodes;
    }
  };

  Selectors.prototype['~~'] = {
    1: function(node) {
      var nodes;
      nodes = void 0;
      while (node = node.previousSibling) {
        if (node.nodeType === 1) {
          (nodes || (nodes = [])).push(node);
        }
      }
      while (node = node.nextSibling) {
        if (node.nodeType === 1) {
          (nodes || (nodes = [])).push(node);
        }
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

  Selectors.prototype['::this'] = {
    prefix: '',
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

module.exports = Selectors;
