var Document, Engine, method, property, source, target, _i, _j, _len, _len1, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Engine = require('./Engine');

Document = (function(_super) {
  __extends(Document, _super);

  Document.prototype.Queries = require('./modules/Queries');

  Document.prototype.Positions = require('./modules/Positions');

  Document.prototype.Types = require('./methods/Types');

  Document.prototype.Units = require('./methods/Units');

  Document.prototype.Style = require('./concepts/Style');

  Document.prototype.Domains = Engine.mixin(Engine.prototype.Domains, {
    Intrinsic: require('./domains/Intrinsic')
  });

  Document.prototype.Methods = Engine.mixin(Engine.prototype.Methods, require('./methods/Types'), require('./methods/Units'), require('./methods/Selectors'), require('./methods/Rules'), require('./methods/Native'), require('./methods/Transformations'));

  Document.prototype.Properties = Engine.mixin(Engine.prototype.Properties, require('./properties/Dimensions'), require('./properties/Styles'));

  function Document(scope, url) {
    var context;
    if (scope == null) {
      scope = document;
    }
    if (context = Document.__super__.constructor.call(this, scope, url)) {
      return context;
    }
    this.thread = new this.Thread(this, url);
    this.queries = new this.Queries(this);
    this.positions = new this.Positions(this);
    this.types = new this.Types(this);
    this.units = new this.Units(this);
    this.intrinsic = new this.Intrinsic(this);
    if (this.scope.nodeType === 9 && ['complete', 'interactive', 'loaded'].indexOf(this.scope.readyState) === -1) {
      this.scope.addEventListener('DOMContentLoaded', this);
    } else {
      this.start();
    }
    this.scope.addEventListener('scroll', this);
    window.addEventListener('resize', this);
  }

  Document.prototype.events = Engine.mixin(Engine.prototype.events, {
    resize: function(e) {
      var id;
      if (e == null) {
        e = '::window';
      }
      id = e.target && this.identity.provide(e.target) || e;
      return this.solve(id + ' resized', function() {
        this.intrinsic.verify(id, "width", void 0, false);
        return this.intrinsic.verify(id, "height", void 0, false);
      });
    },
    scroll: function(e) {
      var id;
      if (e == null) {
        e = '::window';
      }
      id = e.target && this.identity.provide(e.target) || e;
      return this.solve(id + ' scrolled', function() {
        this.intrinsic.verify(id, "scroll-top", void 0, false);
        return this.intrinsic.verify(id, "scroll-left", void 0, false);
      });
    },
    solve: function() {
      var id, _i, _len, _ref;
      if (this.removed) {
        _ref = this.removed;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          id = _ref[_i];
          this.identity.unset(id);
        }
        return this.removed = void 0;
      }
    },
    DOMContentLoaded: function() {
      this.scope.removeEventListener('DOMContentLoaded', this);
      return this.start();
    },
    compile: function() {
      this.queries.connect();
      return this.expressions.solve('stylesheets', [['eval', ['$attribute', ['$tag', 'style'], '*=', 'type', 'text/gss']], ['load', ['$attribute', ['$tag', 'link'], '*=', 'type', 'text/gss']]]);
    },
    destroy: function() {
      this.scope.removeEventListener('DOMContentLoaded', this);
      this.scope.removeEventListener('scroll', this);
      return window.removeEventListener('resize', this);
    }
  });

  return Document;

})(Engine);

_ref = [Engine, Document.prototype, Document];
for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  target = _ref[_i];
  _ref1 = [Document.prototype.Methods.prototype];
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    source = _ref1[_j];
    for (property in source) {
      method = source[property];
      target[property] || (target[property] = Engine.prototype.Method(method, true, property));
    }
  }
  target.engine = Engine;
}

module.exports = Engine.Document = Document;

if (!self.window && self.onmessage !== void 0) {
  self.addEventListener('message', function() {
    return new GSS.Document();
  });
}
