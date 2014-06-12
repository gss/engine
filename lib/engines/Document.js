var DOM, Document, prop, value, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Document = (function(_super) {
  __extends(Document, _super);

  Document.prototype.Observer = require('../Observer.js');

  Document.prototype.Thread = require('./Thread.js');

  function Document(scope) {
    this.scope = scope;
    Document.__super__.constructor.call(this);
    this.commands = new this.DOM;
    this.values = new this.Observer;
  }

  Document.prototype.getId = function(value) {
    return value && (value._gss_id || (value._gss_id = ++Document.prototype.uid));
  };

  Document.prototype.uid = 0;

  return Document;

})(Engine);

Document.prototype.DOM = DOM = (function() {
  DOM.prototype.Properties = require('./dom/Properties.js');

  DOM.prototype.Selectors = require('./dom/Selectors.js');

  function DOM(engine) {
    this.engine = engine;
  }

  return DOM;

})();

_ref = DOM.prototype.Properties.prototype;
for (prop in _ref) {
  value = _ref[prop];
  DOM.prototype[prop] = value;
}

_ref1 = DOM.prototype.Selectors.prototype;
for (prop in _ref1) {
  value = _ref1[prop];
  DOM.prototype[prop] = value;
}

document.addEventListener('DOMContentLoaded', function() {
  return GSS.boot();
});

module.exports = Document;
