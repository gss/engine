var Engine,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Engine = require('./Engine');

Engine.Document = (function(_super) {
  __extends(Document, _super);

  Document.prototype.Mutations = require('./input/Mutations.js');

  Document.prototype.Measurements = require('./input/Measurements.js');

  Document.prototype.Styles = require('./output/Styles.js');

  Document.prototype.Solver = require('./Solver.js');

  Document.prototype.Context = Engine.include(require('./context/Properties.js'), require('./context/Selectors.js'), require('./context/Rules.js'), require('./context/Math.js'));

  function Document(scope, url) {
    var context;
    if (scope == null) {
      scope = document;
    }
    if (context = Document.__super__.constructor.call(this, scope, url)) {
      return context;
    }
    this.mutations = new this.Mutations(this);
    this.measurements = new this.Measurements(this);
    this.solver = new this.Solver(this, url);
    this.styles = new this.Styles(this);
    this.mutations.output = this.expressions;
    this.measurements.output = this.expressions;
    this.expressions.output = this.solver;
    this.solver.output = this.styles;
    if (this.scope.nodeType === 9) {
      this.scope.addEventListener('DOMContentLoaded', this);
    }
  }

  Document.prototype.onDOMContentLoaded = function() {
    return this.scope.removeEventListener('DOMContentLoaded', this);
  };

  return Document;

})(Engine);

module.exports = Engine.Document;
