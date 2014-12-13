var Condition, Query,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Query = require('./Query');

Condition = (function(_super) {
  __extends(Condition, _super);

  Condition.prototype.type = 'Condition';

  Condition.prototype.signature = [
    {
      "if": ['Query', 'Selector', 'Variable', 'Constraint', 'Default'],
      then: ['Any']
    }, [
      {
        "else": ['Any']
      }
    ]
  ];

  Condition.prototype.cleaning = true;

  Condition.prototype.conditional = 1;

  Condition.prototype.boundaries = true;

  Condition.prototype.domains = {
    1: 'solved'
  };

  function Condition(operation, engine) {
    var command, parent, previous;
    this.path = this.key = this.serialize(operation, engine);
    if (this.linked) {
      if (parent = operation.parent) {
        previous = parent[parent.indexOf(operation) - 1];
        if (command = previous.command) {
          if (command.type === 'Condition') {
            command.next = operation;
            this.previous = command;
          }
        }
      }
    }
  }

  Condition.prototype.descend = function(engine, operation, continuation, scope) {
    var branch, path;
    if (this.conditional) {
      path = continuation + this.DESCEND + this.key;
      debugger;
      if (!engine.queries.hasOwnProperty(path)) {
        engine.queries[path] = void 0;
        branch = operation[this.conditional];
        branch.command.solve(engine, branch, path, scope);
      }
      this.after([], engine.queries[path], engine, operation, continuation + this.DESCEND, scope);
    }
    return false;
  };

  Condition.prototype.execute = function(value) {
    return value;
  };

  Condition.prototype.serialize = function(operation, engine) {
    return '@' + this.toExpression(operation[1]);
  };

  Condition.prototype.ascend = function(engine, operation, continuation, scope, result) {
    var branch, collections, index, old, switching;
    old = engine.updating.collections[continuation];
    if (!!old !== !!result || (old === void 0 && old !== result)) {
      if (old !== void 0) {
        this.clean(engine, continuation, continuation, operation, scope);
      }
      if (!engine.switching) {
        switching = engine.switching = true;
      }
      if (switching) {
        engine.triggerEvent('switch', operation, continuation);
        if (engine.updating) {
          collections = engine.updating.collections;
          engine.updating.collections = {};
          engine.updating.previous = collections;
        }
      }
      index = this.conditional + ((result ^ this.inverted) && 1 || 2);
      engine.console.group('%s \t\t\t\t%o\t\t\t%c%s', (index === 2 && 'if' || 'else') + this.DESCEND, operation[index], 'font-weight: normal; color: #999', continuation);
      if (branch = operation[index]) {
        result = engine.Command(branch).solve(engine, branch, this.delimit(continuation, this.DESCEND), scope);
      }
      if (switching) {
        engine.triggerEvent('switch', operation, true);
        engine.switching = void 0;
      }
      return engine.console.groupEnd(continuation);
    }
  };

  Condition.prototype["yield"] = function(result, engine, operation, continuation, scope) {
    var scoped;
    if (operation.parent.indexOf(operation) === -1) {
      if (operation[0].key != null) {
        continuation = operation[0].key;
        if (scoped = operation[0].scope) {
          scope = engine.identity[scoped];
        }
      } else {
        continuation = this.delimit(continuation, this.DESCEND);
      }
      this.set(engine, continuation, result);
      this.notify(engine, continuation, scope, result);
      return true;
    }
  };

  return Condition;

})(Query);

Condition.Global = Condition.extend({
  condition: function(engine, operation, command) {
    var argument, _i, _len;
    if (command) {
      operation = operation[1];
    }
    if (operation[0] === 'get') {
      if (operation.length === 2 || operation[1][0] === '&') {
        return false;
      }
    }
    for (_i = 0, _len = operation.length; _i < _len; _i++) {
      argument = operation[_i];
      if (argument && argument.push && this.condition(engine, argument) === false) {
        return false;
      }
    }
    return true;
  },
  global: true
});

Condition.prototype.advices = [Condition.Global];

Condition.define('if', {});

Condition.define('unless', {
  inverted: true
});

Condition.define('else', {
  signature: [
    {
      then: ['Any']
    }
  ],
  linked: true,
  conditional: null,
  domains: null
});

Condition.define('elseif', {
  linked: true
});

Condition.define('elsif', {});

module.exports = Condition;
