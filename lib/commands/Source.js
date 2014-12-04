var Command, Parser, Source, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Parser = require('ccss-compiler');

Command = require('../Command');

Source = (function(_super) {
  __extends(Source, _super);

  function Source() {
    _ref = Source.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Source.prototype.type = 'Source';

  Source.prototype.signature = [
    {
      'source': ['Selector', 'String', 'Node']
    }, [
      {
        'type': ['String'],
        'text': ['String']
      }
    ]
  ];

  Source.prototype.types = {
    "text/gss-ast": function(source) {
      return JSON.parse(source);
    },
    "text/gss": function(source) {
      var _ref1;
      return (_ref1 = Parser.parse(source)) != null ? _ref1.commands : void 0;
    }
  };

  return Source;

})(Command);

Source.define({
  "eval": function(node, type, text, engine, operation, continuation, scope) {
    var el, index, nodeContinuation, nodeType, rules, source, _i, _len, _ref1;
    if (type == null) {
      type = 'text/gss';
    }
    if (node.nodeType) {
      if (nodeType = node.getAttribute('type')) {
        type = nodeType;
      }
      source = text || node.textContent || node;
      if ((nodeContinuation = node._continuation) != null) {
        engine.queries.clean(this.delimit(nodeContinuation));
        continuation = nodeContinuation;
      } else {
        continuation = node._continuation = this.delimit(continuation, this.DESCEND);
      }
      if (node.getAttribute('scoped') != null) {
        scope = node.parentNode;
      }
    }
    rules = engine.clone(this.types[type](source));
    engine.console.row('rules', rules);
    engine.engine.solve(rules, continuation, scope);
    node.rules = rules;
    node.operation = operation;
    _ref1 = (engine.stylesheets || (engine.stylesheets = []));
    for (index = _i = 0, _len = _ref1.length; _i < _len; index = ++_i) {
      el = _ref1[index];
      if (!this.comparePosition(el, node, el.operation, operation)) {
        break;
      }
    }
    engine.stylesheets.splice(index, 0, node);
  },
  "load": function(node, type, method, engine, operation, continuation, scope) {
    var src, xhr,
      _this = this;
    src = node.href || node.src || node;
    type || (type = node.type || 'text/gss');
    xhr = new XMLHttpRequest();
    engine.requesting = (engine.requesting || 0) + 1;
    xhr.onreadystatechange = function() {
      var op;
      if (xhr.readyState === 4 && xhr.status === 200) {
        op = ['eval', node, type, xhr.responseText];
        engine.Command(op).solve(engine, op, continuation, scope);
        if (!--engine.requesting) {
          return engine.fireEvent('eval', engine.stylesheets);
        }
      }
    };
    xhr.open('GET', method && method.toUpperCase() || src);
    return xhr.send();
  }
});

module.exports = Source;
