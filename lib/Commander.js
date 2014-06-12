/*

Root commands, if bound to a dom query, will spawn commands
to match live results of query.
*/

var Commander, DOM, prop, value, _ref, _ref1, _ref2,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Commander = (function(_super) {
  __extends(Commander, _super);

  function Commander() {
    _ref = Commander.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  return Commander;

})(Expression);

DOM = (function() {
  function DOM(object) {
    this.object = object;
  }

  return DOM;

})();

_ref1 = Properties.prototype;
for (prop in _ref1) {
  value = _ref1[prop];
  DOM.prototype[prop] = value;
}

_ref2 = Selectors.prototype;
for (prop in _ref2) {
  value = _ref2[prop];
  DOM.prototype[prop] = value;
}

module.exports = Commander;
