var Abstract, Command, Constraint, Domain, Top, Variable, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

Domain = require('../Domain');

Command = require('../Command');

Variable = require('../Variable');

Constraint = require('../Constraint');

Abstract = (function(_super) {
  __extends(Abstract, _super);

  function Abstract() {
    _ref = Abstract.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Abstract.prototype.url = void 0;

  Abstract.prototype.helps = true;

  Abstract.prototype.Iterator = require('../Iterator');

  Abstract.prototype.Condition = require('../Condition');

  Abstract.prototype.Query = require('../Query');

  Abstract.prototype.Properties = require('../properties/Axioms');

  Abstract.prototype.events = {
    precommit: function() {
      this.Query.prototype.commit(this);
      return this.Query.prototype.repair(this);
    },
    "switch": function() {
      return this.Query.prototype.repair(this);
    }
  };

  return Abstract;

})(Domain);

Abstract.prototype.Remove = Command.extend({
  signature: false,
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
    if (domain = typeof this.domain === "function" ? this.domain(engine, operation) : void 0) {
      wrapper.parent = operation.parent;
      wrapper.domain || (wrapper.domain = domain);
    }
    engine.update(wrapper, void 0, void 0, domain);
  },
  produce: function(meta, args) {
    return [meta, args];
  },
  domain: function(engine, operation) {
    var domain, parent, _ref1;
    if (parent = operation.parent) {
      if (domain = (_ref1 = parent.command.domains) != null ? _ref1[parent.indexOf(operation)] : void 0) {
        return engine[domain];
      }
    }
  }
});

Abstract.prototype.Default.prototype.advices = [Top];

Abstract.prototype.List = Command.List;

Abstract.prototype.Variable = Variable.extend({
  signature: [
    {
      property: ['String']
    }
  ]
}, {
  'get': function(property, engine, operation, continuation, scope) {
    var object;
    if (engine.queries) {
      if (scope === engine.scope) {
        scope = void 0;
      }
      object = engine.Query.prototype.getScope(engine, scope, continuation);
    }
    return ['get', engine.getPath(object, property)];
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
    var prefix, prop;
    if (engine.queries) {
      prefix = engine.Query.prototype.getScope(engine, object, continuation);
    }
    if (prop = engine.properties[property]) {
      if (!prop.matcher) {
        if ((object || (object = scope)).nodeType === 9) {
          object = object.body;
        }
        return prop.call(engine, object, continuation);
      }
    }
    if (property.indexOf('intrinsic') > -1) {
      prefix || (prefix = engine.scope);
    }
    return ['get', engine.getPath(prefix, property)];
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

Abstract.prototype.Assignment = Command.extend({
  type: 'Assignment',
  signature: [
    [
      {
        object: ['Query', 'Selector']
      }
    ], {
      property: ['String'],
      value: ['Variable']
    }
  ]
}, {
  '=': function(object, name, value, engine) {
    return engine.assumed.set(object, name, value);
  }
});

Abstract.prototype.Assignment.Style = Abstract.prototype.Assignment.extend({
  signature: [
    [
      {
        object: ['Query', 'Selector']
      }
    ], {
      property: ['String'],
      value: ['Any']
    }
  ],
  advices: [
    function(engine, operation, command) {
      var parent, rule;
      parent = operation;
      rule = void 0;
      while (parent.parent) {
        if (!rule && parent[0] === 'rule') {
          rule = parent;
        }
        parent = parent.parent;
      }
      operation.index = parent.rules = (parent.rules || 0) + 1;
      if (rule) {
        (rule.properties || (rule.properties = [])).push(operation.index);
      }
    }
  ]
}, {
  'set': function(object, property, value, engine, operation, continuation, scope) {
    if (engine.intrinsic) {
      engine.intrinsic.restyle(object || scope, property, value, continuation, operation);
    } else {
      engine.assumed.set(object || scope, property, value);
    }
  }
});

module.exports = Abstract;
