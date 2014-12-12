var Command, Condition,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('./Command');

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

  Condition.prototype.domain = 'solved';

  function Condition(operation, engine) {
    var command, parent, previous;
    this.key || (this.key = this.serialize(operation, engine));
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

  Condition.prototype.push = function() {};

  Condition.prototype.serialize = function(operation, engine) {
    return '@' + this.toExpression(operation[1]);
  };

  Condition.prototype.update = function(engine, operation, continuation, scope, ascender, ascending) {
    var branch, collections, index, old, path, result, switching, watchers, _name, _ref;
    if (watchers = (_ref = engine.queries) != null ? _ref.watchers : void 0) {
      watchers = watchers[_name = scope._gss_id] || (watchers[_name] = []);
      if (!watchers.length || engine.indexOfTriplet(watchers, operation.parent, continuation, scope) === -1) {
        watchers.push(operation.parent, continuation + this.DESCEND, scope);
      }
    }
    path = continuation + this.DESCEND + this.key;
    old = this.value;
    if (!!old !== !!ascending || (old === void 0 && old !== ascending)) {
      if (old !== void 0) {
        engine.Query.prototype.clean(engine, path, continuation, operation.parent, scope);
      }
      if (!engine.switching) {
        switching = engine.switching = true;
      }
      this.value = ascending;
      if (switching) {
        engine.triggerEvent('switch', operation, path);
        if (engine.updating) {
          collections = engine.updating.collections;
          engine.updating.collections = {};
          engine.updating.previous = collections;
        }
      }
      index = ascending ^ this.inverted && 2 || 3;
      engine.console.group('%s \t\t\t\t%o\t\t\t%c%s', (index === 2 && 'if' || 'else') + this.DESCEND, operation.parent[index], 'font-weight: normal; color: #999', continuation);
      if (branch = operation.parent[index]) {
        result = engine.Command(branch).solve(engine, branch, this.delimit(path, this.DESCEND), scope);
      }
      if (switching) {
        engine.triggerEvent('switch', operation, true);
        engine.switching = void 0;
      }
      return engine.console.groupEnd(path);
    }
  };

  Condition.prototype["yield"] = function(result, engine, operation, continuation, scope) {
    if (operation.parent.indexOf(operation) === -1) {
      if (operation[0].key) {
        continuation = operation[0].key;
        scope = engine.identity[operation[0].scope] || scope;
      } else {
        continuation = this.delimit(continuation, this.DESCEND);
      }
      if (continuation != null) {
        this.update(engine.document || engine.abstract, operation.parent[1], continuation, scope, void 0, result);
      }
      return true;
    }
  };

  return Condition;

})(Command);

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
  solve: function() {
    return true;
  }
});

Condition.define('elseif', {
  linked: true
});

Condition.define('elsif', {});

module.exports = Condition;
