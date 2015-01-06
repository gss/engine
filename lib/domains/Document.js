var Abstract, Document,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Abstract = require('./Abstract');

Document = (function(_super) {
  __extends(Document, _super);

  Document.prototype.priority = Infinity;

  Document.prototype.Selector = require('../commands/Selector');

  Document.prototype.Stylesheet = require('../commands/Stylesheet');

  function Document() {
    var state,
      _this = this;
    Document.__super__.constructor.apply(this, arguments);
    if (this.scope.nodeType === 9) {
      state = this.scope.readyState;
      if (state !== 'complete' && state !== 'loaded' && (state !== 'interactive' || document.documentMode)) {
        document.addEventListener('DOMContentLoaded', this.engine, false);
        document.addEventListener('readystatechange', this.engine, false);
        window.addEventListener('load', this.engine, false);
      } else {
        setTimeout(function() {
          if (!_this.engine.running) {
            return _this.engine.compile();
          }
        }, 10);
      }
    }
    this.Selector.observe(this.engine);
    this.scope.addEventListener('scroll', this.engine, true);
    if (typeof window !== "undefined" && window !== null) {
      window.addEventListener('resize', this.engine, true);
    }
  }

  Document.prototype.events = {
    apply: function() {
      return this.document.Selector.disconnect(this, true);
    },
    write: function(solution) {
      return this.document.Stylesheet.rematch(this);
    },
    flush: function() {
      return this.document.Selector.connect(this, true);
    },
    remove: function(path) {
      return this.document.Stylesheet.remove(this, path);
    },
    compile: function() {
      var _ref;
      this.solve(this.document.Stylesheet.operations);
      return (_ref = this.document.Selector) != null ? _ref.connect(this, true) : void 0;
    },
    solve: function() {
      var html, id, klass, _i, _len, _ref;
      if (this.scope.nodeType === 9) {
        html = this.scope.body.parentNode;
        klass = html.className;
        if (klass.indexOf('gss-ready') === -1) {
          this.document.Selector.disconnect(this, true);
          html.className = (klass && klass + ' ' || '') + 'gss-ready';
          this.document.Selector.connect(this, true);
        }
      }
      if (this.document.removed) {
        _ref = this.document.removed;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          id = _ref[_i];
          this.identity.unset(id);
        }
        return this.document.removed = void 0;
      }
    },
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
        if (_this.updating && !_this.updating.resizing) {
          _this.updating.resizing = 'scheduled';
          return;
        }
        return _this.solve('Resize', id, function() {
          this.intrinsic.verify(id, "width");
          this.intrinsic.verify(id, "height");
          this.intrinsic.verify(this.scope, "width");
          this.intrinsic.verify(this.scope, "height");
        });
      });
    },
    scroll: function(e) {
      var id;
      if (e == null) {
        e = '::window';
      }
      id = e.target && this.identify(e.target) || e;
      return this.solve('Scroll', id, function() {
        this.intrinsic.verify(id, "scroll-top");
        this.intrinsic.verify(id, "scroll-left");
      });
    },
    DOMContentLoaded: function() {
      document.removeEventListener('DOMContentLoaded', this);
      this.compile();
      return this.solve('Ready', function() {});
    },
    readystatechange: function() {
      if (this.running && document.readyState === 'complete') {
        return this.solve('Statechange', function() {});
      }
    },
    load: function() {
      window.removeEventListener('load', this);
      document.removeEventListener('DOMContentLoaded', this);
      return this.solve('Loaded', function() {});
    },
    destroy: function() {
      this.scope.removeEventListener('DOMContentLoaded', this);
      this.scope.removeEventListener('scroll', this);
      window.removeEventListener('resize', this);
      return this.document.Selector.disconnect(this, true);
    }
  };

  Document.condition = function() {
    return this.scope != null;
  };

  Document.prototype.url = null;

  return Document;

})(Abstract);

module.exports = Document;
