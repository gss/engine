var Abstract, Document, Native,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Abstract = require('./Abstract');

Native = require('../methods/Native');

Document = (function(_super) {
  __extends(Document, _super);

  Document.prototype.priority = Infinity;

  Document.prototype.Methods = Native.prototype.mixin({}, Abstract.prototype.Methods, require('../methods/Selectors'), require('../methods/Rules'));

  Document.prototype.Queries = require('../modules/Queries');

  Document.prototype.Pairs = require('../modules/Pairs');

  Document.prototype.Mutations = require('../modules/Mutations');

  Document.prototype.Positions = require('../modules/Positions');

  Document.prototype.Stylesheet = require('../modules/Stylesheets');

  Document.prototype.helps = true;

  Document.prototype.disconnected = true;

  function Document() {
    var _base, _base1, _base2, _base3, _base4, _base5, _base6;
    (_base = this.engine).positions || (_base.positions = new this.Positions(this));
    (_base1 = this.engine).stylesheets || (_base1.stylesheets = new this.Stylesheet(this));
    (_base2 = this.engine).applier || (_base2.applier = this.engine.positions);
    (_base3 = this.engine).scope || (_base3.scope = document);
    (_base4 = this.engine).queries || (_base4.queries = new this.Queries(this));
    (_base5 = this.engine).pairs || (_base5.pairs = new this.Pairs(this));
    (_base6 = this.engine).mutations || (_base6.mutations = new this.Mutations(this));
    this.engine.all = this.engine.scope.getElementsByTagName('*');
    if (this.scope.nodeType === 9 && ['complete', 'loaded'].indexOf(this.scope.readyState) === -1) {
      this.scope.addEventListener('DOMContentLoaded', this.engine);
      document.addEventListener('readystatechange', this.engine);
      window.addEventListener('load', this.engine);
    } else if (this.running) {
      this.events.compile.call(this);
    }
    this.scope.addEventListener('scroll', this.engine, true);
    if (typeof window !== "undefined" && window !== null) {
      window.addEventListener('resize', this.engine);
    }
    Document.__super__.constructor.apply(this, arguments);
  }

  Document.prototype.events = {
    resize: function(e) {
      var id,
        _this = this;
      if (e == null) {
        e = '::window';
      }
      id = e.target && this.identity.provide(e.target) || e;
      if (this.resizer == null) {
        if (e.target && this.updating) {
          if (this.updating.resizing) {
            return this.updating.resizing = 'scheduled';
          }
          this.updating.resizing = 'computing';
        }
        this.once('solve', function() {
          return setTimeout(function() {
            var _ref;
            if (((_ref = this.updated) != null ? _ref.resizing : void 0) === 'scheduled') {
              return this.triggerEvent('resize');
            }
          }, 10);
        });
      } else {
        clearTimeout(this.resizer);
      }
      return this.resizer = setTimeout(function() {
        _this.resizer = void 0;
        return _this.solve(id + ' resized', function() {
          this.intrinsic.verify(id, "width");
          this.intrinsic.verify(id, "height");
          return this.intrinsic.solve([]);
        });
      }, 20);
    },
    scroll: function(e) {
      var id;
      if (e == null) {
        e = '::window';
      }
      id = e.target && this.identity.provide(e.target) || e;
      return this.solve(id + ' scrolled', function() {
        this.intrinsic.verify(id, "scroll-top");
        return this.intrinsic.verify(id, "scroll-left");
      });
    },
    solve: function() {
      var html, id, klass, _i, _len, _ref, _ref1, _ref2;
      if (this.scope.nodeType === 9) {
        html = this.scope.body.parentNode;
        klass = html.className;
        if (klass.indexOf('gss-ready') === -1) {
          if ((_ref = this.mutations) != null) {
            _ref.disconnect(true);
          }
          html.className = (klass && klass + ' ' || '') + 'gss-ready';
          if ((_ref1 = this.mutations) != null) {
            _ref1.connect(true);
          }
        }
      }
      if (this.document.removed) {
        _ref2 = this.document.removed;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          id = _ref2[_i];
          this.identity.unset(id);
        }
        return this.document.removed = void 0;
      }
    },
    DOMContentLoaded: function() {
      this.scope.removeEventListener('DOMContentLoaded', this);
      if (this.running === void 0) {
        return this.engine.compile();
      }
    },
    readystatechange: function() {
      document.removeEventListener('readystatechange', this);
      if (this.running === void 0) {
        this.triggerEvent('DOMContentLoaded');
      }
      return this.solve('Document', 'onload', function() {
        return this.intrinsic.solve([]);
      });
    },
    load: function() {
      if (this.running === void 0) {
        this.triggerEvent('DOMContentLoaded');
      }
      window.removeEventListener('load', this);
      return this.solve('Document', 'onload', function() {
        return this.intrinsic.solve([]);
      });
    },
    compile: function() {
      this.console.profile(1);
      this.stylesheets.compile();
      return this.console.profileEnd(1);
    },
    destroy: function() {
      this.scope.removeEventListener('DOMContentLoaded', this);
      this.scope.removeEventListener('scroll', this);
      window.removeEventListener('resize', this);
      return this.events.destroy.apply(this, arguments);
    }
  };

  Document.condition = function() {
    return this.scope != null;
  };

  Document.prototype.url = null;

  return Document;

})(Abstract);

module.exports = Document;
