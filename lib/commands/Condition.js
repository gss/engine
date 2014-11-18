var Command, Condition, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Command = require('../concepts/Command');

Condition = (function(_super) {
  __extends(Condition, _super);

  function Condition() {
    _ref = Condition.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Condition.prototype.type = 'Condition';

  Condition.prototype.signature = [
    {
      "if": ['Query', 'Selector', 'Value', 'Constraint', 'Default'],
      then: ['Any']
    }, [
      {
        "else": ['Any']
      }
    ]
  ];

  Condition.prototype.cleaning = true;

  Condition.prototype.domain = 'solved';

  Condition.prototype.update = function(engine, operation, continuation, scope, ascender, ascending) {
    var branch, index, old, path, result, watchers, _base, _base1, _name;
    watchers = (_base = engine.queries.watchers)[_name = scope._gss_id] || (_base[_name] = []);
    if (!watchers.length || engine.indexOfTriplet(watchers, operation.parent, continuation, scope) === -1) {
      watchers.push(operation.parent, continuation, scope);
    }
    (_base1 = operation.parent).uid || (_base1.uid = '@' + (engine.queries.uid = (engine.queries.uid || 0) + 1));
    path = continuation + operation.parent.uid;
    old = engine.queries[path];
    if (!!old !== !!ascending || (old === void 0 && old !== ascending)) {
      if (old !== void 0) {
        engine.solved.remove(path);
        engine.queries.clean(path, continuation, operation.parent, scope);
      }
      engine.queries[path] = ascending;
      index = ascending ^ this.inverted && 2 || 3;
      engine.console.group('%s \t\t\t\t%o\t\t\t%c%s', (index === 2 && 'if' || 'else') + engine.Continuation.DESCEND, operation.parent[index], 'font-weight: normal; color: #999', continuation);
      if (branch = operation.parent[index]) {
        result = engine.Command(branch).solve(engine, branch, engine.Continuation(path, null, engine.Continuation.DESCEND), scope);
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
        continuation = engine.Continuation(continuation, null, engine.Continuation.DESCEND);
      }
      if (continuation != null) {
        this.update(engine.document || engine.abstract, operation.parent[1], continuation, scope, void 0, result);
      }
      return true;
    }
  };

  return Condition;

})(Command);

Condition.define('if', {});

Condition.define('unless', {
  inverted: true
});

module.exports = Condition;
