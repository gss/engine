var Matcher, Shorthand, Style;

Style = function(definition, name, styles, keywords, types, keys, properties, required, optional, depth) {
  var Types, callback, def, index, initial, item, key, matcher, max, p, pad, previous, prop, property, requirement, storage, style, substyle, type, value, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3;
  if (keywords == null) {
    keywords = {};
  }
  if (types == null) {
    types = [];
  }
  if (keys == null) {
    keys = [];
  }
  if (properties == null) {
    properties = [];
  }
  if (required == null) {
    required = {};
  }
  if (depth == null) {
    depth = 0;
  }
  requirement = true;
  pad = initial = previous = void 0;
  max = depth;
  if (definition.length === void 0) {
    for (key in definition) {
      def = definition[key];
      if (typeof def !== 'object') {
        continue;
      }
      property = key.indexOf('-') > -1 && styles[key] && key || name + '-' + key;
      style = this.Style(def, property, styles, null, null, null, null, null, null, null, depth);
      if (optional !== true) {
        required[property] = optional || requirement;
        requirement = property;
      }
      if (style.types) {
        _ref = style.types;
        for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
          type = _ref[index];
          types.push(type);
          prop = ((_ref1 = style.keys) != null ? _ref1[index] : void 0) || property;
          keys.push(prop);
          if (properties.indexOf(prop) === -1) {
            properties.push(prop);
          }
        }
      }
      if (style.keywords) {
        _ref2 = style.keywords;
        for (prop in _ref2) {
          value = _ref2[prop];
          for (_j = 0, _len1 = value.length; _j < _len1; _j++) {
            item = value[_j];
            _ref3 = item.push && item || [item];
            for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
              p = _ref3[_k];
              if (properties.indexOf(p) === -1) {
                properties.push(p);
              }
            }
          }
          (keywords[prop] || (keywords[prop] = [])).push(value);
        }
      }
    }
  } else {
    for (index = _l = 0, _len3 = definition.length; _l < _len3; index = ++_l) {
      property = definition[index];
      switch (typeof property) {
        case "object":
          substyle = this.Style(property, name, styles, keywords, types, keys, properties, required, (property.push && (requirement || true)) || optional, depth + 1);
          pad = property.pad || substyle.pad;
          max = Math.max(substyle.depth, max);
          break;
        case "string":
          Types = this.Type;
          if (type = Types[property]) {
            types.push(type);
            if (initial === void 0) {
              if (type.displayName === void 0) {
                for (key in Types) {
                  value = Types[key];
                  if (value === type) {
                    type.displayName = key;
                    break;
                  }
                }
              }
              if (storage = Types[type.displayName + 's']) {
                for (key in storage) {
                  if (type.call(this, key)) {
                    initial = key;
                  }
                  break;
                }
              }
              if (initial == null) {
                initial = 0;
              }
            }
          } else {
            if (initial == null) {
              initial = property;
            }
            (keywords[property] || (keywords[property] = [])).push(name);
          }
          break;
        default:
          if (initial == null) {
            initial = property;
          }
      }
    }
  }
  if (typeof initial === 'function') {
    callback = initial;
    initial = void 0;
  }
  if (initial === void 0) {
    initial = new Shorthand;
    initial.displayName = initial.prototype.property = name;
    for (_m = 0, _len4 = properties.length; _m < _len4; _m++) {
      property = properties[_m];
      initial.prototype[property] = styles[property].initial;
    }
  } else if (keys.length === 0) {
    keys = void 0;
  }
  matcher = new Matcher(name, keywords, types, keys, required, pad, max, initial, callback);
  if (initial != null ? initial.displayName : void 0) {
    initial.prototype.style = matcher;
    initial.prototype.styles = styles;
    initial.prototype.properties = properties;
  }
  matcher.format = function(value) {
    return Shorthand.prototype.toExpressionString(name, value, false, styles);
  };
  return styles[name] = matcher;
};

Shorthand = (function() {
  function Shorthand(callback) {
    callback || (callback = function(options) {
      var key, value;
      if (options) {
        for (key in options) {
          value = options[key];
          this[key] = value;
        }
      }
      return this;
    });
    callback.prototype = this;
    return callback;
  }

  Shorthand.prototype.format = function(styles, number) {
    var expression, i, index, k, key, keys, pad, prefix, previous, string, style, types, value, _i, _j, _len, _ref, _ref1;
    string = void 0;
    if (this.style.keys) {
      while (style = this[i = (i != null ? i : -1) + 1]) {
        string = (string && string + ', ' || '') + style.format(styles, i + 1);
      }
      pad = this.style.pad;
      _ref = keys = this.properties;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        key = _ref[index];
        if (index && pad) {
          if (index > 2) {
            if (this.equals(key, keys[1])) {
              continue;
            }
          } else if (index > 1) {
            if (this.equals(key, keys[0]) && (!this.hasOwnProperty[keys[3]] || this.equals(keys[3], keys[1]))) {
              continue;
            }
          } else {
            if (this.equals(key, keys[0]) && this.equals(keys[1], keys[2]) && this.equals(keys[2], keys[3])) {
              continue;
            }
          }
        } else {
          if (styles && number && ((value = styles[key + '-' + number]) != null)) {
            prefix = previous = void 0;
            if (typeof value !== 'string') {
              keys = this.style.keys;
              types = this.style.types;
              for (index = _j = _ref1 = keys.indexOf(key) - 1; _j > 0; index = _j += -1) {
                if ((k = keys[index]) !== previous) {
                  if (this.hasOwnProperty(k)) {
                    break;
                  }
                  if (types[index] === this.styles.engine.Type.Length) {
                    expression = this.toExpressionString(k, this[k]);
                    prefix = ((string || prefix) && ' ' || '') + expression + (prefix && ' ' + prefix || '');
                    previous = k;
                  }
                }
              }
            }
            if (prefix) {
              string += prefix;
            }
          } else {
            if (!this.hasOwnProperty(key)) {
              continue;
            }
            value = this[key];
          }
        }
        expression = this.toExpressionString(key, value);
        string = (string && string + ' ' || '') + expression;
      }
    }
    return string;
  };

  Shorthand.prototype.equals = function(first, second) {
    var a, b;
    a = this[first];
    b = this[second];
    if (typeof a !== 'object') {
      return a === b;
    } else {
      return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
    }
  };

  Shorthand.prototype.toExpressionString = function(key, operation, expression, styles) {
    var index, name, string, type, types, _i, _j, _len, _ref;
    if (styles == null) {
      styles = this.styles;
    }
    switch (typeof operation) {
      case 'object':
        name = operation[0];
        if (name === '%' || this.styles.Unit[name] || this.styles.Type.Times[name]) {
          return this.toExpressionString(key, operation[1], true) + name;
        } else {
          string = name + '(';
          for (index = _i = 1, _ref = operation.length - 1; 1 <= _ref ? _i <= _ref : _i >= _ref; index = 1 <= _ref ? ++_i : --_i) {
            if (index !== 1) {
              string += ',';
            }
            string += this.toExpressionString(key, operation[index], true);
          }
          return string + ')';
        }
        break;
      case 'number':
        if (!expression) {
          types = styles[key].types;
          for (_j = 0, _len = types.length; _j < _len; _j++) {
            type = types[_j];
            if (type.displayName === 'Integer' || type.displayName === 'Float') {
              return operation;
            }
          }
          if (operation !== 0) {
            operation = Math.floor(operation) + 'px';
          }
        }
    }
    return operation;
  };

  return Shorthand;

})();

Matcher = function(name, keywords, types, keys, required, pad, depth, initial, callback) {
  var matcher;
  matcher = function() {
    var arg, args, argument, i, index, j, matched, property, props, req, result, returned, type, typed, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3;
    result = matched = void 0;
    if (pad && arguments.length < 4) {
      args = [arguments[0], (_ref = arguments[1]) != null ? _ref : arguments[0], (_ref1 = arguments[2]) != null ? _ref1 : arguments[0], (_ref2 = arguments[1]) != null ? _ref2 : arguments[0]];
    }
    _ref3 = args || arguments;
    for (i = _i = 0, _len = _ref3.length; _i < _len; i = ++_i) {
      argument = _ref3[i];
      switch (typeof argument) {
        case 'object':
          if (typeof argument[0] !== 'string' || argument.length === 1) {
            if (matched = matcher.apply(this, argument)) {
              (result || (result = new initial))[i] = matched;
            } else {
              return;
            }
          }
          break;
        case 'string':
          if (props = keywords[argument]) {
            if (keys) {
              j = pad && i || 0;
              while ((property = props[j++]) != null) {
                if (!result || !result.hasOwnProperty(property)) {
                  if (!required[property] || (result && result[required[property]] !== void 0)) {
                    matched = (result || (result = new initial))[property] = argument;
                    break;
                  }
                } else if (props.length === 1 && argument !== result[property]) {
                  arg = argument;
                  argument = result[property];
                  result[property] = arg;
                  if (typeof argument === 'string' && (props = keywords[argument])) {
                    j = pad && i || 0;
                    continue;
                  }
                  break;
                }
                if (pad) {
                  break;
                }
              }
            } else {
              return argument;
            }
          }
      }
      if (types && (matched == null)) {
        if (keys) {
          for (index = _j = 0, _len1 = keys.length; _j < _len1; index = ++_j) {
            property = keys[index];
            if (!result || (!result.hasOwnProperty(property) && (!(req = required[property]) || result.hasOwnProperty(req)))) {
              if ((matched = types[index].call(this, argument)) !== void 0) {
                (result || (result = new initial))[property] = matched;
                break;
              }
            }
          }
        } else {
          for (index = _k = 0, _len2 = types.length; _k < _len2; index = ++_k) {
            type = types[index];
            if ((typed = type.call(this, argument)) !== void 0) {
              return typed;
            }
          }
        }
      }
      if (matched == null) {
        return;
      }
      matched = void 0;
    }
    if (callback && ((returned = callback(result)) != null)) {
      return returned;
    }
    return result;
  };
  matcher.matcher = true;
  matcher.displayName = name;
  if (keywords != null) {
    matcher.keywords = keywords;
  }
  if (types != null) {
    matcher.types = types;
  }
  if (keys != null) {
    matcher.keys = keys;
  }
  if (pad != null) {
    matcher.pad = pad;
  }
  if (depth != null) {
    matcher.depth = depth;
  }
  if (initial != null) {
    matcher.initial = initial;
  }
  if (callback != null) {
    matcher.callback = callback;
  }
  return matcher;
};

module.exports = Style;
