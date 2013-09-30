var Command,
  __slice = [].slice;

Command = (function() {
  function Command(engine) {
    this.engine = engine;
  }

  Command.prototype['var'] = function(id, prop, elements) {
    var el, _i, _len, _ref;
    if (elements instanceof Array) {
      for (_i = 0, _len = elements.length; _i < _len; _i++) {
        el = elements[_i];
        this.engine.registerCommand('var', el.id + prop);
      }
      return elements.onadd(function(newElements) {
        var _j, _len1, _results;
        _results = [];
        for (_j = 0, _len1 = elements.length; _j < _len1; _j++) {
          el = elements[_j];
          _results.push(this.engine.registerCommand('var', el.id + prop));
        }
        return _results;
      });
    } else {
      return (_ref = this.engine).registerCommand.apply(_ref, ["var"].concat(__slice.call(arguments)));
    }
  };

  Command.prototype['$class'] = function(className) {
    var _this = this;
    return this.engine._registerLiveNodeList("." + className, function() {
      return _this.engine.container.getElementsByClassName(className);
    });
  };

  return Command;

})();

module.exports = Command;
