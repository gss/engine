var Abstract, Document,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Abstract = require('./Abstract');

Document = (function(_super) {
  __extends(Document, _super);

  Document.prototype.priority = Infinity;

  Document.prototype.Selector = require('../Selector');

  Document.prototype.Stylesheet = require('../Stylesheet');

  Document.prototype.disconnected = true;

  function Document() {
    Document.__super__.constructor.apply(this, arguments);
    if (this.scope.nodeType === 9) {
      if (['complete', 'loaded'].indexOf(this.scope.readyState) === -1) {
        document.addEventListener('DOMContentLoaded', this.engine);
        document.addEventListener('readystatechange', this.engine);
        window.addEventListener('load', this.engine);
      } else {
        this.compile();
      }
    }
    this.engine.Selector = this.Selector;
    this.Selector.observe(this.engine);
    this.scope.addEventListener('scroll', this.engine, true);
    if (typeof window !== "undefined" && window !== null) {
      window.addEventListener('resize', this.engine);
    }
  }

  Document.prototype.events = {
    resize: function(e) {
      var id,
        _this = this;
      if (e == null) {
        e = '::window';
      }
      id = e.target && this.identify(e.target) || e;
      if (this.resizer == null) {
        if (e.target && this.updating) {
          if (this.updating.resizing) {
            return this.updating.resizing = 'scheduled';
          }
          this.updating.resizing = 'computing';
        }
        this.once('solve', function() {
          return requestAnimationFrame(function() {
            var _ref;
            if (((_ref = this.updated) != null ? _ref.resizing : void 0) === 'scheduled') {
              return this.triggerEvent('resize');
            }
          });
        });
      } else {
        cancelAnimationFrame(this.resizer);
      }
      return this.resizer = requestAnimationFrame(function() {
        _this.resizer = void 0;
        return _this.solve(id + ' resized', function() {
          this.intrinsic.verify(id, "width");
          return this.intrinsic.verify(id, "height");
        });
      });
    },
    scroll: function(e) {
      var id;
      if (e == null) {
        e = '::window';
      }
      id = e.target && this.identify(e.target) || e;
      return this.solve(id + ' scrolled', function() {
        this.intrinsic.verify(id, "scroll-top");
        return this.intrinsic.verify(id, "scroll-left");
      });
    },
    DOMContentLoaded: function() {
      document.removeEventListener('DOMContentLoaded', this);
      return this.compile();
    },
    readystatechange: function() {
      if (this.running && document.readyState === 'complete') {
        return this.solve('Document', 'readystatechange', function() {
          return this.intrinsic.solve();
        });
      }
    },
    load: function() {
      window.removeEventListener('load', this);
      document.removeEventListener('DOMContentLoaded', this);
      return this.solve('Document', 'load', function() {});
    },
    compile: function() {
      return this.document.Stylesheet.compile(this.document);
    },
    solve: function() {
      var html, id, klass, _i, _len, _ref, _ref1, _ref2;
      if (this.scope.nodeType === 9) {
        html = this.scope.body.parentNode;
        klass = html.className;
        if (klass.indexOf('gss-ready') === -1) {
          if ((_ref = this.Selector) != null) {
            _ref.disconnect(this, true);
          }
          html.className = (klass && klass + ' ' || '') + 'gss-ready';
          if ((_ref1 = this.Selector) != null) {
            _ref1.connect(this, true);
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
    commit: function() {
      return this.document.Stylesheet.perform(this.document);
    },
    destroy: function() {
      var _ref;
      this.scope.removeEventListener('DOMContentLoaded', this);
      this.scope.removeEventListener('scroll', this);
      window.removeEventListener('resize', this);
      return (_ref = this.Selector) != null ? _ref.disconnect(this, true) : void 0;
    }
  };

  Document.condition = function() {
    return this.scope != null;
  };

  Document.prototype.url = null;

  return Document;

})(Abstract);

module.exports = Document;
