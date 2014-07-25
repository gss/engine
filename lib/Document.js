var Document, Engine, command, property, source, target, _i, _j, _len, _len1, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Engine = require('./Engine');

Document = (function(_super) {
  __extends(Document, _super);

  Document.prototype.Queries = require('./input/Queries');

  Document.prototype.Restyles = require('./output/Restyles');

  Document.prototype.Solver = require('./Solver');

  Document.prototype.Style = require('./concepts/Style');

  Document.prototype.Types = require('./commands/Types');

  Document.prototype.Units = require('./commands/Units');

  Document.prototype.Commands = Engine.include(Engine.prototype.Commands, Document.prototype.Units, Document.prototype.Types, require('./commands/Measurements'), require('./commands/Selectors'), require('./commands/Rules'), require('./commands/Native'), require('./commands/Algebra'), require('./commands/Transformations'));

  Document.prototype.Properties = Engine.include(require('./properties/Dimensions'), require('./properties/Equasions'), require('./properties/Styles'));

  function Document(scope, url) {
    var context;
    if (scope == null) {
      scope = document;
    }
    if (context = Document.__super__.constructor.call(this, scope, url)) {
      return context;
    }
    this.restyles = new this.Restyles(this);
    this.solver = new this.Solver(this, this.restyles, url);
    this.queries = new this.Queries(this, this.expressions);
    this.types = new this.Types(this);
    this.units = new this.Units(this);
    this.expressions.capturer = this.queries;
    this.expressions.output = this.solver;
    if (this.scope.nodeType === 9 && ['complete', 'interactive', 'loaded'].indexOf(this.scope.readyState) === -1) {
      this.scope.addEventListener('DOMContentLoaded', this);
    } else {
      this.start();
    }
    this.scope.addEventListener('scroll', this);
    window.addEventListener('resize', this);
  }

  Document.prototype.capture = function() {
    return this.expressions.capture.apply(this.expressions, arguments);
  };

  Document.prototype.release = function() {
    return this.expressions.release.apply(this.expressions, arguments);
  };

  Document.prototype.onresize = function(e) {
    var captured, id;
    if (e == null) {
      e = '::window';
    }
    id = e.target && this.identify(e.target) || e;
    captured = this.expressions.capture(id + ' resized');
    this.measure(id, "width", void 0, false);
    this.measure(id, "height", void 0, false);
    if (captured) {
      return this.release();
    }
  };

  Document.prototype.onscroll = function(e) {
    var captured, id;
    if (e == null) {
      e = '::window';
    }
    id = e.target && this.identify(e.target) || e;
    captured = this.expressions.capture(id + ' scrolled');
    this.measure(id, "scroll-top", void 0, false);
    this.measure(id, "scroll-left", void 0, false);
    if (captured) {
      return this.release();
    }
  };

  Document.prototype.destroy = function() {
    this.scope.removeEventListener('DOMContentLoaded', this);
    this.scope.removeEventListener('scroll', this);
    return window.removeEventListener('resize', this);
  };

  Document.prototype.onDOMContentLoaded = function() {
    this.scope.removeEventListener('DOMContentLoaded', this);
    return this.start();
  };

  Document.prototype.start = function() {
    if (Document.__super__.start.apply(this, arguments)) {
      return this.capture('stylesheets', [['eval', ['$attribute', ['$tag', 'style'], '*=', 'type', 'text/gss']], ['load', ['$attribute', ['$tag', 'link'], '*=', 'type', 'text/gss']]]);
    }
  };

  return Document;

})(Engine);

_ref = [Engine, Document.prototype, Document];
for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  target = _ref[_i];
  _ref1 = [Document.prototype.Commands.prototype];
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    source = _ref1[_j];
    for (property in source) {
      command = source[property];
      target[property] || (target[property] = Engine.prototype.Command(command, true, property));
    }
  }
  target.engine = Engine;
}

module.exports = Engine.Document = Document;
