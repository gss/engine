var Command, Parser, Source, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Parser = require('ccss-compiler');

Command = require('../concepts/Command');

Source = (function(_super) {
  __extends(Source, _super);

  function Source() {
    _ref = Source.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Source.prototype.type = 'Source';

  Source.prototype.signature = [
    {
      'source': ['Object', 'String']
    }, [
      {
        'type': ['String']
      }
    ]
  ];

  return Source;

})(Command);

Command.define.call(Source({
  "eval": {
    command: function(node, type, engine, operation, continuation, scope) {
      var nodeContinuation, nodeType, rules, source;
      if (type == null) {
        type = 'text/gss';
      }
      if (node.nodeType) {
        if (nodeType = node.getAttribute('type')) {
          type = nodeType;
        }
        source = node.textContent || node;
        if ((nodeContinuation = node._continuation) != null) {
          engine.queries.clean(nodeContinuation);
          continuation = nodeContinuation;
        } else if (!operation) {
          continuation = engine.Continuation(node.tagName.toLowerCase(), node);
        } else {
          continuation = node._continuation = engine.Continuation(continuation || '', null, engine.Continuation.DESCEND);
        }
        if (node.getAttribute('scoped') != null) {
          scope = node.parentNode;
        }
      }
      rules = engine.clone(this.types['_' + type](source));
      engine.console.row('rules', rules);
      engine.engine.engine.solve(rules, continuation, scope);
    }
  },
  "load": function(node, type, engine, operation, continuation, scope) {
    var src, xhr,
      _this = this;
    src = node.href || node.src || node;
    type || (type = node.type || 'text/gss');
    xhr = new XMLHttpRequest();
    engine.requesting = (engine.requesting || 0) + 1;
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        --engine.requesting;
        return engine.commands["eval"].call(_this, engine, operation, continuation, scope, node, type, xhr.responseText, src);
      }
    };
    xhr.open('GET', src);
    return xhr.send();
  },
  types: {
    "text/gss-ast": function(source) {
      return JSON.parse(source);
    },
    "text/gss": function(source) {
      var _ref1;
      return (_ref1 = Parser.parse(source)) != null ? _ref1.commands : void 0;
    }
  }
}));

module.exports = Source;
