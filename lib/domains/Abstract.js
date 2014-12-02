var Abstract, Assignment, Call, Clause, Command, Condition, Constraint, Domain, Iterator, Top, Variable,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

Domain = require('../Domain');

Command = require('../Command');

Variable = require('../commands/Variable');

Constraint = require('../commands/Constraint');

Assignment = require('../commands/Assignment');

Condition = require('../commands/Condition');

Iterator = require('../commands/Iterator');

Call = require('../commands/Call');

Abstract = (function(_super) {
  __extends(Abstract, _super);

  Abstract.prototype.url = void 0;

  Abstract.prototype.helps = true;

  Abstract.prototype.Properties = require('../properties/Axioms');

  function Abstract() {
    if (this.running) {
      this.compile();
    }
    Abstract.__super__.constructor.apply(this, arguments);
  }

  Abstract.condition = function() {
    return !this.scope;
  };

  return Abstract;

})(Domain);

Abstract.prototype.Remove = Call.Unsafe.extend({
  extras: 1
}, {
  remove: function() {
    var args, engine, path, _i, _j, _len;
    args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), engine = arguments[_i++];
    for (_j = 0, _len = args.length; _j < _len; _j++) {
      path = args[_j];
      engine.triggerEvent('remove', path);
    }
    return true;
  }
});

Abstract.prototype.Default = Command.Default.extend({
  extras: 2,
  execute: function() {
    var args, engine, operation, _i;
    args = 3 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 2) : (_i = 0, []), engine = arguments[_i++], operation = arguments[_i++];
    args.unshift(operation[0]);
    return args;
  }
});

Top = Abstract.prototype.Default.extend({
  condition: function(engine, operation) {
    var parent;
    if (parent = operation.parent) {
      if (parent.command instanceof Abstract.prototype.Default) {
        return false;
      }
    }
    return true;
  },
  extras: 4,
  execute: function() {
    var args, continuation, domain, engine, meta, operation, scope, wrapper, _i;
    args = 5 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 4) : (_i = 0, []), engine = arguments[_i++], operation = arguments[_i++], continuation = arguments[_i++], scope = arguments[_i++];
    meta = {
      key: this.delimit(continuation)
    };
    if (scope !== engine.scope) {
      meta.scope = engine.identify(scope);
    }
    args.unshift(operation[0]);
    wrapper = this.produce(meta, args, operation);
    args.parent = wrapper;
    if (this.inheriting) {
      wrapper.parent = operation.parent;
    }
    if (domain = typeof this.domain === "function" ? this.domain(engine) : void 0) {
      wrapper.domain || (wrapper.domain = domain);
    }
    engine.update(wrapper, void 0, void 0, domain);
  },
  produce: function(meta, args) {
    return [meta, args];
  }
});

Clause = Top.extend({
  condition: function(engine, operation) {
    var parent;
    if (parent = operation.parent) {
      if (parent[1] === operation) {
        return parent.command instanceof Abstract.prototype.Condition;
      }
    }
  },
  domain: function(engine) {
    return engine.solved;
  },
  inheriting: true
});

Abstract.prototype.Default.prototype.advices = [Clause, Top];

Abstract.prototype.Iterator = Iterator;

Abstract.prototype.Condition = Condition;

Abstract.prototype.List = Command.List;

Abstract.prototype.Variable = Variable.extend({
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

Abstract.prototype.Variable.Getter = Abstract.prototype.Variable.extend({
  signature: [
    {
      object: ['Query', 'Selector', 'String'],
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

Abstract.prototype.Variable.Expression = Variable.Expression.extend({}, {
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
  '=': function(object, name, value, engine) {
    return engine.assumed.set(object, name, value);
  }
});

Abstract.prototype.Assignment.Unsafe = Assignment.Unsafe.extend({}, {
  'set': function(object, property, value, engine, operation, continuation, scope) {
    if (engine.intrinsic) {
      engine.intrinsic.restyle(object || scope, property, value, continuation, operation);
    } else {
      engine.assumed.set(object || scope, property, value);
    }
  }
});

module.exports = Abstract;
