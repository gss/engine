var Variable;

Variable = (function() {
  function Variable(engine) {
    var args;
    if (!engine) {
      args = Array.prototype.slice.call(arguments);
      args.unshift('get');
      return args;
    } else if (this.engine) {
      return new Variable(engine);
    }
    this.engine = engine;
  }

  Variable.prototype.getDomain = function(operation, force, quick) {
    var cmd, constraint, d, domain, index, intrinsic, path, prefix, property, scope, variable, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
    if (operation.domain && !force) {
      return operation.domain;
    }
    _ref = variable = operation, cmd = _ref[0], scope = _ref[1], property = _ref[2];
    path = this.getPath(scope, property);
    intrinsic = this.engine.intrinsic;
    if ((scope || path.indexOf('[') > -1) && property && ((intrinsic != null ? intrinsic.properties[path] : void 0) != null)) {
      domain = intrinsic;
    } else if (scope && property && (intrinsic != null ? intrinsic.properties[property] : void 0) && !intrinsic.properties[property].matcher) {
      domain = intrinsic;
    } else {
      _ref1 = this.engine.domains;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        d = _ref1[_i];
        if (d.values.hasOwnProperty(path) && (d.priority >= 0 || d.variables[path])) {
          domain = d;
          break;
        }
        if (d.substituted) {
          _ref2 = d.substituted;
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            constraint = _ref2[_j];
            if ((_ref3 = constraint.substitutions) != null ? _ref3[path] : void 0) {
              domain = d;
              break;
            }
          }
        }
      }
    }
    if (!domain) {
      if (property && (index = property.indexOf('-')) > -1) {
        prefix = property.substring(0, index);
        if ((domain = this.engine[prefix])) {
          if (!(domain instanceof this.engine.Domain)) {
            domain = void 0;
          }
        }
      }
      if (!domain) {
        if (!quick) {
          domain = this.engine.linear.maybe();
        }
      }
    }
    if (variable && !force) {
      variable.domain = domain;
    }
    return domain;
  };

  Variable.prototype.getPath = function(id, property) {
    if (!property) {
      property = id;
      id = void 0;
    }
    if (property.indexOf('[') > -1 || !id) {
      return property;
    } else {
      if (typeof id !== 'string') {
        if (id.nodeType) {
          id = this.engine.identity.provide(id);
        } else {
          id = id.path;
        }
      }
      return id + '[' + property + ']';
    }
  };

  return Variable;

})();

module.exports = Variable;
