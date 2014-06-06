/*

Root commands, if bound to a dom query, will spawn commands
to match live results of query.
*/

var Commander, Processor,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Processor = require('./Processor.js');

Commander = (function(_super) {
  __extends(Commander, _super);

  function Commander(engine) {
    this.engine = engine;
    Commander.__super__.constructor.call(this);
  }

  Commander.prototype.execute = function(ast) {
    var command, _i, _len, _ref, _results;
    if (ast.commands != null) {
      _ref = ast.commands;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        command = _ref[_i];
        if (ast.isRule) {
          command.parentRule = ast;
        }
        _results.push(this.evaluate(command, 0, ast));
      }
      return _results;
    }
  };

  Commander.prototype["return"] = function(command) {
    this.engine.registerCommand(command);
    return console.error('COMMAND', command);
  };

  Commander.prototype.handleRemoves = function(removes) {};

  Commander.prototype.handleSelectorsWithAdds = function(selectors) {};

  Commander.prototype.handleInvalidMeasures = function(ids) {};

  Commander.prototype['get'] = true;

  Commander.prototype['get$'] = {
    prefix: '[',
    suffix: ']',
    method: '_get$'
  };

  Commander.prototype['_get$'] = function(path, property, command) {
    var id, val;
    if (command.nodeType) {
      id = GSS.setupId(command);
    } else if (command.absolute === 'window') {
      return ['get', "::window[" + prop + "]", path];
    }
    if (property.indexOf("intrinsic-") === 0) {
      if (this.register("$" + id + "[intrinsic]", context)) {
        val = this.engine.measureByGssId(id, property);
        engine.setNeedsMeasure(true);
        if (engine.vars[k] !== val) {
          return ['suggest', ['get', property, id, path], ['number', val], 'required'];
        }
      }
    }
    return ['get', property, '$' + id, path];
  };

  Commander.prototype["$rule"] = {
    prefix: "{",
    scope: true,
    evaluate: function(arg, i, evaluated) {
      if (i === 0) {
        return arg;
      }
      if (i === 1 || (evaluated[1] && i === 2)) {
        return this.evaluate(arg);
      }
    }
  };

  Commander.prototype["$if"] = {
    prefix: "@if",
    evaluate: function(arg, i, evaluated) {
      var _ref;
      if (i === 0) {
        return arg;
      }
      if (i === 1 || ((_ref = evaluated[1]) != null ? _ref : i === {
        2: i === 3
      })) {
        return this.evaluate(arg);
      }
    }
  };

  Commander.prototype['$query'] = {
    method: "querySelectorAll",
    match: function(value, node) {
      if (node.webkitMatchesSelector(value)) {
        return node;
      }
    },
    group: '$query'
  };

  Commander.prototype['$class'] = {
    prefix: '.',
    method: "getElementsByClassName",
    match: function(value, node) {
      if (node.classList.contains(value)) {
        return node;
      }
    },
    group: '$query'
  };

  Commander.prototype['$tag'] = {
    prefix: '',
    method: "getElementsByTagName",
    group: '$query',
    match: function(value, node) {
      if (node.tagName === value.toUpperCase()) {
        return node;
      }
    }
  };

  Commander.prototype['$id'] = {
    prefix: '#',
    method: "getElementById",
    group: '$query',
    match: function(value, node) {
      if (node.id === name) {
        return node;
      }
    }
  };

  Commander.prototype['$virtual'] = {
    prefix: '"',
    suffix: '"'
  };

  Commander.prototype['$nth'] = {
    prefix: ':nth(',
    suffix: ')',
    valueOf: function(divisor, comparison) {
      var i, node, nodes, _i, _len;
      nodes = [];
      for (node = _i = 0, _len = this.length; _i < _len; node = ++_i) {
        i = this[node];
        if (i % parseInt(divisor) === parseInt(comparison)) {
          nodes.push(nodes);
        }
      }
      return nodes;
    }
  };

  Commander.prototype['$pseudo'] = function(path, name) {
    return this[name] || this[':get'];
  };

  Commander.prototype['$combinator'] = function(path, name) {
    return this[name];
  };

  Commander.prototype['$reserved'] = function(path, name) {
    return this[name];
  };

  Commander.prototype['number'] = function(path, value) {
    return parseFloat(value);
  };

  Commander.prototype[' '] = {
    prefix: ' ',
    group: '$query',
    valueOf: function(node) {
      return node.getElementsByTagName("*");
    }
  };

  Commander.prototype['!'] = {
    prefix: '!',
    valueOf: function(node) {
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

  Commander.prototype['>'] = {
    prefix: '>',
    group: '$query',
    valueOf: function(node) {
      return node.children;
    }
  };

  Commander.prototype['!>'] = {
    prefix: '!>',
    valueOf: function(node) {
      return node.parentNode;
    }
  };

  Commander.prototype['+'] = {
    prefix: '+',
    valueOf: function(node) {
      return node.nextElementSibling;
    }
  };

  Commander.prototype['!+'] = {
    prefix: '!+',
    valueOf: function(node) {
      return node.previousElementSibling;
    }
  };

  Commander.prototype['~'] = {
    prefix: '~',
    group: '$query',
    valueOf: function(node) {
      var nodes;
      nodes = void 0;
      while (node = node.nextElementSibling) {
        (nodes || (nodes = [])).push(node);
      }
      return node;
    }
  };

  Commander.prototype['!~'] = {
    prefix: '~',
    group: '$query',
    valueOf: function(node) {
      var nodes;
      nodes = void 0;
      while (node = node.previousElementSibling) {
        (nodes || (nodes = [])).push(node);
      }
      return node;
    }
  };

  Commander.prototype[':value'] = {
    valueOf: function(node) {
      return node.value;
    },
    watch: "oninput"
  };

  Commander.prototype[':get'] = {
    valueOf: function(node, property) {
      console.log(property);
      return node[property];
    }
  };

  Commander.prototype['::this'] = {
    prefix: '',
    valueOf: function(node) {
      return node;
    }
  };

  Commander.prototype['::parent'] = {
    prefix: '::parent',
    valueOf: function(node) {
      return node;
    }
  };

  Commander.prototype['::scope'] = {
    prefix: "::scope",
    valueOf: function(node) {
      return this.engine.scope;
    }
  };

  Commander.prototype['::window'] = {
    prefix: 'window',
    absolute: "window"
  };

  Commander.prototype['::window[width]'] = function(context) {
    var w;
    if (this.register("::window[size]", context)) {
      w = window.innerWidth;
      if (GSS.config.verticalScroll) {
        w = w - GSS.get.scrollbarWidth();
      }
      if (this.set(context, w)) {
        return ['suggest', ['get', "::window[width]"], ['number', w], 'required'];
      }
    }
  };

  Commander.prototype['::window[height]'] = function(context) {
    var h;
    if (this.register("::window[size]", context)) {
      h = window.innerHeight;
      if (GSS.config.horizontalScroll) {
        h = h - GSS.get.scrollbarWidth();
      }
      if (this.set(context, h)) {
        return ['suggest', ['get', "::window[height]"], ['number', w], 'required'];
      }
    }
  };

  Commander.prototype['::window[center-x]'] = function(context) {
    if (this.register("::window[width]", context)) {
      return ['eq', ['get', '::window[center-x]'], ['divide', ['get', '::window[width]'], 2], 'required'];
    }
  };

  Commander.prototype['::window[right]'] = function(context) {
    if (this.register("::window[width]", context)) {
      return ['eq', ['get', '::window[right]'], ['get', '::window[width]'], 'required'];
    }
  };

  Commander.prototype['::window[center-y]'] = function(context) {
    if (this.register("::window[height]", context)) {
      return ['eq', ['get', '::window[center-y]'], ['divide', ['get', '::window[height]'], 2], 'required'];
    }
  };

  Commander.prototype['::window[bottom]'] = function(context) {
    if (this.register("::window[height]", context)) {
      return ['eq', ['get', '::window[bottom]'], ['get', '::window[height]'], 'required'];
    }
  };

  Commander.prototype['::window[size]'] = {
    watch: 'onresize',
    context: function() {
      return window;
    }
  };

  Commander.prototype['::window[x]'] = 0;

  Commander.prototype['::window[y]'] = 0;

  Commander.prototype['::scope[x]'] = 0;

  Commander.prototype['::scope[y]'] = 0;

  Commander.prototype['strength'] = true;

  Commander.prototype['suggest'] = true;

  Commander.prototype['eq'] = true;

  Commander.prototype['lte'] = true;

  Commander.prototype['gte'] = true;

  Commander.prototype['lt'] = true;

  Commander.prototype['gt'] = true;

  Commander.prototype['stay'] = true;

  Commander.prototype['number'] = true;

  Commander.prototype['plus'] = true;

  Commander.prototype['minus'] = true;

  Commander.prototype['multiply'] = true;

  Commander.prototype['divide'] = true;

  Commander.prototype["?>="] = true;

  Commander.prototype["?<="] = true;

  Commander.prototype["?=="] = true;

  Commander.prototype["?!="] = true;

  Commander.prototype["?>"] = true;

  Commander.prototype["?<"] = true;

  Commander.prototype["&&"] = true;

  Commander.prototype["||"] = true;

  return Commander;

})(Processor);

module.exports = Commander;
