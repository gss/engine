var Abstract, Assignment, Command, Constraint, Domain, Value,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Domain = require('../concepts/Domain', Command = require('../concepts/Command'));

Value = require('../commands/Value');

Constraint = require('../commands/Constraint');

Assignment = require('../commands/Constraint');

Abstract = (function(_super) {
  __extends(Abstract, _super);

  Abstract.prototype.url = void 0;

  function Abstract() {
    if (this.running) {
      this.compile();
    }
    Abstract.__super__.constructor.apply(this, arguments);
  }

  return Abstract;

})(Domain);

Abstract.Value = Command.extend.call(Value);

Abstract.Value.Variable = Command.extend.call(Abstract.Value, {
  signature: [
    {
      property: ['String']
    }, [
      {
        tracker: ['String']
      }
    ]
  ]
}, {
  'get': function(property, tracker, engine, operation, continuation, scope) {
    return ['get', property, continuation, engine.identity.provide(scope)];
  }
});

Abstract.Value.Getter = Command.extend.call(Abstract.Value, {
  signature: [
    {
      object: ['Query'],
      property: ['String']
    }, [
      {
        tracker: ['String']
      }
    ]
  ]
}, {
  'get': function(object, property, tracker, engine, operation, continuation, scope) {
    var prop;
    if (object.nodeType) {
      object = engine.identity.provide(object);
    }
    continuation = engine.Continuation(continuation || tracker || '');
    if (prop = engine.properties[property]) {
      if (!prop.matcher) {
        return prop.call(engine, object, continuation);
      }
    }
    return ['get', engine.getPath(id, property), continuation, engine.identity.provide(scope)];
  }
});

Abstract.Value.Expression = Command.extend.call(Value.Expression, {}, {
  '+': function(left, right) {
    return ['+', left, right];
  },
  '-': function(left, right) {
    return ['-', left, right];
  },
  '/': function(left, right) {
    return ['/', left, right];
  },
  '*': function(left, right) {
    return ['*', left, right];
  }
});

Abstract.Assignment = Command.extend.call(Assignment, {}, {
  '=': function(object, name, value) {
    return this.assumed.set(object, name, value);
  }
});

Abstract.Assignment.Unsafe = Command.extend.call(Assignment.Unsafe, {}, {
  'set': {
    index: ['rule', 'assignment'],
    command: function(object, property, value, engine, operation, continuation, scope) {
      if (this.intrinsic) {
        this.intrinsic.restyle(object || scope, property, value, continuation, operation);
      } else {
        this.assumed.set(object || scope, property, value);
      }
    }
  }
});

module.exports = Abstract;
