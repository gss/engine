var Context, Document, prop, value, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Document = (function(_super) {
  __extends(Document, _super);

  Document.prototype.Mutations = require('../input/Mutations.js');

  Document.prototype.Mutations = require('../input/Measurements.js');

  Document.prototype.Styles = require('../output/Styles.js');

  function Document(scope) {
    var context;
    if (context = Document.__super__.constructor.call(this, scope, url)) {
      return context;
    }
    this.context = new this.Context(this);
    this.mutations = new this.Mutations(this);
    this.measurements = new this.Measurements(this);
    this.solver = new this.Solver(this, url);
    this.styles = new this.Styles(this);
    this.mutations.pipe(this.expressions);
    this.measurements.pipe(this.expressions);
    this.expressions.pipe(this.solver);
    this.process.pipe(this.styles);
    if (this.scope.nodeType === 9) {
      this.scope.addEventListener('DOMContentLoaded', this);
    }
  }

  Document.prototype.onDOMContentLoaded = function() {
    return this.scope.removeEventListener('DOMContentLoaded', this);
  };

  return Document;

})(Engine);

Document.prototype.Context = Context = (function() {
  Context.prototype.Rules = require('./input/Measurements.js');

  Context.prototype.Rules = require('./input/Rules.js');

  Context.prototype.Selectors = require('./input/Selectors.js');

  function Context(engine) {
    this.engine = engine;
  }

  return Context;

})();

_ref = DOM.prototype.Measurements.prototype;
for (prop in _ref) {
  value = _ref[prop];
  DOM.prototype[prop] = value;
}

_ref1 = DOM.prototype.Selectors.prototype;
for (prop in _ref1) {
  value = _ref1[prop];
  DOM.prototype[prop] = value;
}

module.exports = Document;
