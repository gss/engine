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
    var branch, collections, condition, d, id, index, old, path, result, switching, watchers, _base, _base1, _base2, _ref1, _ref2;
    (_base = operation.parent).uid || (_base.uid = '@' + (engine.queries.uid = ((_base1 = engine.queries).uid || (_base1.uid = 0)) + 1));
    path = continuation + operation.parent.uid;
    id = scope._gss_id;
    watchers = (_base2 = engine.queries.watchers)[id] || (_base2[id] = []);
    if (!watchers.length || engine.indexOfTriplet(watchers, operation.parent, continuation, scope) === -1) {
      watchers.push(operation.parent, continuation, scope);
    }
    condition = ascending && (typeof ascending !== 'object' || ascending.length !== 0);
    if (this.inverted) {
      condition = !condition;
    }
    index = condition && 2 || 3;
    old = engine.queries[path];
    if (!!old !== !!condition || (old === void 0 && old !== condition)) {
      d = engine.pairs.dirty;
      if (old !== void 0) {
        engine.queries.clean(engine.Continuation(path), continuation, operation.parent, scope);
      }
      if (!engine.switching) {
        switching = engine.switching = true;
      }
      engine.queries[path] = condition;
      if (switching) {
        if (!d && (d = engine.pairs.dirty)) {
          engine.pairs.onBeforeSolve();
        }
        if (engine.updating) {
          collections = engine.updating.collections;
          engine.updating.collections = {};
          engine.updating.previous = collections;
        }
      }
      engine.engine.console.group('%s \t\t\t\t%o\t\t\t%c%s', (condition && 'if' || 'else') + engine.Continuation.DESCEND, operation.parent[index], 'font-weight: normal; color: #999', continuation);
      if (branch = operation.parent[index]) {
        debugger;
        result = engine.Command(branch).solve(engine, branch, engine.Continuation(path, null, engine.Continuation.DESCEND), scope);
      }
      if (switching) {
        if ((_ref1 = engine.pairs) != null) {
          _ref1.onBeforeSolve();
        }
        if ((_ref2 = engine.queries) != null) {
          _ref2.onBeforeSolve();
        }
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
