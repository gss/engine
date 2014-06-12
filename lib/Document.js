var Context, Document, prop, value, _ref, _ref1, _ref2,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Document = (function(_super) {
  __extends(Document, _super);

  Document.prototype.Mutations = require('../input/Mutations.js');

  Document.prototype.Measurements = require('../input/Measurements.js');

  Document.prototype.Styles = require('../output/Styles.js');

  function Document(scope, url) {
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
    this.solver.constraints.pipe(this.styles);
    this.references.write = this.context.clean.bind(this.context);
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
  Context.prototype.Properties = require('./context/Properties.js');

  Context.prototype.Selectors = require('./context/Selectors.js');

  Context.prototype.Rules = require('./context/Rules.js');

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

_ref2 = DOM.prototype.Rules.prototype;
for (prop in _ref2) {
  value = _ref2[prop];
  DOM.prototype[prop] = value;
}

Engine.Document = Document;

module.exports = Document;
