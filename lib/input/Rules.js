var Rules;

Rules = (function() {
  function Rules() {}

  Rules.prototype["$rule"] = {
    prefix: "{",
    scope: true,
    evaluate: function(arg, i, evaluated) {
      if (i === 0) {
        return arg;
      }
      if (i === 1 || (evaluated[1] && i === 2)) {
        return this.evaluate(arg);
      }
    }
  };

  Rules.prototype["$if"] = {
    prefix: "@if",
    evaluate: function(arg, i, evaluated) {
      var _ref;
      if (i === 0) {
        return arg;
      }
      if (i === 1 || ((_ref = evaluated[1]) != null ? _ref : i === {
        2: i === 3
      })) {
        return this.evaluate(arg);
      }
    }
  };

  return Rules;

})();

module.exports = Rules;
