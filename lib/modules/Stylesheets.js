var Stylesheet;

Stylesheet = (function() {
  function Stylesheet(engine) {
    this.engine = engine;
  }

  Stylesheet.prototype.getRule = function(operation) {
    var rule;
    rule = operation;
    while (rule = rule.parent) {
      if (rule.name === 'rule') {
        return rule;
      }
    }
  };

  Stylesheet.prototype.getStylesheet = function(stylesheet) {
    var dump, _ref;
    if (!((_ref = (dump = stylesheet.nextSibling)) != null ? _ref.meta : void 0)) {
      dump = document.createElement('STYLE');
      dump.meta = [];
      return stylesheet.parentNode.insertBefore(dump, stylesheet.nextSibling);
    }
  };

  Stylesheet.prototype.getOperation = function(operation, meta, rule) {
    var needle, other, _i, _len, _ref, _ref1;
    needle = operation.sourceIndex;
    _ref = rule.properties;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      other = _ref[_i];
      if (other !== needle) {
        if ((_ref1 = meta[other]) != null ? _ref1.length : void 0) {
          needle = other;
          break;
        }
      }
    }
    return needle;
  };

  Stylesheet.prototype.watch = function(meta, continuation, operation) {
    var _name;
    meta = (meta[_name = operation.sourceIndex] || (meta[_name] = []));
    if (meta.indexOf(continuation) > -1) {
      return;
    }
    if (meta.push(continuation) > 1) {
      return;
    }
    (meta[continuation] || (meta[continuation] = [])).push(operation.sourceIndex);
    return true;
  };

  Stylesheet.prototype.solve = function(stylesheet, operation, continuation, element, property, value) {
    var dump, rule;
    if (rule = this.getRule(operation)) {
      dump = this.getStylesheet(stylesheet);
      if (this.watch(dump.meta, continuation, operation)) {
        if (this.update(operation, property, value, dump, rule)) {
          this.engine.engine.restyled = true;
        }
      }
      return true;
    }
  };

  Stylesheet.prototype.update = function(operation, property, value, dump, rule) {
    var body, index, item, needle, other, position, rules, selectors, _i, _j, _len, _len1, _ref;
    needle = this.getOperation(operation, dump.meta, rule);
    position = 0;
    _ref = dump.meta;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      item = _ref[index];
      if (index >= needle) {
        break;
      }
      if (item != null ? item.length : void 0) {
        position++;
      }
    }
    rules = dump.sheet.rules || dump.sheet.cssRules;
    for (_j = 0, _len1 = rules.length; _j < _len1; _j++) {
      other = rules[_j];
      position -= other.style.length - 1;
    }
    if (needle !== operation.sourceIndex) {
      rule = rules[position];
      rule.style[property] = value;
    } else {
      selectors = this.engine.getOperationSelectors(operation).join(', ');
      body = property + ':' + value;
      index = dump.sheet.insertRule(selectors + "{" + body + "}", position);
    }
    return true;
  };

  Stylesheet.prototype.remove = function(index, continuation, stylesheet, meta) {
    var watchers;
    watchers = meta[index];
    watchers.splice(watchers.indexOf(continuation), 1);
    if (!watchers.length) {
      delete meta[index];
      return console.log('lawl', index);
    }
  };

  Stylesheet.prototype.clean = function(continuation, stylesheets) {
    debugger;
    var index, meta, operations, stylesheet, _i, _len, _ref, _results;
    _results = [];
    for (_i = 0, _len = stylesheets.length; _i < _len; _i++) {
      stylesheet = stylesheets[_i];
      if (meta = (_ref = stylesheet.nextSibling) != null ? _ref.meta : void 0) {
        if (operations = meta[continuation]) {
          while ((index = operations.pop()) != null) {
            this.remove(index, continuation, stylesheet, meta);
          }
        }
      }
      _results.push(console.error('removeafdsdf', stylesheets, continuation, meta, stylesheet, stylesheet.nextSibling));
    }
    return _results;
  };

  return Stylesheet;

})();

module.exports = Stylesheet;
