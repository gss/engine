var Solver;

Solver = (function() {
  function Solver() {}

  return Solver;

})();

Solver.prototype.Methods = (function() {
  function Methods() {}

  Methods.prototype.value = function(value) {
    console.info(Array.prototype.slice.call(arguments));
    return value;
  };

  Methods.prototype.framed = function(value) {
    return value;
  };

  return Methods;

})();

module.exports = Solver;
