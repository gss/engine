var Engine,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Engine = require('./Engine');

Engine.Document = (function(_super) {
  __extends(Document, _super);

  Document.prototype.Queries = require('./input/Queries.js');

  Document.prototype.Styles = require('./output/Styles.js');

  Document.prototype.Solver = require('./Solver.js');

  Document.prototype.Context = Engine.include(require('./context/Measurements.js'), require('./context/Properties.js'), require('./context/Selectors.js'), require('./context/Rules.js'));

  function Document(scope, url) {
    var context;
    if (scope == null) {
      scope = document;
    }
    if (context = Document.__super__.constructor.call(this, scope, url)) {
      return context;
    }
    this.styles = new this.Styles(this);
    this.solver = new this.Solver(this, this.styles, url);
    this.queries = new this.Queries(this, this.expressions);
    this.expressions.output = this.solver;
    if (this.scope.nodeType === 9) {
      this.scope.addEventListener('DOMContentLoaded', this);
    }
    this.scope.addEventListener('scroll', this);
    window.addEventListener('resize', this);
  }

  Document.prototype.onresize = function(e) {
    this.context.set("[width]", "::window");
    return this.context.set("[height]", "::window");
  };

  Document.prototype.onscroll = function(e) {
    this.context.set("[scroll-top]", e.target);
    return this.context.set("[scroll-left]", e.target);
  };

  Document.prototype.destroy = function() {
    this.scope.removeEventListener('DOMContentLoaded', this);
    this.scope.removeEventListener('scroll', this);
    return window.removeEventListener('resize', this);
  };

  Document.prototype.onDOMContentLoaded = function() {
    return this.scope.removeEventListener('DOMContentLoaded', this);
  };

  return Document;

})(Engine);

module.exports = Engine.Document;
