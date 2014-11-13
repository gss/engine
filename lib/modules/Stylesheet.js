var Stylesheet;

Stylesheet = (function() {
  function Stylesheet() {}

  Stylesheet.prototype.solve = function(stylesheet, operation, continuation, element, property, value) {
    var body, dump, index, item, meta, needle, other, position, rule, rules, selectors, _base, _i, _j, _k, _len, _len1, _len2, _name, _ref, _ref1, _ref2, _ref3;
    if (!((_ref = (dump = stylesheet.nextSibling)) != null ? _ref.meta : void 0)) {
      dump = document.createElement('STYLE');
      dump.meta = [];
      stylesheet.parentNode.insertBefore(dump, stylesheet.nextSibling);
    }
    this.engine.restyled = true;
    rule = operation;
    while (rule = rule.parent) {
      if (rule.name === 'rule') {
        break;
      }
    }
    if (!rule) {
      return;
    }
    needle = operation.sourceIndex;
    _ref1 = rule.properties;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      other = _ref1[_i];
      if (other !== needle) {
        if ((_ref2 = dump.meta[other]) != null ? _ref2.length : void 0) {
          needle = other;
          break;
        }
      }
    }
    meta = ((_base = dump.meta)[_name = operation.sourceIndex] || (_base[_name] = []));
    if (meta.indexOf(continuation) > -1) {
      return;
    }
    if (meta.push(continuation) > 1) {
      return;
    }
    position = 0;
    _ref3 = dump.meta;
    for (index = _j = 0, _len1 = _ref3.length; _j < _len1; index = ++_j) {
      item = _ref3[index];
      if (index >= needle) {
        break;
      }
      if (item != null ? item.length : void 0) {
        position++;
      }
    }
    rules = dump.sheet.rules || dump.sheet.cssRules;
    for (_k = 0, _len2 = rules.length; _k < _len2; _k++) {
      rule = rules[_k];
      position -= rule.style.length - 1;
    }
    if (needle !== operation.sourceIndex) {
      rule = rules[position];
      rule.style[property] = value;
    } else {
      selectors = this.getOperationSelectors(operation).join(', ');
      body = property + ':' + value;
      index = dump.sheet.insertRule(selectors + "{" + body + "}", position);
    }
    return true;
  };

  return Stylesheet;

})();

module.exports = Stylesheet;
