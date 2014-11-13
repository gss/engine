/* Input: Observed values

Manages solutions and document properties.

Interface:

  - (un)watch() - (un)subscribe expression to property updates
  - set()       - dispatches updates to subscribed expressions
  - get()       - retrieve value
  - clean()     - detach observes by continuation


State:
  - @_watchers[key] - List of oservers of specific properties
                      as [operation, continuation, scope] triplets

  - @_observers[continuation] - List of observers by continuation
                                as [operation, key, scope] triplets
*/

var Provided, Solved, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Provided = require('./Provided');

Solved = (function(_super) {
  var Commands;

  __extends(Solved, _super);

  function Solved() {
    _ref = Solved.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Solved.singleton = true;

  Commands = (function() {
    function Commands() {}

    Commands.prototype["=="] = function(a, b) {
      return b;
    };

    Commands.prototype["<="] = function(a, b) {
      return Math.min(a, b);
    };

    Commands.prototype[">="] = function(a, b) {
      return Math.max(a, b);
    };

    Commands.prototype["<"] = function(a, b) {
      return Math.min(a, b - 1);
    };

    Commands.prototype[">"] = function(a, b) {
      return Math.max(a, b + 1);
    };

    return Commands;

  })();

  return Solved;

})(Provided);

module.exports = Solved;
