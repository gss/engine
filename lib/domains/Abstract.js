var Abstract, Assignment, Command, Constraint, Domain, Value,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Domain = require('../concepts/Domain', Command = require('../concepts/Command'));

Value = require('../commands/Value');

Constraint = require('../commands/Constraint');

Assignment = require('../commands/Assignment');

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

Abstract.prototype.Default = Command.Default.extend({
  extras: 4,
  execute: function() {
    var continuation, engine, length, operation, parent, result, scope;
    length = arguments.length;
    engine = arguments[length - 4];
    operation = arguments[length - 3];
    continuation = arguments[length - 2];
    scope = arguments[length - 1];
    result = Array.prototype.slice.call(arguments, 0, -4);
    result.unshift(operation[0]);
    if (result.length === 1) {
      result = result[0];
    }
    if (parent = operation.parent) {
      if (parent.command instanceof Command.Default) {
        return result;
      }
      if (!(parent.command instanceof Command.List)) {
        throw "Incorrect command nesting - unknown command can only be on the top level";
      }
    }
    engine["yield"]([
      {
        key: continuation
      }, result
    ]);
  }
});

Abstract.prototype.List = Command.List.extend({
  capture: function() {},
  execute: function(result) {}
});

Abstract.prototype.Value = Value.extend();

Abstract.prototype.Value.Variable = Abstract.prototype.Value.extend({
  signature: [
    {
      property: ['String']
    }
  ]
}, {
  'get': function(property, engine, operation, continuation, scope) {
    return ['get', property];
  }
});

Abstract.prototype.Value.Getter = Abstract.prototype.Value.extend({
  signature: [
    {
      object: ['Query', 'Selector'],
      property: ['String']
    }
  ]
}, {
  'get': function(object, property, engine, operation, continuation, scope) {
    var prop;
    if (prop = engine.properties[property]) {
      if (!prop.matcher) {
        return prop.call(engine, object, continuation);
      }
    }
    return ['get', engine.getPath(object, property)];
  }
});

Abstract.prototype.Value.Expression = Value.Expression.extend({}, {
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

Abstract.prototype.Assignment = Assignment.extend({}, {
  '=': function(object, name, value) {
    return this.assumed.set(object, name, value);
  }
});

Abstract.prototype.Assignment.Unsafe = Assignment.Unsafe.extend({}, {
  'set': function(object, property, value, engine, operation, continuation, scope) {
    if (this.intrinsic) {
      this.intrinsic.restyle(object || scope, property, value, continuation, operation);
    } else {
      this.assumed.set(object || scope, property, value);
    }
  }
});

module.exports = Abstract;
