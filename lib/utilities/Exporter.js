var Exporter,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Exporter = (function() {
  function Exporter(engine) {
    var _ref;
    this.engine = engine;
    this.postexport = __bind(this.postexport, this);
    this.preexport = __bind(this.preexport, this);
    if (!(this.command = (_ref = location.search.match(/export=([a-z0-9]+)/)) != null ? _ref[1] : void 0)) {
      return;
    }
    engine.addEventListener('precompile', this.preexport);
  }

  Exporter.prototype.preexport = function() {
    var baseline, element, height, pairs, scope, width, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4, _ref5,
      _this = this;
    if ((scope = this.engine.scope).nodeType === 9) {
      scope = this.engine.scope.body;
    }
    this.engine.identify(scope);
    _ref = scope.getElementsByTagName('*');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      element = _ref[_i];
      if (element.tagName !== 'SCRIPT' && (element.tagName !== 'STYLE' || ((_ref1 = element.getAttribute('type')) != null ? _ref1.indexOf('gss') : void 0) > -1)) {
        this.engine.identify(element);
      }
    }
    if (window.Sizes) {
      this.sizes = [];
      _ref2 = window.Sizes;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        pairs = _ref2[_j];
        _ref3 = pairs[0];
        for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
          width = _ref3[_k];
          _ref4 = pairs[1];
          for (_l = 0, _len3 = _ref4.length; _l < _len3; _l++) {
            height = _ref4[_l];
            this.sizes.push(width + 'x' + height);
          }
        }
      }
    }
    if (this.command.indexOf('x') > -1) {
      _ref5 = this.command.split('x'), width = _ref5[0], height = _ref5[1];
      baseline = 72;
      width = parseInt(width) * baseline;
      height = parseInt(height) * baseline;
      window.addEventListener('load', function() {
        localStorage[_this.command] = JSON.stringify(_this["export"]());
        return _this.postexport();
      });
      document.body.style.width = width + 'px';
      this.engine.intrinsic.properties['::window[height]'] = function() {
        return height;
      };
      return this.engine.intrinsic.properties['::window[width]'] = function() {
        return width;
      };
    } else {
      if (this.command === 'true') {
        localStorage.clear();
        return this.postexport();
      }
    }
  };

  Exporter.prototype.postexport = function() {
    var property, result, size, value, _i, _len, _ref;
    _ref = this.sizes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      size = _ref[_i];
      if (!localStorage[size]) {
        location.search = location.search.replace(/[&?]export=([a-z0-9])+/, '') + '?export=' + size;
        return;
      }
    }
    result = {};
    for (property in localStorage) {
      value = localStorage[property];
      if (property.match(/^\d+x\d+$/)) {
        result[property] = JSON.parse(value);
      }
    }
    return document.write(JSON.stringify(result));
  };

  Exporter.prototype["export"] = function() {
    var id, index, path, property, value, values, _ref;
    values = {};
    _ref = this.engine.values;
    for (path in _ref) {
      value = _ref[path];
      if ((index = path.indexOf('[')) > -1 && path.indexOf('"') === -1) {
        property = this.engine.intrinsic.camelize(path.substring(index + 1, path.length - 1));
        id = path.substring(0, index);
        if (property === 'x' || property === 'y' || document.body.style[property] !== void 0) {
          if (this.engine.values[id + '[intrinsic-' + property + ']'] == null) {
            values[path] = Math.ceil(value);
          }
        }
      }
    }
    values.stylesheets = this.engine.document.Stylesheet["export"]();
    return values;
  };

  return Exporter;

})();

module.exports = Exporter;
